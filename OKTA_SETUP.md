# Okta OIDC App Setup for FlagOps

## Step 1: Create an Okta Application
1. Log in to your Okta Admin Console
2. Go to **Applications** > **Applications** > **Create App Integration**
3. Select **OIDC - OpenID Connect** as the sign-in method
4. Select **Web Application** as the application type
5. Click **Next**

## Step 2: Configure the App
- **App integration name**: FlagOps
- **Grant type**: Authorization Code (checked by default)
- **Sign-in redirect URIs**:
  - `http://localhost:8002/api/auth/callback/okta` (development)
  - `https://<your-amplify-domain>/api/auth/callback/okta` (production -- add after deploying)
- **Sign-out redirect URIs**:
  - `http://localhost:8002` (development)
  - `https://<your-amplify-domain>` (production)
- **Controlled access**: Assign to relevant users or groups

## Step 3: Get Your Credentials
After saving, note:
- **Client ID** -> `AUTH_OKTA_ID`
- **Client Secret** -> `AUTH_OKTA_SECRET`
- **Okta domain** (top-right of Admin Console) -> used to build `AUTH_OKTA_ISSUER`

## Step 4: Set Environment Variables
Add to `.env.local`:
```env
AUTH_SECRET=<run: openssl rand -base64 32>
AUTH_OKTA_ID=<client id from step 3>
AUTH_OKTA_SECRET=<client secret from step 3>
AUTH_OKTA_ISSUER=https://<your-okta-domain>
NEXTAUTH_URL=http://localhost:8002
```

## Step 5: Verify
1. Run `npm run dev`
2. Navigate to `http://localhost:8002` -- should redirect to `/login`
3. Click "Sign in with Okta" -- should redirect to Okta login page
4. After login -- should return to FlagOps dashboard
