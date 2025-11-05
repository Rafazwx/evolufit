
import React, { useState, useEffect } from "react";

export default function Profile({ user, historicoTreinos, setUser }) {
  const [nomeEditavel, setNomeEditavel] = useState(user?.nome || "");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    setNomeEditavel(user?.nome || "");
  }, [user]);

  function salvarNome() {
    if (!nomeEditavel) return;
    const updatedUser = { ...user, nome: nomeEditavel };
    setUser(updatedUser);
    localStorage.setItem(user.email, JSON.stringify(updatedUser));
    setEditando(false);
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-200 dark:bg-gray-900 p-6 flex flex-col items-center">
      <img
        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nomeEditavel)}`}
        alt="Foto de perfil"
        className="w-24 h-24 rounded-full mb-4 border-4 border-indigo-600"
      />
      {editando ? (
        <input
          type="text"
          value={nomeEditavel}
          onChange={(e) => setNomeEditavel(e.target.value)}
          className="border p-2 rounded mb-2 text-center w-48"
        />
      ) : (
        <h1 className="text-3xl font-bold text-indigo-800 mb-2">{nomeEditavel}</h1>
      )}

      <p className="text-gray-600 mb-4">{user.email}</p>

      {editando ? (
        <button
          onClick={salvarNome}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
        >
          Salvar
        </button>
      ) : (
        <button
          onClick={() => setEditando(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mb-4"
        >
          Editar nome
        </button>
      )}

      <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-3 text-indigo-700">Histórico de Treinos</h2>
        {historicoTreinos.length === 0 ? (
          <p>Nenhum treino iniciado ainda.</p>
        ) : (
          <ul>
            {historicoTreinos.map((item, index) => (
              <li key={index} className="mb-1">
                <strong>{item.title}</strong> - {item.data}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
