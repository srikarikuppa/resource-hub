import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxjyUq74cTN7Odvsiz1IwP7wmf9uj_XIg",
  authDomain: "campus-vault-be31d.firebaseapp.com",
  projectId: "campus-vault-be31d",
  storageBucket: "campus-vault-be31d.firebasestorage.app",
  messagingSenderId: "219240002335",
  appId: "1:219240002335:web:ee719c754d5ed91762362a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
