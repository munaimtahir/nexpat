# EAS Build Workflow Fixes

## Issues Identified and Fixed

### Issue 1: NPX Command Failure ✅ FIXED
**Error**: `npm error could not determine executable to run`

**Root Cause**: The workflow was using `npx eas build`, but the `expo/expo-github-action` installs `eas-cli` globally and makes the `eas` CLI available on the `PATH`. The `npx` command looks for executables in the local `node_modules/.bin` first and couldn't find it.

**Fix Applied**: Changed `.github/workflows/mobile-eas-build.yml` line 49 from:
```yaml
npx eas build --platform android --profile "$PROFILE" --non-interactive
```
to:
```yaml
eas build --platform android --profile "$PROFILE" --non-interactive
```

The `eas` command is available in PATH after the `expo/expo-github-action` runs.

### Issue 2: Missing Owner Configuration ✅ FIXED
**Root Cause**: The `app.config.ts` had `owner: undefined`, which could cause EAS to not properly associate the build with the correct Expo account.

**Fix Applied**: Updated `apps/mobile/app.config.ts` line 9 from:
```typescript
owner: undefined,
```
to:
```typescript
owner: 'munaim',
```

This matches the authenticated user from the EXPO_TOKEN secret (confirmed from workflow logs showing "munaim (authenticated using EXPO_TOKEN)").

## How to Test the Fixes

### Option 1: Merge to Main and Trigger Workflow
1. Merge this PR/branch (`copilot/fix-07d1815a-7e56-406f-a387-b5723a073bd6`) to `main`
2. Go to Actions → Mobile EAS build
3. Click "Run workflow"
4. Select branch: `main`
5. Build profile: `preview` (default)
6. Click "Run workflow" button

### Option 2: Test on Branch
1. Go to Actions → Mobile EAS build
2. Click "Run workflow"
3. Select branch: `copilot/fix-07d1815a-7e56-406f-a387-b5723a073bd6`
4. Build profile: `preview` (default)
5. Click "Run workflow" button

## Potential Next Issues

### 1. Project Not Initialized with EAS
**Symptom**: Build fails with error about project not being configured or missing projectId.

**Solution**: If this occurs, you need to initialize the project:
```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build:configure
```
This will add a `projectId` to your `app.config.ts` or create an `app.json` with the project configuration. Commit and push the changes.

### 2. Missing Credentials
**Symptom**: Build fails asking for Android keystore or signing credentials.

**Solution**: For preview builds (which create APKs), EAS can auto-generate credentials. If prompted:
- Let EAS generate the credentials automatically (recommended for preview builds)
- Or configure your own credentials via `eas credentials`

### 3. Build Timeout or Resource Issues
**Symptom**: Build runs for a long time and times out or fails with resource errors.

**Solution**: 
- This might be due to large dependencies or slow build steps
- Consider optimizing dependencies or increasing build timeout in the workflow
- Check if there are any circular dependencies or issues in the code

### 4. Missing Environment Variables
**Symptom**: Build succeeds but app doesn't work properly (missing server URL, Sentry not configured).

**Solution**: Add GitHub secrets or EAS secrets:
- `SERVER_URL`: Your backend API URL
- `SENTRY_DSN`: Your Sentry DSN for error tracking

These can be added via:
1. GitHub: Settings → Secrets and variables → Actions → New repository secret
2. Or EAS: `eas secret:create --name SERVER_URL --value https://your-api.com`

## Current Status

✅ Workflow syntax is correct
✅ EAS CLI invocation is fixed
✅ Owner is properly configured
✅ Authentication is working (EXPO_TOKEN is set and working)
✅ Build profile is configured in eas.json

⏸️ Pending: Manual workflow trigger to test the fixes

## Next Steps

1. **Trigger the workflow** using one of the options above
2. **Monitor the run** in GitHub Actions
3. **If it fails**, check the error message and consult the "Potential Next Issues" section above
4. **If it succeeds**, you'll get an APK artifact that can be downloaded from the build summary
5. **For production builds**, change the profile from `preview` to `production` and ensure proper signing credentials are configured

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build for CI/CD](https://docs.expo.dev/build/building-on-ci/)
- [Expo GitHub Action](https://github.com/expo/expo-github-action)
