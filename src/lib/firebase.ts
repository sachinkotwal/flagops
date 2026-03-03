import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, doc, getDoc, getDocs,
  setDoc, writeBatch,
} from 'firebase/firestore';
import type { OptimizelyFlag } from './optimizely';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

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
  teams: ['Platform', 'Growth', 'Checkout', 'Search', 'Mobile', 'Infra'],
  staleDaysThreshold: 90,
};

// ── Governance ───────────────────────────────────────────────────────────────

/** Read a single governance doc for a flag key. */
export async function getGovernanceRecord(
  projectId: string,
  flagKey: string
): Promise<GovernanceRecord | null> {
  const snap = await getDoc(doc(db, 'projects', projectId, 'governance', flagKey));
  return snap.exists() ? (snap.data() as GovernanceRecord) : null;
}

/** Read all governance docs for a project. Keyed by flag key. */
export async function getAllGovernanceData(
  projectId: string
): Promise<Record<string, GovernanceRecord>> {
  const snap = await getDocs(collection(db, 'projects', projectId, 'governance'));
  const data: Record<string, GovernanceRecord> = {};
  snap.forEach(d => { data[d.id] = d.data() as GovernanceRecord; });
  return data;
}

/** Save manual governance fields (owner, team, notes). merge:true preserves API-synced fields. */
export async function updateGovernanceData(
  projectId: string,
  flagKey: string,
  data: Partial<GovernanceManualFields>
): Promise<void> {
  await setDoc(
    doc(db, 'projects', projectId, 'governance', flagKey),
    { ...data, governanceUpdatedAt: new Date().toISOString() },
    { merge: true }
  );
}

/**
 * Bulk-upsert API fields into governance docs after an Optimizely sync.
 * Uses merge:true so manually assigned owner/team/notes are never overwritten.
 * Batches in groups of 499 to stay under Firestore's 500-op limit.
 */
export async function syncFlagsToFirestore(
  projectId: string,
  flags: OptimizelyFlag[]
): Promise<void> {
  const now = new Date().toISOString();
  const BATCH_SIZE = 499;

  for (let i = 0; i < flags.length; i += BATCH_SIZE) {
    const chunk = flags.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(flag => {
      const ref = doc(db, 'projects', projectId, 'governance', flag.key);

      // Strip verbose fields (rules_detail, enable_url, etc.) — store only what's useful
      const environments: GovernanceSyncFields['environments'] = {};
      Object.entries(flag.environments ?? {}).forEach(([key, env]) => {
        environments[key] = {
          enabled: env.enabled,
          status: env.status ?? '',
          priority: env.priority,
        };
      });

      const syncFields: GovernanceSyncFields = {
        flagKey: flag.key,
        flagId: flag.id,
        name: flag.name,
        description: flag.description || '',
        createdByEmail: flag.created_by_user_email || null,
        flagCreatedAt: flag.created_time,
        flagUpdatedAt: flag.updated_time,
        archived: flag.archived,
        projectId,
        revision: flag.revision,
        environments,
        lastSyncedAt: now,
      };

      batch.set(ref, syncFields, { merge: true });
    });

    await batch.commit();
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
  const batch = writeBatch(db);

  unique.forEach(email => {
    batch.set(
      doc(db, 'users', email),
      { email, lastSeenAt: now },
      { merge: true } // preserves any existing fields; never deletes the doc
    );
  });

  await batch.commit();
}

/** Fetch all known users for the owner assignment dropdown. */
export async function getUsers(): Promise<UserRecord[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as UserRecord).sort((a, b) => a.email.localeCompare(b.email));
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const snap = await getDoc(doc(db, 'settings', 'config'));
  return snap.exists() ? (snap.data() as AppSettings) : DEFAULT_SETTINGS;
}
