import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { OptimizelyFlag } from './optimizely';

// ── Client setup ─────────────────────────────────────────────────────────────

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined, // falls back to IAM role in production
});
const ddb = DynamoDBDocumentClient.from(client);

// ── Table constants ──────────────────────────────────────────────────────────

const GOVERNANCE_TABLE = 'flagops-governance';
const SETTINGS_TABLE = 'flagops-settings';
const USERS_TABLE = 'flagops-users';

// ── Types ────────────────────────────────────────────────────────────────────

/** Fields written by the Optimizely API sync (auto-populated, never manually edited) */
export interface GovernanceSyncFields {
  flagKey: string;
  flagId: number;
  name: string;
  description: string;
  createdByEmail: string | null;
  flagCreatedAt: string;
  flagUpdatedAt: string;
  archived: boolean;
  projectId: string;
  revision: number;
  /** Simplified env summary — enabled state and status only */
  environments: Record<string, { enabled: boolean; status: string; priority: number }>;
  lastSyncedAt: string;
}

/** Fields set manually via the governance UI */
export interface GovernanceManualFields {
  owner: string | null;
  team: string | null;
  notes: string;
  governanceUpdatedAt?: string;
  updatedByEmail?: string | null;
}

export type GovernanceRecord = GovernanceSyncFields & GovernanceManualFields;

export interface UserRecord {
  email: string;
  lastSeenAt: string;
}

export interface AppSettings {
  teams: string[];
  staleDaysThreshold: number;
  namingPattern?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  teams: ['Acquisitions', 'Originations', 'Auto', 'CIA', 'Content', 'OAE', 'Payments', 'Platform', 'Shared'],
  staleDaysThreshold: 90,
};

// ── Governance ───────────────────────────────────────────────────────────────

/** Read a single governance record for a flag key. */
export async function getGovernanceRecord(
  projectId: string,
  flagKey: string
): Promise<GovernanceRecord | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: GOVERNANCE_TABLE,
      Key: { flagKey },
    })
  );
  return result.Item ? (result.Item as GovernanceRecord) : null;
}

/** Read all governance records. Keyed by flag key. */
export async function getAllGovernanceData(
  projectId: string
): Promise<Record<string, GovernanceRecord>> {
  const data: Record<string, GovernanceRecord> = {};
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: GOVERNANCE_TABLE,
        ExclusiveStartKey: lastKey,
      })
    );
    result.Items?.forEach(item => {
      const rec = item as GovernanceRecord;
      data[rec.flagKey] = rec;
    });
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return data;
}

/** Save manual governance fields (owner, team, notes). Preserves API-synced fields. */
export async function updateGovernanceData(
  projectId: string,
  flagKey: string,
  data: Partial<GovernanceManualFields>
): Promise<void> {
  const fields = { ...data, governanceUpdatedAt: new Date().toISOString() };
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const setParts: string[] = [];

  Object.entries(fields).forEach(([key, value]) => {
    const alias = `#${key}`;
    const placeholder = `:${key}`;
    names[alias] = key;
    values[placeholder] = value;
    setParts.push(`${alias} = ${placeholder}`);
  });

  await ddb.send(
    new UpdateCommand({
      TableName: GOVERNANCE_TABLE,
      Key: { flagKey },
      UpdateExpression: `SET ${setParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

/**
 * Bulk-upsert API fields into governance records after an Optimizely sync.
 * Uses UpdateCommand so manually assigned owner/team/notes are never overwritten.
 * Processes in batches of 25 (parallel updates within each batch).
 */
export async function syncFlagsToDynamoDB(
  projectId: string,
  flags: OptimizelyFlag[]
): Promise<void> {
  const now = new Date().toISOString();
  const BATCH_SIZE = 25;

  for (let i = 0; i < flags.length; i += BATCH_SIZE) {
    const chunk = flags.slice(i, i + BATCH_SIZE);

    await Promise.all(
      chunk.map(flag => {
        // Strip verbose fields — store only what's useful
        const environments: GovernanceSyncFields['environments'] = {};
        Object.entries(flag.environments ?? {}).forEach(([key, env]) => {
          environments[key] = {
            enabled: env.enabled,
            status: env.status ?? '',
            priority: env.priority,
          };
        });

        return ddb.send(
          new UpdateCommand({
            TableName: GOVERNANCE_TABLE,
            Key: { flagKey: flag.key },
            UpdateExpression:
              'SET #flagId = :flagId, #name = :name, #description = :description, ' +
              '#createdByEmail = :createdByEmail, #flagCreatedAt = :flagCreatedAt, ' +
              '#flagUpdatedAt = :flagUpdatedAt, #archived = :archived, ' +
              '#projectId = :projectId, #revision = :revision, ' +
              '#environments = :environments, #lastSyncedAt = :lastSyncedAt',
            ExpressionAttributeNames: {
              '#flagId': 'flagId',
              '#name': 'name',
              '#description': 'description',
              '#createdByEmail': 'createdByEmail',
              '#flagCreatedAt': 'flagCreatedAt',
              '#flagUpdatedAt': 'flagUpdatedAt',
              '#archived': 'archived',
              '#projectId': 'projectId',
              '#revision': 'revision',
              '#environments': 'environments',
              '#lastSyncedAt': 'lastSyncedAt',
            },
            ExpressionAttributeValues: {
              ':flagId': flag.id,
              ':name': flag.name,
              ':description': flag.description || '',
              ':createdByEmail': flag.created_by_user_email || null,
              ':flagCreatedAt': flag.created_time,
              ':flagUpdatedAt': flag.updated_time,
              ':archived': flag.archived,
              ':projectId': projectId,
              ':revision': flag.revision,
              ':environments': environments,
              ':lastSyncedAt': now,
            },
          })
        );
      })
    );
  }
}

// ── Users (owner roster) ─────────────────────────────────────────────────────

/**
 * Upsert user emails extracted from Optimizely API responses.
 * Additive only — never deletes existing users.
 */
export async function upsertUsers(emails: string[]): Promise<void> {
  const unique = [...new Set(emails.filter(Boolean))];
  if (unique.length === 0) return;

  const now = new Date().toISOString();
  const BATCH_SIZE = 25;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const chunk = unique.slice(i, i + BATCH_SIZE);

    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [USERS_TABLE]: chunk.map(email => ({
            PutRequest: {
              Item: { email, lastSeenAt: now },
            },
          })),
        },
      })
    );
  }
}

/** Fetch all known users for the owner assignment dropdown. */
export async function getUsers(): Promise<UserRecord[]> {
  const users: UserRecord[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: USERS_TABLE,
        ExclusiveStartKey: lastKey,
      })
    );
    result.Items?.forEach(item => {
      users.push(item as UserRecord);
    });
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return users.sort((a, b) => a.email.localeCompare(b.email));
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const result = await ddb.send(
    new GetCommand({
      TableName: SETTINGS_TABLE,
      Key: { configKey: 'config' },
    })
  );
  return result.Item ? (result.Item as AppSettings) : DEFAULT_SETTINGS;
}

export async function updateTeams(teams: string[]): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: SETTINGS_TABLE,
      Key: { configKey: 'config' },
      UpdateExpression: 'SET #teams = :teams',
      ExpressionAttributeNames: { '#teams': 'teams' },
      ExpressionAttributeValues: { ':teams': teams },
    })
  );
}
