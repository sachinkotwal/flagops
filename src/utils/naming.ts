export const NAMING_PATTERN = /^[a-z]+_[a-z][a-z0-9]*(_[a-z][a-z0-9]*)*$/;
export const STALE_DAYS_THRESHOLD = 90;

export function isValidName(key: string): boolean {
  return NAMING_PATTERN.test(key);
}

export function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export interface FlagViolation {
  type: 'naming' | 'no-owner' | 'no-team' | 'no-description' | 'stale' | 'no-governance';
  label: string;
  severity: 'error' | 'warning';
}

export function getViolations(flag: any): FlagViolation[] {
  const violations: FlagViolation[] = [];

  if (!isValidName(flag.key)) {
    violations.push({ type: 'naming', label: 'Invalid Naming Pattern', severity: 'error' });
  }
  if (!flag.owner) {
    violations.push({ type: 'no-owner', label: 'Missing Owner', severity: 'error' });
  }
  if (!flag.team) {
    violations.push({ type: 'no-team', label: 'Missing Team', severity: 'error' });
  }
  if (!flag.description) {
    violations.push({ type: 'no-description', label: 'Missing Description', severity: 'warning' });
  }
  if (daysSince(flag.updated_time) > STALE_DAYS_THRESHOLD) {
    violations.push({ type: 'stale', label: `Stale Flag (${daysSince(flag.updated_time)} days)`, severity: 'warning' });
  }
  if (!flag.hasGovernance) {
    violations.push({ type: 'no-governance', label: 'No Governance Meta', severity: 'warning' });
  }

  return violations;
}

export function getHealthScore(flags: any[]): number {
  if (flags.length === 0) return 100;
  const flagsWithViolations = flags.filter(f => getViolations(f).length > 0).length;
  return Math.round(((flags.length - flagsWithViolations) / flags.length) * 100);
}

export function suggestFlagKey(team: string, featureName: string): string {
  const cleanFeature = featureName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${team.toLowerCase()}_${cleanFeature}`;
}
