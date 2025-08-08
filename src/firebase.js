import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBar49EHP9UicVfmSyKoBSDH0Mm3s7hh0o",
  authDomain: "j-and-j-f8f66.firebaseapp.com",
  projectId: "j-and-j-f8f66",
  storageBucket: "j-and-j-f8f66.firebasestorage.app",
  messagingSenderId: "1095564028251",
  appId: "1:1095564028251:web:16391c61b9eac4f898d27e",
  measurementId: "G-FP2YZ7W92Y"
};

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const auth = getAuth(app);

// Set persistence for Safari compatibility
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Failed to set auth persistence:', error);
});


