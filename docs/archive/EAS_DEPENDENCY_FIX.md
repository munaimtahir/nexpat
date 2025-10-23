# EAS Build Dependency Fix - Complete Resolution

## Summary

This document describes the complete resolution of the EAS build failures caused by missing peer dependencies and package version mismatches.

## Issues Identified

The EAS workflow build was failing due to:

1. **Missing peer dependencies**
   - expo-font (required by @expo/vector-icons)
   - expo-device (required by sentry-expo)

2. **Dependency version mismatches with Expo SDK 50**
   - @expo/vector-icons@15.0.2 (expected ^14.0.0)
   - @react-native-async-storage/async-storage@1.24.0 (expected 1.21.0)
   - @react-native-community/netinfo@11.4.1 (expected 11.1.0)
   - @sentry/react-native@5.36.0 (expected ~5.20.0)
   - expo-image-picker@15.0.7 (expected ~14.7.1)
   - expo-keep-awake@12.0.1 (expected ~12.8.2)
   - expo-linear-gradient@15.0.7 (expected ~12.7.2)
   - expo-localization@15.0.3 (expected ~14.8.4)
   - expo-secure-store@13.0.2 (expected ~12.8.1)
   - react-native@0.73.11 (expected 0.73.6)
   - react-native-gesture-handler@2.13.4 (expected ~2.14.0)
   - react-native-safe-area-context@4.7.4 (expected 4.8.2)
   - babel-preset-expo@9.9.0 (expected ^10.0.0)

3. **Missing plugin configurations**
   - expo-localization plugin not configured
   - expo-secure-store plugin not configured

## Resolution Steps

### 1. Align All Dependencies with Expo SDK 50

Ran `npx expo install --fix` to automatically update all packages to their correct versions for Expo SDK 50:

```bash
cd apps/mobile
npx expo install --fix
```

This updated the following packages in `package.json`:
- @expo/vector-icons: 15.0.2 → ^14.0.0
- @react-native-async-storage/async-storage: 1.24.0 → 1.21.0
- @react-native-community/netinfo: 11.4.1 → 11.1.0
- @sentry/react-native: 5.36.0 → ~5.20.0
- expo-image-picker: 15.0.7 → ~14.7.1
- expo-keep-awake: 12.0.1 → ~12.8.2
- expo-linear-gradient: 15.0.7 → ~12.7.2
- expo-localization: 15.0.3 → ~14.8.4
- expo-secure-store: 13.0.2 → ~12.8.1
- react-native: 0.73.11 → 0.73.6
- react-native-gesture-handler: 2.13.4 → ~2.14.0
- react-native-safe-area-context: 4.7.4 → 4.8.2

### 2. Install Missing Peer Dependencies

Explicitly installed expo-font and expo-device as direct dependencies:

```bash
npx expo install expo-font expo-device
```

This added:
- expo-device@~5.9.4
- expo-font@~11.10.3

### 3. Update babel-preset-expo

Updated babel-preset-expo to be compatible with Expo SDK 50:

```bash
npm install babel-preset-expo@^10.0.0 --save-dev
```

This updated:
- babel-preset-expo: 9.9.0 → ^10.0.2

### 4. Add Required Plugins

Updated `apps/mobile/app.config.ts` to include the required plugins:

```typescript
plugins: [
  'sentry-expo',
  'expo-font',
  'expo-localization',  // ← Added
  'expo-secure-store',  // ← Added
],
```

### 5. Fix TypeScript Compatibility Issue

The update to expo-linear-gradient introduced a stricter type for the `colors` prop. Fixed the issue in `src/components/TextureBackground.tsx`:

**Before:**
```typescript
const colors =
  variant === 'sunset'
    ? (['#312E81', '#F97316'] as const)
    : (['#0F172A', '#4338CA'] as const);
```

**After:**
```typescript
const colors =
  variant === 'sunset'
    ? ['#312E81', '#F97316']
    : ['#0F172A', '#4338CA'];
```

The `as const` assertion made the arrays readonly, but the new version of expo-linear-gradient requires a mutable string array.

## Verification

All changes were verified with the following commands:

```bash
cd apps/mobile

# Verify dependencies are aligned
npx expo install --check
# Output: Dependencies are up to date ✓

# Run linter
npm run lint
# Output: Pass ✓

# Run type checker
npm run typecheck
# Output: Pass ✓

# Run tests
npm run test
# Output: All 43 tests passed ✓
```

## Files Changed

1. **apps/mobile/package.json**
   - Updated all dependencies to Expo SDK 50 compatible versions
   - Added expo-device and expo-font as explicit dependencies
   - Updated babel-preset-expo to ^10.0.2

2. **apps/mobile/package-lock.json**
   - Regenerated to reflect new dependency versions

3. **apps/mobile/app.config.ts**
   - Added expo-localization plugin
   - Added expo-secure-store plugin

4. **apps/mobile/src/components/TextureBackground.tsx**
   - Fixed TypeScript compatibility with LinearGradient colors prop

## Current Dependency Status

### Core Versions
- Expo SDK: ~50.0.0
- React: 18.2.0
- React Native: 0.73.6
- TypeScript: ^5.3.3
- babel-preset-expo: ^10.0.2

### All Dependencies Aligned
All packages are now aligned with Expo SDK 50, verified by `npx expo install --check`.

## Next Steps

The dependency issues have been resolved. The next step is to run the EAS build workflow to verify the fixes:

1. **Trigger the Mobile EAS Build Workflow**
   - Go to GitHub Actions
   - Run "Mobile EAS build" workflow
   - Select the desired build profile (preview/production)

2. **Monitor the Build**
   - The workflow will install dependencies, run tests, and build with EAS
   - All lint, typecheck, and test steps should now pass
   - The EAS build should complete successfully

## Expected Behavior

With these fixes in place:
- ✅ No missing peer dependency warnings
- ✅ No version mismatch errors
- ✅ All TypeScript compilation errors resolved
- ✅ All tests pass
- ✅ EAS build should complete successfully

## Troubleshooting

If the EAS build still fails:

1. **Check EXPO_TOKEN secret**: Ensure the GitHub secret `EXPO_TOKEN` is properly configured
2. **Verify projectId**: The app.config.ts already has the correct projectId (3aa13166-f395-49fd-af86-b4d32e9155da)
3. **Check build logs**: Review the full EAS build logs for any platform-specific issues
4. **Clear caches**: If needed, run `npm ci` locally to ensure clean install

## References

- [Expo SDK 50 Release Notes](https://docs.expo.dev/versions/v50.0.0/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [npx expo install command](https://docs.expo.dev/more/expo-cli/#install)
