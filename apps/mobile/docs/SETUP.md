# Setup
## Prereqs
- Node LTS, Yarn/NPM, Android Studio (SDK + emulator), Expo CLI.

## Steps
```bash
npx create-expo-app clinicq-mobile
cd clinicq-mobile
npm i @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npm i @tanstack/react-query axios react-native-encrypted-storage react-hook-form zod
npx expo install expo-image-picker expo-file-system
```

Create `.env`:
```
SERVER_URL=https://your-server.example.com
```

Run:
```bash
npx expo start
```

## OpenAPI Client Generation
- Backend exposes `/api/schema/` (JSON).
- Use `openapi-typescript-codegen`:
```bash
npm i -D openapi-typescript-codegen
npx openapi --input https://your-server.example.com/api/schema/ --output app/api/generated
```
Then wrap with axios in `app/api/client.ts`.
