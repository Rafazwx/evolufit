


import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

import Auth from "./Auth";
import Home from "./Home";
import Groups from "./Groups";
import Profile from "./Profile";
import Ranking from "./Ranking";
import Menu from "./Menu";
import Feed from "./Feed";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [historicoTreinos, setHistoricoTreinos] = useState([]);

  // Tema escuro
  const [dark, setDark] = useState(false);
  function toggleDarkMode() {
    setDark(!dark);
    if (!dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // Escuta autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ email: firebaseUser.email, uid: firebaseUser.uid });
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setHistoricoTreinos([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Carrega histórico do Firestore quando usuário muda
  useEffect(() => {
    async function carregarHistorico() {
      if (!user) return;
      const q = query(collection(db, "historicoTreinos"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const treinosFire = [];
      querySnapshot.forEach((doc) => {
        treinosFire.push({ id: doc.id, ...doc.data() });
      });
      setHistoricoTreinos(treinosFire);
    }
    carregarHistorico();
  }, [user]);

  // Adiciona treino ao Firestore e estado local
  async function adicionarTreino(treino) {
    if (!user) return;
    const treinoComUser = { userId: user.uid, ...treino };
    const docRef = await addDoc(collection(db, "historicoTreinos"), treinoComUser);
    setHistoricoTreinos((prev) => [...prev, { id: docRef.id, ...treinoComUser }]);
  }

  function handleLogout() {
    auth.signOut();
  }

  if (!isLoggedIn) {
    return <Auth onLogin={() => {}} />;
  }

  return (
    <>
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 bg-indigo-700 text-white px-4 py-2 rounded shadow hover:bg-indigo-900"
      >
        {dark ? "Tema Claro" : "Tema Escuro"}
      </button>

      <Menu currentScreen={screen} onChangeScreen={setScreen} onLogout={handleLogout} />
      {screen === "home" && <Home user={user} adicionarTreino={adicionarTreino} />}
      {screen === "groups" && <Groups user={user} />}
      {screen === "profile" && (
        <Profile user={user} historicoTreinos={historicoTreinos} setUser={setUser} />
      )}
      {screen === "ranking" && <Ranking />}
      {screen === "feed" && <Feed user={user} />}
    </>
  );
}


