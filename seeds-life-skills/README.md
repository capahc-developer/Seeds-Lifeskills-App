<<<<<<< HEAD
#under-construction
=======
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


## Personalized Skills prototype
Added Student Profile -> All Skills -> Skill -> Psychologist Strategies -> Step-by-Step Visual flow. The visual generator currently demonstrates personalization locally; production AI should be called through a secure backend/Cloud Function, not directly from the mobile client.

## TestFlight (iOS)

This project uses the EAS production profile for App Store signed builds. From the `seeds-life-skills` directory:

1. Join the [Apple Developer Program](https://developer.apple.com/programs/) and ensure your Apple team can use the bundle ID `com.seedshc.independentsteps`. Sign in to Expo with `npx eas-cli login` and to Apple when EAS prompts you. The app is linked to EAS project `99414f2c-e7aa-44d4-8228-d64d0aafff99`; use an Expo account with access to it.
2. Run `npm ci`, then `npm run testflight -- --clear-cache` for the first build (later builds can use `npm run testflight`). EAS will configure signing, build an iOS production archive, and submit it to App Store Connect. Answer the first submission prompts to select or create the App Store Connect app. Do not add a made-up `ascAppId`; after the app exists, you may put its actual ID under `submit.production.ios.ascAppId` in `eas.json`.
3. After Apple processes the upload, open [App Store Connect](https://appstoreconnect.apple.com/) → your app → TestFlight. Add internal testers from your App Store Connect team. For SEEDS families or volunteers outside that team, create an external testing group, supply the beta app description and feedback email, assign the build, and submit it for Beta App Review. Once approved, enable a public invitation link in that group. A QR code can point to that link.

Testers install Apple's TestFlight app and accept their invitation. Uploading to TestFlight does not publish the app on the App Store. The `preview` EAS profile remains for registered device installations; it does not create a TestFlight build. A new production build increments the iOS build number through EAS remote versioning.

If a build reports missing `EXPO_PUBLIC_*` values, configure those values in the EAS production environment before rebuilding; local `.env` files are not automatically available to the cloud build.

## Account-scoped student data

The student profile is stored at `studentProfiles/{adultUid}`. Practice entries and the reports derived from them use `users/{adultUid}/practiceLog/{entryId}`. Each signed-in adult has one student profile. Switching or signing out clears the profile shown in the app.

**Deploy the included `firestore.rules` to the same Firebase project used by the app before using this build with families.** In Firebase Console → Firestore Database → Rules, review the rules against any other collections your project uses, then publish the equivalent rules. The included rules allow an adult to access only their own student profile, adult profile, and practice entries; signed-in users can read the shared skill catalog. App code alone does not enforce this boundary.

The old shared `studentProfiles/currentStudent` document and global `practiceLog` collection are intentionally not read or automatically copied. Their records cannot safely be assigned to a particular adult. Existing accounts start with an empty private profile and practice history. If you know who owns a legacy record, move it to that adult's UID from an administrator session after checking consent, then remove access to the old shared records. The profile avatar is an emoji choice stored with the profile; no image storage setup is required.

## Parent Assistant

The Home screen offers parent questions and practice activity generation. It calls the authenticated `parentAssistant` Firebase function. The adult must opt in before the function reads their student profile; the child's name is never sent to the model. Generated activities are shown for review and saved only when the adult taps **Save this activity**. Saved plans live at `users/{adultUid}/practicePlans/{planId}`. Each account can make up to 10 generation requests per UTC day.

Before releasing this feature, review and deploy `firestore.rules` and the function to the Firebase project matching `EXPO_PUBLIC_FIREBASE_PROJECT_ID`. Cloud Functions deployment requires Firebase's Blaze plan; model requests and secrets may incur charges. From this directory, run:

```bash
cd functions && npm install && cd ..
npx firebase-tools login
npx firebase-tools functions:secrets:set OPENAI_API_KEY --project YOUR_PROJECT_ID
npx firebase-tools deploy --only firestore:rules,functions:parentAssistant --project YOUR_PROJECT_ID
```

Enter an OpenAI API key when the CLI prompts; never add that key to Expo environment variables or Git. The function uses `gpt-5-mini` through the OpenAI Responses API, requests `store: false`, and holds the key in Firebase Secret Manager. OpenAI API billing is separate from a ChatGPT subscription. Review the existing live Firestore rules before deploying: CLI deployment replaces them. Then make a new EAS production build for TestFlight. The assistant is a support tool; parents should review suggestions before using them.
