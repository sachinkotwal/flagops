// Calls the Optimizely REST API directly from the browser.
// Requires NEXT_PUBLIC_ prefixed env vars so they are available client-side.

const FLAGS_API =
  process.env.NEXT_PUBLIC_OPTIMIZELY_FLAGS_API_URL ?? 'https://api.optimizely.com/flags/v1';
const TOKEN = process.env.NEXT_PUBLIC_OPTIMIZELY_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_OPTIMIZELY_PROJECT_ID;

export interface OptimizelyEnvironment {
  key: string;
  name: string;
  enabled: boolean;
  has_restricted_permissions: boolean;
  priority: number;
  status: string;
  id: number;
  created_time: string;
}

export interface OptimizelyFlag {
  id: number;
  key: string;
  name: string;
  description: string;
  archived: boolean;
  project_id: number;
  created_time: string;
  updated_time: string;
  revision: number;
  created_by_user_id: string;
  created_by_user_email: string;
  environments: Record<string, OptimizelyEnvironment>;
  variable_definitions: Record<string, unknown>;
}

export class OptimizelyUnconfiguredError extends Error {
  constructor() {
    super(
      'Optimizely API credentials are not configured. Set NEXT_PUBLIC_OPTIMIZELY_API_TOKEN and NEXT_PUBLIC_OPTIMIZELY_PROJECT_ID in .env.local and restart the dev server.'
    );
    this.name = 'OptimizelyUnconfiguredError';
  }
}

interface FlagsPageResponse {
  items: OptimizelyFlag[];
  next_url: string[] | null;
  total_count: number;
}

async function fetchFlagsPage(url: string): Promise<FlagsPageResponse> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.message || `Optimizely API error: ${res.status}`);
  }

  return res.json();
}

export async function getFlag(flagKey: string): Promise<OptimizelyFlag> {
  if (!TOKEN || !PROJECT_ID) throw new OptimizelyUnconfiguredError();

  const res = await fetch(
    `${FLAGS_API}/projects/${PROJECT_ID}/flags/${flagKey}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.message || `Optimizely API error: ${res.status}`);
  }

  return res.json();
}

export async function listAllFlags(): Promise<OptimizelyFlag[]> {
  if (!TOKEN || !PROJECT_ID) throw new OptimizelyUnconfiguredError();

  const allFlags: OptimizelyFlag[] = [];
  // next_url from the API is a relative path — prepend the base URL
  let nextPath: string | null =
    `/projects/${PROJECT_ID}/flags?per_page=500&sort=created_time%3Adesc&archived=false`;

  while (nextPath) {
    const data = await fetchFlagsPage(`${FLAGS_API}${nextPath}`);
    allFlags.push(...(data.items ?? []));
    // next_url is an array; empty array or missing means no more pages
    nextPath = data.next_url?.length ? data.next_url[0] : null;
  }

  return allFlags;
}
