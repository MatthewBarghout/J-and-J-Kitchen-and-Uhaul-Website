import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBar49EHP9UicVfmSyKoBSDH0Mm3s7hh0o",
  authDomain: "j-and-j-f8f66.firebaseapp.com",
  projectId: "j-and-j-f8f66",
  storageBucket: "j-and-j-f8f66.appspot.com", // ✅ FIXED DOMAIN
  messagingSenderId: "1095564028251",
  appId: "1:1095564028251:web:bd114cea7f8b936b98d27e",
  measurementId: "G-C7JR5E8SZR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // ✅ Export db for Firestore

