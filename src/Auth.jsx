

import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.senha);
      } else {
        await createUserWithEmailAndPassword(auth, form.email, form.senha);
      }
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-300 to-indigo-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">
          {isLogin ? "Entrar no Evolufit" : "Criar Conta no Evolufit"}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="border p-3 rounded focus:outline-indigo-400"
              placeholder="Nome completo"
              required
            />
          )}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-indigo-400"
            placeholder="E-mail"
            required
          />
          <input
            type="password"
            name="senha"
            value={form.senha}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-indigo-400"
            placeholder="Senha"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700"
          >
            {isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>
        {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
        <button
          className="mt-4 text-indigo-600 hover:underline text-sm"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
        >
          {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}

