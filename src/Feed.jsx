

import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";

export default function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState("");

  // Carrega posts do Firestore ao iniciar
  useEffect(() => {
    async function carregarPosts() {
      if (!user) return;
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const postsFire = [];
      querySnapshot.forEach((doc) => {
        postsFire.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsFire);
    }
    carregarPosts();
  }, [user]);

  // Adiciona novo post ao Firestore
  async function adicionarPost() {
    if (!novaMensagem.trim() || !user) return;
    const novoPost = {
      autor: user.email, // ou user.nome, se salvar
      texto: novaMensagem.trim(),
      createdAt: serverTimestamp(),
      curtidas: 0,
      comentarios: [],
      userId: user.uid,
    };
    const docRef = await addDoc(collection(db, "posts"), novoPost);
    setPosts([{ id: docRef.id, ...novoPost }, ...posts]);
    setNovaMensagem("");
  }

  // Atualiza curtidas no Firestore
  async function curtirPost(id, atualCurtidas) {
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, {
      curtidas: atualCurtidas + 1,
    });
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, curtidas: atualCurtidas + 1 } : post
      )
    );
  }

  // Adiciona comentário no Firestore
  async function adicionarComentario(id, comentario) {
    if (!comentario.trim() || !user) return;
    const postRef = doc(db, "posts", id);
    const novoComentario = {
      id: Date.now(),
      texto: comentario.trim(),
      autor: user.email,
    };
    await updateDoc(postRef, {
      comentarios: arrayUnion(novoComentario),
    });
    setPosts(
      posts.map((post) =>
        post.id === id
          ? {
              ...post,
              comentarios: [...post.comentarios, novoComentario],
            }
          : post
      )
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-200 dark:bg-gray-900 p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-indigo-800 dark:text-white mb-6">
        Feed Social
      </h1>

      <div className="mb-6">
        <textarea
          rows="3"
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="O que você está pensando?"
          className="w-full p-3 rounded border border-gray-300 dark:bg-gray-800 dark:text-white resize-none focus:outline-indigo-500"
        />
        <button
          onClick={adicionarPost}
          className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Postar
        </button>
      </div>

      <div className="space-y-6">
        {posts.length === 0 && (
          <p className="dark:text-gray-300">Nenhum post ainda.</p>
        )}
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onCurtir={() => curtirPost(post.id, post.curtidas)}
            onComentar={(comentario) => adicionarComentario(post.id, comentario)}
          />
        ))}
      </div>
    </div>
  );
}

function Post({ post, onCurtir, onComentar }) {
  const [comentando, setComentando] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");

  function enviarComentario() {
    onComentar(novoComentario);
    setNovoComentario("");
    setComentando(false);
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <div className="flex justify-between items-center mb-2">
        <strong className="text-indigo-700 dark:text-white">{post.autor}</strong>
        <span className="text-xs text-gray-500 dark:text-gray-300">{post.createdAt?.toDate?.().toLocaleString() || ""}</span>
      </div>
      <p className="mb-3 dark:text-gray-200">{post.texto}</p>
      <button
        onClick={onCurtir}
        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mr-4"
      >
        Curtir ({post.curtidas})
      </button>
      <button
        onClick={() => setComentando(!comentando)}
        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {comentando ? "Cancelar" : "Comentar"}
      </button>
      {comentando && (
        <div className="mt-2">
          <textarea
            rows="2"
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:bg-gray-800 dark:text-white rounded resize-none focus:outline-indigo-500"
          />
          <button
            onClick={enviarComentario}
            className="mt-1 bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            Enviar
          </button>
        </div>
      )}
      {post.comentarios && post.comentarios.length > 0 && (
        <div className="mt-4 border-t pt-2">
          <strong className="text-indigo-700 dark:text-white">Comentários</strong>
          {post.comentarios.map((comentario) => (
            <p key={comentario.id} className="text-sm mt-1 dark:text-gray-200">
              <span className="font-bold">{comentario.autor}: </span>
              {comentario.texto}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

