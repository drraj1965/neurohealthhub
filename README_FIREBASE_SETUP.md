# Firebase Setup Instructions

## Security Rules Issue

The application is currently experiencing issues connecting to Firebase due to security rules restrictions. The errors you're seeing (`400 Bad Request` from Firestore) indicate that the Firebase security rules are preventing the application from accessing the database.

## Quick Solution

For development purposes, you can use the highly permissive security rules in `firebase_rules_permissive.txt`. These rules allow full read/write access to your database and storage.

**Warning:** These permissive rules should ONLY be used for development and testing. Never use them in production.

### How to Apply the Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `neurohealthhub-1965`
3. In the left sidebar, navigate to "Firestore Database"
4. Click on the "Rules" tab
5. Replace the current rules with the contents of `firebase_rules_permissive.txt` (first section)
6. Click "Publish"
7. Then navigate to "Storage" in the left sidebar
8. Click on the "Rules" tab
9. Replace the current rules with the storage rules from `firebase_rules_permissive.txt` (second section)
10. Click "Publish"

## Better Solution for Future Development

For more controlled development, consider:

1. Using the more detailed rules in `firebase_firestore_rules_dev.txt` and `firebase_storage_rules_simple.txt` once your basic app is working
2. Setting up Firebase emulators as described in `firebase_emulator_setup.txt`

## Proper Production Rules

When you're ready to deploy to production, use the properly secured rules in:
- `firebase_rules.txt` for Firestore
- `firebase_storage_rules.txt` for Storage

These provide appropriate security while allowing authenticated users to perform necessary operations.