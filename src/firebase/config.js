import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyATTsNr6kTSAcgPkn4RTsIBuIVQihDegMY",
  authDomain: "lease-shield-ai.firebaseapp.com",
  projectId: "lease-shield-ai",
  storageBucket: "lease-shield-ai.appspot.com",
  messagingSenderId: "160885817758",
  appId: "1:160885817758:web:392361cae4746dacdbd68f",
  measurementId: "G-X4YWP75D49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage }; 