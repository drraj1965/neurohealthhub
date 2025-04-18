# Firebase User ID Migration Guide

## Problem: Firebase Auth UID vs. Firestore Document ID Mismatch

When using Firebase Authentication together with Firestore, a common issue can occur when the document IDs in Firestore don't match the User IDs (UIDs) from Firebase Authentication. This can happen when:

1. Documents were created manually in the Firebase Console
2. A migration was performed from another system
3. Custom document IDs were used during user creation

For example, you might have:
- A Firebase Authentication user with UID `ddxsuXomFATlCLI0gRDNoifrOIt2`
- A corresponding user document in Firestore with ID `wKnfjr492rpx96fLokgu`

This mismatch can cause problems because many Firebase security rules and application code assumes that the document ID matches the user's authentication UID.

## Solution Options

### Option 1: Firebase Test Page Migration Tool (Recommended)

We've built a migration tool into the Firebase Test page that can automatically fix this issue:

1. Login to your account on the Firebase Test page
2. If you have a document ID mismatch, the tool will detect it and show a warning
3. Click the "Migrate Document ID to Match Auth UID" button
4. The tool will:
   - Retrieve your user data from the old document
   - Create a new document with your Firebase Auth UID as the document ID
   - Copy all your data to the new document
   - Delete the old document

This is the cleanest approach and ensures that your Firestore document ID matches your Firebase Auth UID going forward.

### Option 2: Email-Based Lookup (Already Implemented as Fallback)

As a fallback solution, we've implemented email-based user lookup in critical application flows:

```javascript
// Function to find a user document by email
async function findUserByEmail(email) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0];
  }
  
  return null;
}
```

This allows the application to find your user document even when the document ID doesn't match your Firebase Auth UID. However, this is less efficient and can cause problems with security rules.

## When to Use Each Approach

- **Use Option 1 (Migration)** when you want to permanently fix the issue
- **Use Option 2 (Email Lookup)** as a temporary solution or when migration is not possible

## Technical Details

The migration process:
1. Retrieves all data from the old document
2. Creates a new document with the Firebase Auth UID
3. Copies all data to the new document
4. Deletes the old document

This ensures full data portability with minimal disruption.

## Security Considerations

After migration, make sure to update any references to the old document ID in your application code or database.

## Need Help?

If you encounter any issues during migration, please contact our support team.