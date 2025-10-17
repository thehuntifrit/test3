// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDAYv5Qm0bfqbHhCLeNp6zjKMty2y7xIIY",
  authDomain: "the-hunt-49493.firebaseapp.com",
  projectId: "the-hunt-49493",
  storageBucket: "the-hunt-49493.firebasestorage.app",
  messagingSenderId: "465769826017",
  appId: "1:465769826017:web:74ad7e62f3ab139cb359a0",
  measurementId: "G-J1KGFE15XP"
};

const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "asia-northeast2");
export const analytics = getAnalytics(app);


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
