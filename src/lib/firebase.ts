import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, collection, doc, getDoc, getDocs, 
  setDoc, query, where 
} from "firebase/firestore";

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

// Mock Governance Data for when DB is not reachable or empty
const MOCK_GOVERNANCE = {
  "platform_dark_mode": { owner: "Sarah Chen", ownerEmail: "sarah@company.com", team: "Platform", notes: "Core dark mode toggle" },
  "growth_onboarding_v2": { owner: "Marcus Johnson", ownerEmail: "marcus@company.com", team: "Growth", notes: "New onboarding flow" },
  "checkout_express_pay": { owner: "Elena Rodriguez", ownerEmail: "elena@company.com", team: "Checkout", notes: "One-click express pay" },
  "mobile_push_notifications": { owner: "Aisha Mohammed", ownerEmail: "aisha@company.com", team: "Mobile", notes: "Push system" },
};

export async function getAllGovernanceData() {
  try {
    const snap = await getDocs(collection(db, "governance"));
    const data: Record<string, any> = {};
    snap.forEach(doc => { data[doc.id] = doc.data(); });
    
    if (Object.keys(data).length === 0) return MOCK_GOVERNANCE;
    return data;
  } catch (error) {
    return MOCK_GOVERNANCE;
  }
}

export async function updateGovernanceData(flagKey: string, data: any) {
  try {
    await setDoc(doc(db, "governance", flagKey), {
      ...data,
      flagKey,
      governanceUpdatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error("Failed to update governance data", error);
  }
}

export async function getSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "config"));
    if (snap.exists()) return snap.data();
    return {
      teams: ["Platform", "Growth", "Checkout", "Search", "Mobile", "Infra"],
      staleDaysThreshold: 90,
      owners: [
        { name: "Sarah Chen", email: "sarah@company.com", team: "Platform" },
        { name: "Marcus Johnson", email: "marcus@company.com", team: "Growth" },
        { name: "Priya Patel", email: "priya@company.com", team: "Checkout" },
        { name: "James O'Brien", email: "james@company.com", team: "Search" },
        { name: "Aisha Mohammed", email: "aisha@company.com", team: "Mobile" },
        { name: "David Kim", email: "david@company.com", team: "Infra" },
      ]
    };
  } catch (error) {
    return {
      teams: ["Platform", "Growth", "Checkout", "Search", "Mobile", "Infra"],
      staleDaysThreshold: 90,
      owners: [
        { name: "Sarah Chen", email: "sarah@company.com", team: "Platform" },
        { name: "Marcus Johnson", email: "marcus@company.com", team: "Growth" }
      ]
    };
  }
}
