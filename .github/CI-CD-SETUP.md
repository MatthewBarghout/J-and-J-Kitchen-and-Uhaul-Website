# CI/CD Pipeline Setup

## GitHub Secrets Required

For this pipeline to work, you need these secrets in your GitHub repository:

### 1. GITHUB_TOKEN 
- **Already available** - GitHub provides this automatically
- No action needed

### 2. FIREBASE_SERVICE_ACCOUNT_J_AND_J_F8F66
- **Required** - Service account key for Firebase deployment
- Get this from: https://console.firebase.google.com/project/j-and-j-f8f66/settings/serviceaccounts/adminsdk

#### To set up the service account:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the entire JSON content
4. Go to GitHub → Repository Settings → Secrets and Variables → Actions
5. Create new secret named: `FIREBASE_SERVICE_ACCOUNT_J_AND_J_F8F66`
6. Paste the JSON content as the value

## Pipeline Process

1. **Trigger**: Push to main branch
2. **Install**: npm ci (clean install)
3. **Build**: npm run build
4. **Functions**: Install functions dependencies
5. **Deploy**: Firebase hosting deployment

## Manual Deployment (Backup)

If CI/CD fails, manual deployment always works:
```bash
npm run build
firebase deploy
```

## Troubleshooting

- If deployment fails, check GitHub Actions logs
- Ensure Firebase service account has proper permissions
- Verify project ID matches: `j-and-j-f8f66`