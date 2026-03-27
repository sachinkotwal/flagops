# FlagOps — Deployment Guide

Complete step-by-step guide to deploy FlagOps on AWS Amplify with DynamoDB.
Auth is disabled for the initial deployment so you can verify everything works first.

---

## Prerequisites

Before starting, make sure you have:

- [ ] An AWS account with console access
- [ ] [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed (`aws --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] The FlagOps repo pushed to GitHub

---

## Phase 1 — AWS CLI Setup

### Step 1: Create an IAM user for CDK deployments (if you don't have one)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam) → **Users** → **Create user**
2. Username: `cdk-deployer` (or any name)
3. Click **Next** → **Attach policies directly**
4. Attach **AdministratorAccess** (CDK needs broad permissions to provision resources)
5. Click **Create user**
6. Open the user → **Security credentials** tab → **Create access key**
7. Choose **Command Line Interface (CLI)** → **Next** → **Create access key**
8. Copy the **Access key ID** and **Secret access key** — you won't see the secret again

### Step 2: Configure AWS CLI

Run in your terminal:

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID:     <paste access key ID from step 1>
AWS Secret Access Key: <paste secret access key from step 1>
Default region name:   us-east-1
Default output format: json
```

Verify it works:
```bash
aws sts get-caller-identity
```

You should see your account ID and user ARN printed. If you get an error, recheck the credentials.

---

## Phase 2 — Deploy AWS Infrastructure (CDK)

This creates the 3 DynamoDB tables and the `flagops-app` IAM user with access keys.

### Step 3: Bootstrap CDK (one-time per AWS account)

CDK needs an S3 bucket and some resources in your account to operate. This is a one-time setup:

```bash
npm run infra:bootstrap
```

Expected output: `✅ Environment aws://<account-id>/us-east-1 bootstrapped.`

> If you see "This CDK CLI is not compatible", run `cd infrastructure && npm install` first.

### Step 4: Deploy the infrastructure stack

```bash
npm run infra:deploy
```

CDK will show you a diff of what it's about to create:
```
FlagOpsStack: deploying...

✅ FlagOpsStack

Outputs:
FlagOpsStack.AwsAccessKeyId     = AKIA...
FlagOpsStack.AwsSecretAccessKey = abc123...
FlagOpsStack.GovernanceTableName = flagops-governance
FlagOpsStack.SettingsTableName   = flagops-settings
FlagOpsStack.UsersTableName      = flagops-users
```

A file `cdk-outputs.json` is also written at the repo root with the same values.

### Step 5: Copy the access keys to .env.local

Open `cdk-outputs.json` and copy the two key values into `.env.local`:

```env
AWS_ACCESS_KEY_ID=<value of AwsAccessKeyId from cdk-outputs.json>
AWS_SECRET_ACCESS_KEY=<value of AwsSecretAccessKey from cdk-outputs.json>
AWS_REGION=us-east-1
```

> `cdk-outputs.json` is gitignored — it will never be committed.

### Step 6: Verify tables were created

```bash
aws dynamodb list-tables --region us-east-1
```

Expected output:
```json
{
  "TableNames": [
    "flagops-governance",
    "flagops-settings",
    "flagops-users"
  ]
}
```

---

## Phase 3 — Test Locally Before Deploying

### Step 7: Install dependencies and run locally

```bash
npm install
npm run dev
```

Open http://localhost:8002 — the dashboard should load without any login prompt (auth is disabled).

Test that DynamoDB is working:
1. Click on any flag → edit the governance fields (owner, team, notes) → Save
2. Run this command to confirm the record was written:

```bash
aws dynamodb scan --table-name flagops-governance --region us-east-1 --max-items 1
```

You should see the saved record in the output. If this works, your app is correctly connected to DynamoDB.

---

## Phase 4 — Deploy to AWS Amplify

### Step 8: Push your code to GitHub

Make sure your latest code (including `amplify.yml`) is pushed to your main branch:

```bash
git add .
git commit -m "aws migration: dynamodb + cdk + amplify config"
git push origin main
```

### Step 9: Connect GitHub repo to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **Create new app**
3. Choose **GitHub** → Click **Authorize AWS Amplify**
4. Search for and select your **flagops** repository
5. Select branch: **main** (or your deployment branch)
6. Click **Next**

### Step 10: Configure build settings

1. Amplify will auto-detect Next.js and show build settings
2. It will also detect the `amplify.yml` file — it should show:
   - Build command: `npm run build`
   - Output directory: `.next`
3. Leave these as-is and click **Next**

### Step 11: Set environment variables

On the "Configure advanced settings" screen, click **Add environment variable** for each of these:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_OPTIMIZELY_API_TOKEN` | your Optimizely personal access token |
| `NEXT_PUBLIC_OPTIMIZELY_PROJECT_ID` | your Optimizely project ID |
| `NEXT_PUBLIC_OPTIMIZELY_FLAGS_API_URL` | `https://api.app.optimizely.com/flags` |
| `NEXT_PUBLIC_OPTIMIZELY_BASE_API_URL` | `https://api.optimizely.com/v2` |
| `AWS_ACCESS_KEY_ID` | value from `cdk-outputs.json` |
| `AWS_SECRET_ACCESS_KEY` | value from `cdk-outputs.json` |
| `AWS_REGION` | `us-east-1` |
| `AUTH_ENABLED` | `false` |
| `AUTH_SECRET` | run `openssl rand -base64 32` and paste the result |
| `GOOGLE_GENAI_API_KEY` | your Google AI Studio API key (optional) |

> `AUTH_OKTA_ID`, `AUTH_OKTA_SECRET`, `AUTH_OKTA_ISSUER`, `NEXTAUTH_URL` are NOT needed yet — skip them while auth is disabled.

### Step 12: Save and deploy

1. Click **Save and deploy**
2. Amplify starts the first build — this takes 3–5 minutes
3. Watch the build logs for any errors

### Step 13: Verify the Amplify deployment

1. Once the build shows **Deployment successful**, click the generated URL
   (looks like `https://main.d1234abcdef.amplifyapp.com`)
2. The FlagOps dashboard should load without any login prompt
3. Repeat the governance save test from Step 7 to confirm DynamoDB is working in production

---

## Phase 5 — Enable Auth (Okta SSO)

Do this after you've confirmed the app is working end-to-end.

### Step 14: Create the Okta application

See `OKTA_SETUP.md` for the full Okta setup guide. Summary:

1. Okta Admin Console → **Applications** → **Create App Integration**
2. Sign-in method: **OIDC**, App type: **Web Application**
3. Sign-in redirect URI: `https://<your-amplify-domain>/api/auth/callback/okta`
4. Sign-out redirect URI: `https://<your-amplify-domain>`
5. Note the **Client ID** and **Client Secret**

### Step 15: Add Okta env vars to Amplify

In Amplify Console → App Settings → **Environment variables**, add:

| Variable | Value |
|---|---|
| `AUTH_OKTA_ID` | Okta Client ID |
| `AUTH_OKTA_SECRET` | Okta Client Secret |
| `AUTH_OKTA_ISSUER` | `https://<your-okta-domain>.okta.com` |
| `NEXTAUTH_URL` | `https://<your-amplify-domain>` |
| `AUTH_ENABLED` | `true` ← this flips auth on |

### Step 16: Redeploy

In Amplify Console, click **Redeploy this version** (or push a new commit).

After deploy:
- Visiting the app redirects to Okta login
- After login, the dashboard loads
- Sidebar shows your email + Sign Out button
- Governance saves record `updatedByEmail` in DynamoDB

---

## Quick reference

```bash
# Run locally
npm run dev

# Deploy/update AWS infrastructure (DynamoDB tables + IAM)
npm run infra:deploy

# Preview infrastructure changes before applying
npm run infra:diff

# Tear down infrastructure (tables are retained, data is safe)
npm run infra:destroy
```

## Updating the app after code changes

Just push to the connected GitHub branch — Amplify auto-deploys on every push.

```bash
git push origin main   # triggers Amplify build automatically
```

## Troubleshooting

**Build fails with "Cannot find module '@aws-sdk/...'"**
→ Make sure `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` are in `package.json` dependencies (not devDependencies).

**DynamoDB access denied error in logs**
→ Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in Amplify env vars match `cdk-outputs.json` exactly.

**App loads but flags don't appear**
→ Check `NEXT_PUBLIC_OPTIMIZELY_API_TOKEN` and `NEXT_PUBLIC_OPTIMIZELY_PROJECT_ID` are set correctly in Amplify env vars.

**Amplify build succeeds but shows blank page**
→ Open browser console. If you see a Next.js hydration error, check that all `NEXT_PUBLIC_` env vars are set (they're baked into the client bundle at build time).
