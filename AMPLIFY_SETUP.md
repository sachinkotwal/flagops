# FlagOps — AWS Amplify Deployment Guide

Complete step-by-step guide to deploying FlagOps on AWS Amplify with DynamoDB, Okta SSO, and Optimizely integration.

---

## 1. Create DynamoDB Tables

Go to **AWS Console → DynamoDB → Create table** in the **us-east-1** region. Create the following three tables:

### flagops-governance
- **Table name**: `flagops-governance`
- **Partition key**: `flagKey` (String)
- **Sort key**: None
- **Capacity mode**: On-demand (pay-per-request)

### flagops-settings
- **Table name**: `flagops-settings`
- **Partition key**: `configKey` (String)
- **Sort key**: None
- **Capacity mode**: On-demand (pay-per-request)

### flagops-users
- **Table name**: `flagops-users`
- **Partition key**: `email` (String)
- **Sort key**: None
- **Capacity mode**: On-demand (pay-per-request)

All three tables use on-demand capacity so you only pay for actual read/write usage.

---

## 2. Create IAM User and Policy

1. Go to **AWS Console → IAM → Users → Create user**.
2. **User name**: `flagops-app`
3. Select **Programmatic access** (Access Key).
4. Do **not** attach any managed policies. Instead, go to the user's **Permissions** tab and add an **Inline policy** with the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/flagops-*"
    }
  ]
}
```

5. Name the policy `flagops-dynamodb-access`.
6. **Save the Access Key ID and Secret Access Key** — you will need them for Amplify environment variables in Step 4.

---

## 3. Connect GitHub Repo to Amplify

1. Go to **AWS Amplify Console** → **New App** → **Host Web App**.
2. Select **GitHub** as the source provider and authorize AWS Amplify to access your GitHub account.
3. Choose the **flagops** repository and select the **main** branch.
4. Amplify will auto-detect the Next.js framework and use the `amplify.yml` build spec included in the repository.
5. Click **Save and Deploy** to trigger the first build.

The initial build will fail if environment variables are not set — that is expected. Continue to Step 4.

---

## 4. Set Environment Variables in Amplify Console

After connecting the repo, go to **App Settings → Environment Variables** and add the following:

| Variable | Value | Description |
|----------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | *(from Step 2)* | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | *(from Step 2)* | IAM user secret key |
| `AWS_REGION` | `us-east-1` | AWS region for DynamoDB |
| `AUTH_SECRET` | *(generate below)* | NextAuth.js session encryption key |
| `AUTH_OKTA_ID` | *(from Okta app)* | Okta OAuth client ID |
| `AUTH_OKTA_SECRET` | *(from Okta app)* | Okta OAuth client secret |
| `AUTH_OKTA_ISSUER` | `https://<your-okta-domain>` | Okta issuer URL |
| `NEXTAUTH_URL` | `https://main.d1234abcd.amplifyapp.com` | Amplify domain (update after first deploy) |
| `OPTIMIZELY_API_TOKEN` | *(your token)* | Optimizely personal API token |
| `OPTIMIZELY_PROJECT_ID` | *(your project ID)* | Optimizely project ID |
| `GOOGLE_GENAI_API_KEY` | *(your key)* | Google AI API key for Genkit flow |

To generate `AUTH_SECRET`, run:

```bash
openssl rand -base64 32
```

After adding all variables, trigger a new build from the Amplify console.

---

## 5. Post-Deploy Updates

After the first successful deploy:

1. **Copy the Amplify domain** from the Amplify console (e.g., `https://main.d1234abcd.amplifyapp.com`).

2. **Update `NEXTAUTH_URL`** environment variable in Amplify to match your actual Amplify domain:
   ```
   https://<your-amplify-domain>
   ```

3. **Update Okta redirect URIs** — In the Okta Admin Console, go to your FlagOps application and add:
   - **Sign-in redirect URI**: `https://<your-amplify-domain>/api/auth/callback/okta`
   - **Sign-out redirect URI**: `https://<your-amplify-domain>`

4. **Redeploy** — trigger a new build from the Amplify console (or push a commit) for the URL change to take effect.

---

## 6. Verify Deployment

1. **Navigate to the Amplify URL** — you should be redirected to the Okta login page.
2. **Log in with Okta** — after authentication, the FlagOps dashboard should load with governance data from DynamoDB.
3. **Edit a flag's governance** — update owner, team, or notes for any flag and verify the record appears in the `flagops-governance` DynamoDB table via the AWS Console.
4. **Check the `flagops-users` table** — confirm that user emails synced from Optimizely appear in the table.

If any step fails, check the Amplify build logs and ensure all environment variables are set correctly.
