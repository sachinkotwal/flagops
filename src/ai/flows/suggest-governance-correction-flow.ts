'use server';
/**
 * @fileOverview An AI agent that suggests corrections for feature flag governance violations.
 *
 * - suggestGovernanceCorrection - A function that provides AI-powered suggestions for correcting flag governance issues.
 * - SuggestGovernanceCorrectionInput - The input type for the suggestGovernanceCorrection function.
 * - SuggestGovernanceCorrectionOutput - The return type for the suggestGovernanceCorrection function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { daysSince, isValidName } from '@/utils/naming'; // Assuming these utils are available as per project structure

const SettingsSchema = z.object({
  teams: z.array(z.string()).describe('List of all valid teams.'),
  namingPattern: z.string().describe('Regex pattern for valid flag keys.').default('^[a-z]+_[a-z][a-z0-9]*(_[a-z][a-z0-9]*)*$'),
  namingDescription: z.string().describe('Description of the naming pattern.').default('{team}_{feature}_{detail}'),
  staleDaysThreshold: z.number().int().describe('Number of days after which a flag is considered stale.').default(90),
  owners: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    team: z.string(),
  })).describe('List of all available owners with their team.'),
});

const OptimizelyFlagSchema = z.object({
  key: z.string().describe('The unique identifier for the flag.'),
  name: z.string().describe('The display name of the flag.'),
  description: z.string().optional().describe('A brief explanation of the flag purpose.'),
  created_time: z.string().datetime().describe('Timestamp when the flag was created in Optimizely.'),
  updated_time: z.string().datetime().describe('Timestamp when the flag was last updated in Optimizely.'),
  archived: z.boolean().describe('Whether the flag is archived.'),
  // Add other Optimizely fields if they are ever needed for suggestions
  // environments: z.record(z.string(), z.any()),
  // variable_definitions: z.record(z.string(), z.any()),
});

const MergedFlagSchema = OptimizelyFlagSchema.extend({
  owner: z.string().nullable().describe('Assigned owner of the flag from Firestore governance data.'),
  ownerEmail: z.string().email().nullable().describe('Email of the assigned owner.'),
  team: z.string().nullable().describe('Assigned team for the flag from Firestore governance data.'),
  notes: z.string().optional().describe('Additional governance notes.'),
  hasGovernance: z.boolean().describe('Indicates if this flag has an associated Firestore governance record.'),
});

const SuggestGovernanceCorrectionFlowInputSchema = z.object({
  flag: MergedFlagSchema.describe('The merged feature flag data from Optimizely and Firestore.').openapi('Flag'),
  settings: SettingsSchema.describe('Application settings including naming patterns, teams, and owners.').openapi('Settings'),
});
export type SuggestGovernanceCorrectionInput = z.infer<typeof SuggestGovernanceCorrectionFlowInputSchema>;

const SuggestGovernanceCorrectionOutputSchema = z.object({
  suggestedKey: z.string().nullable().describe('Suggested new flag key following naming conventions, if current key is invalid.'),
  suggestedOwner: z.string().nullable().describe('Suggested owner from available owners, if current owner is missing.'),
  suggestedTeam: z.string().nullable().describe('Suggested team from available teams, if current team is missing.'),
  suggestedDescription: z.string().nullable().describe('Suggested description for the flag, if current description is missing.'),
  suggestedActionForStaleFlag: z.string().nullable().describe('Suggested action for a stale flag (e.g., review for archival).'),
});
export type SuggestGovernanceCorrectionOutput = z.infer<typeof SuggestGovernanceCorrectionOutputSchema>;

// Utility to determine violations, mimicking src/utils/naming.js behavior
// This is re-implemented here to avoid circular dependencies if src/utils/naming.js were to import this flow,
// and to explicitly list what constitutes a violation for the AI prompt.
function getViolationsForAI(flag: z.infer<typeof MergedFlagSchema>, settings: z.infer<typeof SettingsSchema>): string[] {
  const v: string[] = [];
  // Use the provided isValidName function from '@/utils/naming'
  if (!isValidName(flag.key)) v.push('naming');
  if (!flag.owner) v.push('no-owner');
  if (!flag.team) v.push('no-team');
  if (!flag.description) v.push('no-description');
  if (daysSince(flag.updated_time) > settings.staleDaysThreshold) v.push('stale');
  if (!flag.hasGovernance) v.push('no-governance'); // This might be handled before calling AI, but included for completeness
  return v;
}

const suggestCorrectionPrompt = ai.definePrompt({
  name: 'suggestGovernanceCorrectionPrompt',
  input: { schema: z.object({
    flag: MergedFlagSchema,
    violations: z.array(z.string()),
    allTeams: z.array(z.string()),
    allOwners: z.array(z.object({ name: z.string(), email: z.string().email(), team: z.string() })),
    namingPattern: z.string(),
    namingDescription: z.string(),
    staleDaysThreshold: z.number().int(),
  })},
  output: { schema: SuggestGovernanceCorrectionOutputSchema },
  prompt: `You are an expert governance assistant for feature flags. Your goal is to identify issues and provide actionable, context-aware suggestions to improve the health and consistency of feature flags. You will output your suggestions in JSON format.

Current Flag Details:
- Key: {{{flag.key}}}
- Name: {{{flag.name}}}
- Description: {{{flag.description}}}
- Owner: {{{flag.owner}}}
- Team: {{{flag.team}}}
- Last Modified: {{{flag.updated_time}}}
- Is Archived: {{{flag.archived}}}

Detected Violations:
{{#each violations}}- {{{this}}}
{{/each}}

Available Teams: {{json allTeams}}
Available Owners (Name, Email, Team): {{json allOwners}}
Naming Pattern for Flag Keys: {{{namingPattern}}} (e.g., {{{namingDescription}}})
A flag is considered stale if not modified in {{{staleDaysThreshold}}} days.

Based on the violations and available context, provide only the suggested corrections in JSON format.
If a suggestion is not applicable (e.g., no naming violation, so no new key is needed), set its value to null.
For naming suggestions, propose a new flag key that strictly follows the naming pattern. If the flag key already contains a team prefix, try to retain it.
For owner suggestions, pick a relevant owner from the 'Available Owners' list, preferably one associated with the suggested or existing team. If no clear owner is suitable, return null.
For team suggestions, pick a relevant team from the 'Available Teams' list.
For missing description, suggest a concise and clear description based on the flag's name and key.
For stale flags, suggest a concise action to take.

Strictly return a JSON object that matches the following structure:
` + '```json
' + JSON.stringify(SuggestGovernanceCorrectionOutputSchema.parse({})._cached.jsonSchema.properties, null, 2).replace(/