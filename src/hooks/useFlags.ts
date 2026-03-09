import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { listAllFlags, OptimizelyUnconfiguredError } from '@/lib/optimizely';
import {
  getAllGovernanceData,
  getGovernanceRecord,
  updateGovernanceData,
  getSettings,
  updateTeams,
  getUsers,
  syncFlagsToFirestore,
  upsertUsers,
  GovernanceManualFields,
} from '@/lib/firebase';
import { getFlag } from '@/lib/optimizely';

const PROJECT_ID = process.env.NEXT_PUBLIC_OPTIMIZELY_PROJECT_ID!;

// ── Query Keys ───────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  flags: ['optimizely-flags'] as const,
  governance: [PROJECT_ID, 'governance'] as const,
  settings: ['settings'] as const,
  users: ['users'] as const,
};

// ── Flags (from Optimizely) ──────────────────────────────────────────────────
export function useOptimizelyFlags() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.flags,
    queryFn: listAllFlags,
    retry: (failureCount, error) => {
      if (error instanceof OptimizelyUnconfiguredError) return false;
      return failureCount < 1;
    },
  });

  // After a successful fetch: sync API data into Firestore and upsert user emails.
  // After upsertUsers resolves, invalidate the users query so the owner dropdown refreshes.
  useEffect(() => {
    if (!query.data?.length) return;

    syncFlagsToFirestore(PROJECT_ID, query.data).catch(err =>
      console.error('Firestore flag sync failed:', err)
    );

    const emails = query.data
      .map(f => f.created_by_user_email)
      .filter(Boolean) as string[];

    upsertUsers(emails)
      .then(() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users }))
      .catch(err => console.error('Firestore user upsert failed:', err));
  }, [query.data, queryClient]);

  return query;
}

// ── Governance (from Firestore) ──────────────────────────────────────────────
export function useGovernanceData() {
  return useQuery({
    queryKey: QUERY_KEYS.governance,
    queryFn: () => getAllGovernanceData(PROJECT_ID),
    staleTime: 60 * 1000,
  });
}

// ── Settings ─────────────────────────────────────────────────────────────────
export function useSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: getSettings,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Users (owner roster) ─────────────────────────────────────────────────────
export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Merged flags ─────────────────────────────────────────────────────────────
export function useMergedFlags() {
  const flagsQuery = useOptimizelyFlags();
  const govQuery = useGovernanceData();

  const mergedFlags = useMemo(() => {
    if (!flagsQuery.data) return [];
    const gov = govQuery.data ?? {};
    return flagsQuery.data.map(flag => ({
      ...flag,
      // Manual governance from Firestore
      owner: gov[flag.key]?.owner ?? null,
      team: gov[flag.key]?.team ?? null,
      notes: gov[flag.key]?.notes ?? '',
      hasGovernance: !!gov[flag.key],
    }));
  }, [flagsQuery.data, govQuery.data]);

  return {
    flags: mergedFlags,
    isLoading: flagsQuery.isLoading || govQuery.isLoading,
    isError: flagsQuery.isError,
    error: flagsQuery.error,
    isUnconfigured: flagsQuery.error instanceof OptimizelyUnconfiguredError,
    lastSync: flagsQuery.dataUpdatedAt ? new Date(flagsQuery.dataUpdatedAt) : null,
    refetch: () => { flagsQuery.refetch(); govQuery.refetch(); },
    isFetching: flagsQuery.isFetching || govQuery.isFetching,
  };
}

// ── Single flag detail ───────────────────────────────────────────────────────
export function useFlagDetail(flagKey: string) {
  const flagQuery = useQuery({
    queryKey: ['flag', flagKey],
    queryFn: () => getFlag(flagKey),
    enabled: !!flagKey,
  });

  const govQuery = useQuery({
    queryKey: [...QUERY_KEYS.governance, flagKey],
    queryFn: () => getGovernanceRecord(PROJECT_ID, flagKey),
    enabled: !!flagKey,
    staleTime: 60 * 1000,
  });

  return {
    flag: flagQuery.data,
    governance: govQuery.data ?? null,
    isLoading: flagQuery.isLoading || govQuery.isLoading,
    isError: flagQuery.isError,
    error: flagQuery.error,
    refetch: () => { flagQuery.refetch(); govQuery.refetch(); },
    isFetching: flagQuery.isFetching || govQuery.isFetching,
  };
}

// ── Teams mutation ───────────────────────────────────────────────────────────
export function useUpdateTeams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teams: string[]) => updateTeams(teams),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings }),
  });
}

// ── Governance mutation ──────────────────────────────────────────────────────
export function useUpdateGovernance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flagKey, data }: { flagKey: string; data: Partial<GovernanceManualFields> }) =>
      updateGovernanceData(PROJECT_ID, flagKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.governance });
      // Refresh users in case a new owner email was introduced
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
}
