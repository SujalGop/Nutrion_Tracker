# Vercel Production Deployment Guide

Our architecture is fully serverless and designed specifically for Next.js on Vercel. There is no separate backend to deploy; everything (Frontend + API Routes) is handled by Vercel in a single deployment.

## Prerequisites
Make sure you have all your environment variables ready. You will need to add these to the Vercel Dashboard:
- `GEMINI_API_KEY`
- `FATSECRET_CLIENT_ID`
- `FATSECRET_CLIENT_SECRET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Option 1: Deploy via Vercel CLI (Fastest)

If you want to deploy directly from your local terminal:

1. Open your terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Run the Vercel CLI command:
   ```bash
   npx vercel
   ```
3. Follow the interactive prompts:
   - **Set up and deploy?** `Y`
   - **Which scope?** (Select your Vercel account)
   - **Link to existing project?** `N`
   - **What's your project's name?** `nutrition-tracker`
   - **In which directory is your code located?** `./`
   - **Want to modify these settings?** `N`
4. Once deployed, run the following command to securely upload your `.env.local` variables to Vercel:
   ```bash
   npx vercel env pull .env.local
   npx vercel env push
   ```
   *(Alternatively, copy-paste them manually in the Vercel Dashboard -> Project -> Settings -> Environment Variables)*
5. Finally, deploy to Production:
   ```bash
   npx vercel --prod
   ```

## Option 2: Deploy via GitHub (Recommended for CI/CD)

1. Commit your code and push it to a GitHub repository.
2. Go to [Vercel](https://vercel.com/new).
3. Import your GitHub repository.
4. Set the **Root Directory** to `frontend`.
5. Expand the **Environment Variables** section and paste in all the keys from your `.env.local` file.
6. Click **Deploy**.

## Post-Deployment Checklist
- [ ] Go to your Firebase Console -> Authentication -> Settings -> Authorized domains.
- [ ] Add your new `.vercel.app` domain to the list so Google Sign-In works in production!
