import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJDqkI-qTxyntT9gvL1fpouwAPGE21jmMI",
  authDomain: "evolufit-54d36.firebaseapp.com",
  projectId: "evolufit-54d36",
  storageBucket: "evolufit-54d36.appspot.com",
  messagingSenderId: "33284220531",
  appId: "1:33284220531:web:553becd9c7b2d732f0ac06"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

