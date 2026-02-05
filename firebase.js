import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBO0LB90SkTsLP1dorb7NlTwMvpbXPMDX4",
  authDomain: "evofit-e635c.firebaseapp.com",
  projectId: "evofit-e635c",
  storageBucket: "evofit-e635c.firebasestorage.app",
  messagingSenderId: "18061469984",
  appId: "1:18061469984:web:fb9063b80de28b8b3f8f45"
};

// --- CORREÇÃO IMPORTANTE PARA NEXT.JS ---
// Verifica se já existe uma instância do Firebase. Se não, cria uma nova.
// Isso evita o erro "Firebase App named '[DEFAULT]' already exists".
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa as ferramentas que seu site usa
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Exporta para o resto do site poder usar
export { auth, provider, db, storage };