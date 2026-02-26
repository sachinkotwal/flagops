const FLAGS_API = "https://api.optimizely.com/flags/v1";
const TOKEN = process.env.NEXT_PUBLIC_OPTIMIZELY_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_OPTIMIZELY_PROJECT_ID;

const MOCK_FLAGS = [
  { id: "1", key: "platform_dark_mode", name: "Dark Mode Toggle", description: "Enable dark mode for all users", updated_time: new Date(Date.now() - 5 * 86400000).toISOString(), created_time: new Date(Date.now() - 30 * 86400000).toISOString(), archived: false, environments: { production: { enabled: true }, staging: { enabled: true }, development: { enabled: true } } },
  { id: "2", key: "growth_onboarding_v2", name: "Onboarding V2", description: "New user onboarding experience", updated_time: new Date(Date.now() - 2 * 86400000).toISOString(), created_time: new Date(Date.now() - 10 * 86400000).toISOString(), archived: false, environments: { production: { enabled: false }, staging: { enabled: true }, development: { enabled: true } } },
  { id: "3", key: "NewCheckoutFlow", name: "New Checkout", description: "", updated_time: new Date(Date.now() - 15 * 86400000).toISOString(), created_time: new Date(Date.now() - 40 * 86400000).toISOString(), archived: false, environments: { production: { enabled: false }, staging: { enabled: false }, development: { enabled: true } } },
  { id: "4", key: "search-ranking-boost", name: "Search Boost", description: "Boost ranking for premium results", updated_time: new Date(Date.now() - 120 * 86400000).toISOString(), created_time: new Date(Date.now() - 200 * 86400000).toISOString(), archived: false, environments: { production: { enabled: true }, staging: { enabled: true }, development: { enabled: true } } },
  { id: "5", key: "mobile_push_notifications", name: "Push Notifications", description: "Enable push system", updated_time: new Date(Date.now() - 1 * 86400000).toISOString(), created_time: new Date(Date.now() - 90 * 86400000).toISOString(), archived: false, environments: { production: { enabled: true }, staging: { enabled: true }, development: { enabled: true } } },
  { id: "6", key: "GrowthReferralProgram", name: "Referral Program", description: "", updated_time: new Date(Date.now() - 100 * 86400000).toISOString(), created_time: new Date(Date.now() - 150 * 86400000).toISOString(), archived: false, environments: { production: { enabled: false }, staging: { enabled: false }, development: { enabled: true } } },
  { id: "7", key: "checkout_express_pay", name: "Express Payment", description: "One-click express pay", updated_time: new Date(Date.now() - 1 * 86400000).toISOString(), created_time: new Date(Date.now() - 20 * 86400000).toISOString(), archived: false, environments: { production: { enabled: true }, staging: { enabled: true }, development: { enabled: true } } },
  { id: "8", key: "temp_holiday_banner", name: "Holiday Banner", description: "Seasonal banner", updated_time: new Date(Date.now() - 180 * 86400000).toISOString(), created_time: new Date(Date.now() - 190 * 86400000).toISOString(), archived: false, environments: { production: { enabled: false }, staging: { enabled: false }, development: { enabled: false } } },
];

export async function listAllFlags() {
  if (!TOKEN || !PROJECT_ID) {
    console.warn("Optimizely API credentials missing, using mock data.");
    return MOCK_FLAGS;
  }

  try {
    const res = await fetch(`${FLAGS_API}/projects/${PROJECT_ID}/flags`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/json",
      }
    });
    if (!res.ok) throw new Error(`Optimizely API error: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch Optimizely flags", error);
    return MOCK_FLAGS;
  }
}
