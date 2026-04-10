/**
 * Firebase Configuration
 * 
 * You can find these values in the Google AI Studio Settings menu 
 * under "Environment Variables" or in your Firebase Console.
 * 
 * To make the app work independently outside of AI Studio:
 * 1. Copy the values from AI Studio Settings.
 * 2. Paste them here or set them in your own hosting environment.
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// If you want to hardcode your keys for a standalone version, 
// you can replace the values above like this:
// apiKey: "YOUR_API_KEY_HERE",
