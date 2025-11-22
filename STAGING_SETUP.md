# Staging Environment Setup - Frontend

This document explains the frontend staging configuration for Pinglo.

## Staging vs Production

| Environment | Branch | URL | Backend URL |
|------------|--------|-----|-------------|
| Production | `main` | https://pinglo-frontend.onrender.com | https://pinglo-backend.onrender.com |
| Staging | `staging` | https://pinglo-frontend-staging.onrender.com | https://pinglo-backend-staging.onrender.com |

## Deploy Staging Frontend on Render

### Step 1: Create New Static Site

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → Select **"Static Site"**

### Step 2: Connect Repository

- **Repository:** `Georgemuchir/pinglo-frontend`
- **Branch:** `staging` ⚠️ (Very important!)
- **Name:** `pinglo-frontend-staging`

### Step 3: Configure Build

- **Build Command:** `./build.sh`
- **Publish Directory:** `dist`
- **Auto-Deploy:** Yes (deploys automatically when you push to staging branch)

### Step 4: Set Environment Variables

Add these environment variables in Render dashboard:

```
NODE_VERSION=18
VITE_API_URL=https://pinglo-backend-staging.onrender.com/api
VITE_SOCKET_URL=https://pinglo-backend-staging.onrender.com
NODE_ENV=staging
```

### Step 5: Deploy

Click **"Create Static Site"** and wait for deployment (~2-3 minutes)

## Workflow

### Testing New Features

1. **Develop on feature branch:**
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/new-ui-component
   # Make changes...
   git commit -m "Add new UI component"
   ```

2. **Merge to staging:**
   ```bash
   git checkout staging
   git merge feature/new-ui-component
   git push origin staging
   ```

3. **Automatic deployment to staging:**
   - Render detects the push to `staging` branch
   - Automatically builds and deploys to staging URL
   - Test at: https://pinglo-frontend-staging.onrender.com

4. **Test thoroughly:**
   - Test all features
   - Verify API calls work
   - Check Socket.IO connections
   - Test on mobile devices

5. **Deploy to production:**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

### Quick Fixes

For urgent fixes that need testing:

```bash
# Make fix on staging
git checkout staging
# Make changes...
git commit -m "Fix critical bug"
git push origin staging

# Test on staging URL
# If works, deploy to production
git checkout main
git merge staging
git push origin main
```

## Configuration Files

- **render-staging.yaml** - Staging environment config (references `staging` branch)
- **render-production.yaml** - Production environment config (references `main` branch)
- **render.yaml** - Current production config (for backward compatibility)

## Environment Variables Explained

### VITE_API_URL
The base URL for backend API calls. All API requests will be made to this URL.

**Staging:** `https://pinglo-backend-staging.onrender.com/api`
**Production:** `https://pinglo-backend.onrender.com/api`

### VITE_SOCKET_URL
The URL for Socket.IO WebSocket connections (real-time messaging).

**Staging:** `https://pinglo-backend-staging.onrender.com`
**Production:** `https://pinglo-backend.onrender.com`

### NODE_ENV
The environment mode for build optimizations.

**Staging:** `staging` (enables some debug features)
**Production:** `production` (full optimizations, no debug output)

### NODE_VERSION
The Node.js version to use for building.

**Both:** `18` (LTS version, stable and recommended)

## Verify Staging Deployment

After deploying, check these:

1. **Frontend loads:**
   ```
   Visit: https://pinglo-frontend-staging.onrender.com
   Should show: Pinglo login page
   ```

2. **API connection works:**
   - Open browser DevTools → Console
   - Should see: "Connected to backend" or similar
   - No CORS errors

3. **Socket.IO connects:**
   - Login to test account
   - Should see real-time updates
   - Check Network tab for Socket.IO WebSocket

4. **Environment indicator (optional):**
   - Add a visual indicator in staging (e.g., banner saying "STAGING")
   - Helps differentiate from production

## Common Issues

### CORS Errors

**Problem:** `Access-Control-Allow-Origin` errors in console

**Solution:**
1. Check backend `ALLOWED_ORIGINS` includes staging frontend URL
2. Update in Render backend environment variables:
   ```
   ALLOWED_ORIGINS=https://pinglo-frontend-staging.onrender.com,http://localhost:3001
   ```

### API Calls Fail

**Problem:** API requests return 404 or timeout

**Solution:**
1. Verify `VITE_API_URL` is correct in Render environment
2. Check backend is running: `curl https://pinglo-backend-staging.onrender.com/api/health`
3. Check browser console for exact error

### Build Fails

**Problem:** Build fails during deployment

**Solution:**
1. Check Render logs for specific error
2. Common causes:
   - Missing `build.sh` file
   - Node version mismatch
   - Missing dependencies in `package.json`
3. Test locally: `npm run build`

## Monitoring

### Check Build Logs
1. Render Dashboard → pinglo-frontend-staging
2. Click on deployment
3. View logs for build process

### Check Runtime Issues
Since it's a static site, there are no runtime logs. Check:
- Browser DevTools → Console (JavaScript errors)
- Network tab (API call failures)
- Backend logs (if API calls failing)

## Cleanup

To remove staging frontend:

1. Render Dashboard → pinglo-frontend-staging
2. Settings → Delete Service
3. (Optional) Delete `staging` branch from GitHub

## Cost

**Free tier limits:**
- 100 GB bandwidth/month
- Unlimited static site deploys
- Both staging and production can run on free tier

## Next Steps

1. ✅ Create staging branch
2. ✅ Create render-staging.yaml
3. □ Deploy on Render dashboard
4. □ Test complete flow
5. □ Add staging environment indicator (optional)
6. □ Document team workflow

---

**Questions?** See the main STAGING_SETUP.md in pinglo-backend repo.
