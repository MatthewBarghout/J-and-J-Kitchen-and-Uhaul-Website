# CI/CD Setup Instructions

## Setup GitHub Actions for Automatic Deployment

### 1. Generate Firebase Token
```bash
firebase login:ci
```
Copy the token that gets printed.

### 2. Add Firebase Token to GitHub Secrets
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from step 1
6. Click **Add secret**

### 3. How the Pipeline Works

**On Pull Request:**
- ✅ Runs tests and builds the app
- ✅ Deploys a preview version
- ✅ Comments on PR with preview URL
- ✅ Preview expires in 7 days

**On Push to Main:**
- ✅ Runs tests and builds the app
- ✅ Deploys to production: https://j-and-j-f8f66.web.app
- ✅ Automatically updates live site

### 4. Development Workflow

```bash
# Create feature branch
git checkout -b feature/new-menu-item

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Add new menu item"
git push origin feature/new-menu-item

# Create pull request on GitHub
# → Preview deployment automatically created
# → Team can review changes on preview URL

# Merge to main
# → Automatically deploys to production
```

### 5. Manual Deployment (if needed)
```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

## Pipeline Features
- 🧪 **Automated testing** on every change
- 🔍 **Preview deployments** for pull requests  
- 🚀 **Automatic production deployment** when merging to main
- 🔒 **Secure credential management** via GitHub Secrets
- ⚡ **Fast builds** with dependency caching