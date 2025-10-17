// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDAYv5Qm0bfqbHhCLeNp6zjKMty2y7xIIY",
    authDomain: "the-hunt-49493.firebaseapp.com",
    projectId: "the-hunt-49493",
    storageBucket: "the-hunt-49493.firebasestorage.app",
    messagingSenderId: "465769826017",
    appId: "1:465769826017:web:74ad7e62f3ab139cb359a0",
    measurementId: "G-J1KGFE15XP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, "asia-northeast2");

async function initializeAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        signInAnonymously(auth).catch(() => {}).then(() => {});
      }
    });
  });
}

export { app, db, auth, functions, initializeAuth };
