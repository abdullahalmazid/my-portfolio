import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDibxpGoQC-cETNfQXxtshx-84QInnzKew",
  authDomain: "abdullah-portfolio-2a562.firebaseapp.com",
  projectId: "abdullah-portfolio-2a562",
  storageBucket: "abdullah-portfolio-2a562.firebasestorage.app",
  messagingSenderId: "700219018927",
  appId: "1:700219018927:web:1941ab8280e734911dce5a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
