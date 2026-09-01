# Vercel Deployment Guide

This guide explains how to deploy the PayFlow frontend to Vercel.

## Prerequisites

- Vercel account (free at [vercel.com](https://vercel.com))
- Git repository with the frontend code
- npm installed

## Option 1: Deploy via Vercel CLI

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy from apps/web directory

```bash
cd /home/lynndabel/PayFlow/apps/web
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name?** → payflow-frontend (or your preferred name)
- **In which directory is your code located?** → ./
- **Want to override the settings?** → No (the vercel.json will be used)

### 4. Set Environment Variables

After initial deployment, set environment variables:

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-api-domain.com/api/v1

vercel env add NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE
# Enter: Test SDF Network ; September 2015

vercel env add NEXT_PUBLIC_STELLAR_HORIZON_URL
# Enter: https://horizon-testnet.stellar.org

vercel env add NEXT_PUBLIC_STELLAR_RPC_URL
# Enter: https://soroban-testnet.stellar.org

vercel env add NEXT_PUBLIC_STELLAR_USDC_ISSUER
# Enter: GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE

vercel env add NEXT_PUBLIC_STELLAR_USDC_CODE
# Enter: USDC

vercel env add NEXT_PUBLIC_CONTRACT_ID
# Enter: CBOPC7Z64MXDAQKHFM2TQYVCPG7BJY7VX6FQDWQENTOFJBL3AJEBKO7C
```

### 5. Deploy to Production

```bash
vercel --prod
```

## Option 2: Deploy via Vercel Dashboard

### 1. Push Code to GitHub

Ensure your code is pushed to a GitHub repository.

### 2. Import Project in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `apps/web` directory as the root directory

### 3. Configure Project

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next`

### 4. Set Environment Variables

In the Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_USDC_ISSUER=GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE
NEXT_PUBLIC_STELLAR_USDC_CODE=USDC
NEXT_PUBLIC_CONTRACT_ID=CBOPC7Z64MXDAQKHFM2TQYVCPG7BJY7VX6FQDWQENTOFJBL3AJEBKO7C
```

### 5. Deploy

Click "Deploy" to deploy your application.

## Post-Deployment

### Update API URL

After deployment, update the `NEXT_PUBLIC_API_URL` environment variable to point to your deployed API.

### Test the Deployment

1. Visit your Vercel deployment URL
2. Navigate to a payment link page
3. Test wallet connection with Freighter
4. Test payment flow on Stellar Testnet

## Troubleshooting

### Build Fails

If the build fails, check:
- npm is installed and working
- All dependencies are in package.json
- The build command works locally: `npm run build`

### Environment Variables Not Working

Ensure all environment variables start with `NEXT_PUBLIC_` to be exposed to the browser.

### Wallet Connection Issues

- Ensure Freighter wallet is installed
- Check that you're on Stellar Testnet
- Verify the contract ID is correct

## Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records as instructed by Vercel
