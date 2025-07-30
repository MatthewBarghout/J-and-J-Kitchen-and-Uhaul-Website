import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions"; // ✅ Import functions

const firebaseConfig = {
  apiKey: "AIzaSyBar49EHP9UicVfmSyKoBSDH0Mm3s7hh0o",
  authDomain: "j-and-j-f8f66.firebaseapp.com",
  projectId: "j-and-j-f8f66",
  storageBucket: "j-and-j-f8f66.appspot.com",
  messagingSenderId: "1095564028251",
  appId: "1:1095564028251:web:bd114cea7f8b936b98d27e",
  measurementId: "G-C7JR5E8SZR"
};

const app = initializeApp(firebaseConfig);

// ✅ Export both db and functions
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1"); // 🔁 Match your function's deployed region


