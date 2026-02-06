/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { auth, db, storage } from "../firebase"; 
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User,
  updateProfile 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  deleteDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Trash2, Heart, MessageCircle, LogOut, Plus, 
  Trophy, MessageSquare, 
  LayoutList, X, Clock, MapPin, Flame, Send, Camera, AtSign, Bell, BellRing, AlignLeft, Calendar, ArrowLeft, AlertTriangle, Pencil, User as UserIcon, Save, Dumbbell, Hash, Layers, Weight
} from "lucide-react";

import WeeklyChart from "./graficos/weeklychart";

// --- Interfaces ---
interface Comment {
  userName: string;
  text: string;
}

interface ExerciseItem {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  rest: string;
}

interface Post {
  id: string;
  imageUrl: string;
  userId: string;
  userName: string;
  userPhoto: string;
  likes: string[];
  comments: Comment[];
  duration?: string;
  calories?: string;
  distance?: string;
  exercises?: ExerciseItem[]; // Nova lista de exercícios
  createdAt: any;
}

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string;
  createdAt: any;
  reactions?: Record<string, string[]>; 
}

interface RankingItem {
  name: string;
  photo: string;
  count: number;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [loginError, setLoginError] = useState(""); 
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  
  // Inputs Gerais
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [distance, setDistance] = useState("");
  const [initialComment, setInitialComment] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // --- NOVOS INPUTS DE EXERCÍCIO ---
  const [currentExercises, setCurrentExercises] = useState<ExerciseItem[]>([]);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");
  const [exWeight, setExWeight] = useState("");
  const [exRest, setExRest] = useState("");

  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<"feed" | "ranking" | "chat" | "profile">("feed");

  // --- Inicializar Data/Hora ---
  useEffect(() => {
    if (image && !editingPost) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setSelectedTime(`${hh}:${min}`);
    }
  }, [image, editingPost]);

  // --- Auth ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthChecking(false); 
      if(u) setNewProfileName(u.displayName || "");
    });
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") setNotificationsEnabled(true);
    }
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setPosts(data);
    });
  }, []);

  useEffect(() => {
    if (screen === 'chat') {
      const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
        setMessages(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
      return () => unsub();
    }
  }, [screen]);

  const handleLogin = async () => {
    setLoginError(""); 
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setLoginError("Erro no login. Tente novamente.");
      setIsLoggingIn(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
        let photoURL = user.photoURL;
        if (newProfileImage) {
            const storageRef = ref(storage, `profiles/${user.uid}-${Date.now()}`);
            await uploadBytes(storageRef, newProfileImage);
            photoURL = await getDownloadURL(storageRef);
        }
        await updateProfile(user, { displayName: newProfileName, photoURL: photoURL });
        setUser({ ...user, displayName: newProfileName, photoURL: photoURL });
        setIsEditingProfile(false);
        setNewProfileImage(null);
        alert("Perfil atualizado!");
    } catch (e) { console.error(e); alert("Erro ao atualizar perfil."); }
    setLoading(false);
  };

  // --- Adicionar Exercício à Lista Local ---
  const addExercise = () => {
    if (!exName) return;
    const newEx: ExerciseItem = {
      name: exName,
      sets: exSets || "-",
      reps: exReps || "-",
      weight: exWeight || "-",
      rest: exRest || "-"
    };
    setCurrentExercises([...currentExercises, newEx]);
    // Limpar campos
    setExName(""); setExSets(""); setExReps(""); setExWeight(""); setExRest("");
  };

  const removeExercise = (index: number) => {
    const newList = [...currentExercises];
    newList.splice(index, 1);
    setCurrentExercises(newList);
  };

  const handleSavePost = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let finalDate = new Date();
      if (selectedDate && selectedTime) {
        finalDate = new Date(`${selectedDate}T${selectedTime}`);
      }

      if (editingPost) {
        const postRef = doc(db, "posts", editingPost.id);
        await updateDoc(postRef, {
           duration: duration || "",
           calories: calories || "",
           distance: distance || "",
           exercises: currentExercises, // Salva lista de exercicios
           createdAt: Timestamp.fromDate(finalDate),
        });
        setEditingPost(null); 
      } else if (image) {
        const storageRef = ref(storage, `posts/${Date.now()}-${image.name}`);
        await uploadBytes(storageRef, image);
        const url = await getDownloadURL(storageRef);
        const startComments = initialComment.trim() ? [{ userName: user.displayName || "Atleta", text: initialComment.trim() }] : [];

        await addDoc(collection(db, "posts"), {
          imageUrl: url, 
          userId: user.uid, 
          userName: user.displayName || "Atleta",
          userPhoto: user.photoURL || "", 
          likes: [], 
          comments: startComments,
          duration: duration || "",
          calories: calories || "",
          distance: distance || "",
          exercises: currentExercises, // Salva lista de exercicios
          createdAt: Timestamp.fromDate(finalDate), 
        });
        if (notificationsEnabled) new Notification("EvoFit", { body: "Treino registrado! 🔥" });
      }
      clearModal();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openEditModal = (post: Post) => {
    setEditingPost(post);
    setDuration(post.duration || "");
    setCalories(post.calories || "");
    setDistance(post.distance || "");
    setCurrentExercises(post.exercises || []); // Carrega exercicios existentes
    if (post.createdAt?.toDate) {
      const dateObj = post.createdAt.toDate();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const min = String(dateObj.getMinutes()).padStart(2, '0');
      setSelectedTime(`${hh}:${min}`);
    }
  };

  const clearModal = () => {
      setImage(null);
      setEditingPost(null);
      setDuration("");
      setCalories("");
      setDistance("");
      setInitialComment("");
      setCurrentExercises([]);
      setExName(""); setExSets(""); setExReps(""); setExWeight("");
  }

  // --- Funções Chat e Ranking mantidas ---
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: chatInput,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
        reactions: {}
      });
      setChatInput("");
    } catch (e) { console.error(e); }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (confirm("Apagar mensagem para todos?")) {
      await deleteDoc(doc(db, "messages", msgId));
    }
    setActiveReactionMsg(null);
  };

  const handleReaction = async (msg: ChatMessage, emoji: string) => {
    if (!user) return;
    const msgRef = doc(db, "messages", msg.id);
    const currentReactions = msg.reactions || {};
    const userList = currentReactions[emoji] || [];
    let newReactions = { ...currentReactions };
    if (userList.includes(user.uid)) {
      newReactions[emoji] = userList.filter(id => id !== user.uid);
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
    } else {
      newReactions[emoji] = [...userList, user.uid];
    }
    await updateDoc(msgRef, { reactions: newReactions });
    setActiveReactionMsg(null);
  };

  const requestNotification = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") setNotificationsEnabled(true);
  };

  const ranking = Object.values(posts.reduce<Record<string, RankingItem>>((acc, post) => {
      acc[post.userId] = { name: post.userName, photo: post.userPhoto, count: (acc[post.userId]?.count || 0) + 1 };
      return acc;
    }, {})).sort((a, b) => b.count - a.count);
  const leader = ranking[0] || { name: "-", photo: "", count: 0 };
  const myRankIndex = ranking.findIndex((r) => r.name === user?.displayName);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : "-";

  const myPosts = posts.filter(p => p.userId === user?.uid);
  const myTotalCalories = myPosts.reduce((acc, p) => acc + (Number(p.calories) || 0), 0);
  const myTotalWorkouts = myPosts.length;

  if (isAuthChecking) return (<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white"><Flame size={48} className="text-green-500 fill-green-500 animate-pulse" /><p className="mt-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Carregando...</p></div>);

  if (!user) return (<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8"><div className="flex items-center gap-2 mb-6"><Flame size={32} className="text-green-500 fill-green-500" /><span className="text-3xl font-bold text-white tracking-tighter">EvoFit</span></div><h1 className="text-2xl font-bold mb-2 text-center">Bem-vindo ao Desafio</h1><p className="text-zinc-400 text-center mb-8 text-sm px-4">Junte-se aos seus amigos e alcance a sua melhor versão em 2026.</p>{loginError && (<div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6 flex items-start gap-3 w-full"><AlertTriangle className="text-red-500 shrink-0" size={20} /><p className="text-red-200 text-xs text-left break-all">{loginError}</p></div>)}<button onClick={handleLogin} disabled={isLoggingIn} className="bg-white text-black w-full py-4 rounded-full font-bold text-sm shadow-lg hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{isLoggingIn ? "Abrindo Google..." : "Entrar com Google"}</button></div>);

  return (
    <div className="max-w-md mx-auto bg-black min-h-screen text-white font-sans flex flex-col relative overflow-hidden">
      
      {screen === "feed" && (
        <>
          <div className="relative h-48 w-full">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10"></div>
             <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Gym Background" />
             <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center">
                <div className="flex items-center gap-1"><Flame size={20} className="text-green-500 fill-green-500"/><h2 className="text-lg font-bold tracking-tight">EvoFit</h2></div>
                <div className="flex gap-4 items-center">
                  <button onClick={requestNotification} className={notificationsEnabled ? "text-green-500" : "text-white/80"}>{notificationsEnabled ? <BellRing size={20} /> : <Bell size={20} />}</button>
                </div>
             </div>
             <div className="absolute bottom-4 left-4 z-20"><h1 className="text-2xl font-bold text-white">Desafio Fit 2026</h1></div>
          </div>

          <main className="flex-1 pb-32 px-4 -mt-4 relative z-20">
            <div className="bg-zinc-900 rounded-2xl p-4 mb-4 grid grid-cols-3 gap-2 text-center border border-zinc-800 shadow-xl">
              <div className="flex flex-col items-center justify-center"><div className="relative mb-1"><img src={leader.photo || "https://ui-avatars.com/api/?name=?"} className="w-10 h-10 rounded-full border-2 border-red-500" alt="Líder" /><span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-sm">1º</span></div><span className="text-[10px] font-bold mt-1 truncate w-full">{leader.name.split(' ')[0]}</span></div>
              <div className="flex flex-col items-center justify-center border-l border-r border-zinc-800"><div className="relative mb-1"><img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-green-500" alt="Você" /><span className="absolute -bottom-1 -right-1 bg-green-500 text-black text-[8px] font-bold px-1 rounded-sm">{myRank}º</span></div><span className="text-[10px] font-bold mt-1 text-green-400">Você</span></div>
              <div className="flex flex-col items-center justify-center"><span className="text-2xl font-bold text-white">327</span><span className="text-[9px] text-zinc-500 uppercase mt-1">Dias Rest.</span></div>
            </div>

            <div className="h-40 w-full mb-4"><WeeklyChart posts={posts} userId={user.uid} /></div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Feed da Comunidade</h3>
              {posts.map((post) => (
                <div key={post.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={post.userPhoto} className="w-8 h-8 rounded-full" alt="User" />
                      <div>
                          <p className="font-bold text-sm text-white leading-none">{post.userName}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1 text-zinc-400"><Calendar size={10} /><p className="text-[10px]">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : "Hoje"}</p></div>
                            {post.duration && (<div className="flex items-center gap-1 text-zinc-400 border-l border-zinc-700 pl-2 ml-1"><Clock size={10} /><p className="text-[10px]">{post.duration}</p></div>)}
                            {post.calories && (<div className="flex items-center gap-1 text-orange-400 border-l border-zinc-700 pl-2 ml-1"><Flame size={10} /><p className="text-[10px]">{post.calories}cal</p></div>)}
                          </div>
                      </div>
                    </div>
                    {post.userId === user.uid && (<div className="flex items-center gap-2"><button onClick={() => openEditModal(post)} className="bg-zinc-800 p-1.5 rounded-full text-zinc-400 hover:text-white"><Pencil size={14} /></button><button onClick={() => deleteDoc(doc(db, "posts", post.id))} className="bg-zinc-800 p-1.5 rounded-full text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button></div>)}
                  </div>
                  <img src={post.imageUrl} className="w-full aspect-square object-cover bg-zinc-950" alt="Treino" />
                  
                  {/* --- LISTA DE EXERCÍCIOS NO FEED --- */}
                  {post.exercises && post.exercises.length > 0 && (
                    <div className="bg-zinc-950/50 p-3 border-y border-zinc-800/50">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1"><Dumbbell size={10} /> Série Realizada</h4>
                        <div className="space-y-1">
                            {post.exercises.map((ex, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-zinc-300 border-b border-zinc-800/50 last:border-0 pb-1 last:pb-0">
                                    <span className="font-medium text-white">{ex.name}</span>
                                    <div className="flex gap-2 text-[10px] text-zinc-500">
                                        <span>{ex.sets}x{ex.reps}</span>
                                        {ex.weight && ex.weight !== "-" && <span>{ex.weight}kg</span>}
                                        {ex.rest && ex.rest !== "-" && <span>{ex.rest}s</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}

                  <div className="p-3">
                    <div className="flex gap-4 mb-2">
                      <button onClick={async () => {const ref = doc(db, "posts", post.id); post.likes.includes(user.uid) ? await updateDoc(ref, { likes: arrayRemove(user.uid) }) : await updateDoc(ref, { likes: arrayUnion(user.uid) }); }}><Heart size={24} className={post.likes.includes(user.uid) ? "fill-red-500 text-red-500" : "text-white"} /></button>
                      <MessageCircle size={24} className="text-white"/>
                    </div>
                    <div className="mb-2 text-sm">{post.likes.length > 0 ? (<p className="text-white">Curtido por <span className="font-bold">{post.likes.includes(user.uid) ? "você" : "alguém"}</span>{post.likes.length > 1 && <span> e outras <span className="font-bold">{post.likes.length - 1} pessoas</span></span>}</p>) : (<p className="text-zinc-500 text-xs">Seja o primeiro a curtir</p>)}</div>
                    {post.comments.length > 0 && (<div className="space-y-1 mb-3">{post.comments.map((c, i) => (<p key={i} className="text-xs text-zinc-300"><span className="font-bold text-white mr-1">{c.userName}</span>{c.text}</p>))}</div>)}
                    <div className="flex gap-2"><input className="bg-black/50 flex-1 rounded-full px-3 py-2 text-xs text-white focus:outline-none border border-zinc-800 focus:border-green-500 transition" placeholder="Comentar..." value={commentText[post.id] || ""} onChange={(e) => setCommentText({...commentText, [post.id]: e.target.value})}/><button onClick={async () => { if(!commentText[post.id]) return; await updateDoc(doc(db, "posts", post.id), { comments: arrayUnion({ userName: user.displayName, text: commentText[post.id] }) }); setCommentText({...commentText, [post.id]: ""}); }} className="text-green-500 font-bold text-xs px-2">Enviar</button></div>
                  </div>
                </div>
              ))}
            </div>
          </main>
          <label className="fixed bottom-24 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg shadow-red-600/20 cursor-pointer active:scale-95 transition z-30 hover:scale-105"><Plus size={28} /><input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} /></label>
        </>
      )}

      {screen === "ranking" && (
        <div className="flex-1 p-6 pb-24 bg-black">
           <h2 className="text-xl font-bold mb-6 text-center uppercase tracking-widest text-green-500">Ranking Geral</h2>
           <div className="space-y-3">{ranking.map((r, i) => (<div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${i===0 ? 'bg-zinc-900 border-green-500' : 'bg-black border-zinc-800'}`}><div className="flex items-center gap-4"><span className={`font-black text-lg w-6 text-center ${i===0 ? 'text-green-500' : 'text-zinc-600'}`}>{i+1}</span><img src={r.photo} className="w-12 h-12 rounded-full border border-zinc-800" alt="Rank" /><span className="font-bold">{r.name}</span></div><div className="text-right"><span className="block font-bold text-lg text-white">{r.count}</span><span className="text-[10px] text-zinc-500 uppercase">Treinos</span></div></div>))}</div>
        </div>
      )}

      {screen === "chat" && (
        <div className="flex-1 flex flex-col h-[100dvh] bg-black relative"> 
           <header className="p-4 border-b border-zinc-900 flex items-center gap-4 bg-black z-20"><button onClick={() => setScreen("feed")}><ArrowLeft size={24} className="text-zinc-400" /></button><div className="flex-1"><h2 className="font-bold text-sm text-white">Comunidade EvoFit</h2><p className="text-[10px] text-green-500 flex items-center gap-1">● Online</p></div></header>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
             {messages.length === 0 && (<div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2 opacity-50"><MessageSquare size={48} /><p className="text-xs">O chat está silencioso...</p></div>)}
             {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 relative group ${msg.userId === user.uid ? 'flex-row-reverse' : ''}`}>
                   <img src={msg.userPhoto} className="w-8 h-8 rounded-full border border-zinc-800" alt="User" />
                   <div className="relative">
                     <div onClick={(e) => { e.stopPropagation(); setActiveReactionMsg(activeReactionMsg === msg.id ? null : msg.id); }} className={`rounded-2xl p-3 max-w-[240px] cursor-pointer transition active:scale-95 ${msg.userId === user.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'} ${activeReactionMsg === msg.id ? 'ring-2 ring-white/50' : ''}`}>
                        <div className="flex justify-between items-baseline gap-4 mb-1"><p className={`text-[10px] font-bold ${msg.userId === user.uid ? 'text-green-200' : 'text-zinc-400'}`}>{msg.userName}</p><span className={`text-[8px] ${msg.userId === user.uid ? 'text-green-300' : 'text-zinc-500'}`}>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '...'}</span></div>
                        <p className="text-sm leading-tight break-words">{msg.text}</p>
                     </div>
                     {msg.reactions && Object.keys(msg.reactions).length > 0 && (<div className={`absolute -bottom-4 flex gap-1 ${msg.userId === user.uid ? 'right-0' : 'left-0'}`}>{Object.entries(msg.reactions).map(([emoji, users]) => (<span key={emoji} className="bg-zinc-900 border border-zinc-800 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">{emoji} <span className="text-zinc-500">{users.length}</span></span>))}</div>)}
                     {activeReactionMsg === msg.id && (<div className={`absolute -top-12 flex items-center gap-2 bg-zinc-900 border border-zinc-700 p-2 rounded-full shadow-2xl z-50 animate-in fade-in zoom-in duration-200 ${msg.userId === user.uid ? 'right-0' : 'left-0'}`}>{["🔥", "💪", "❤️", "👏"].map(emoji => (<button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(msg, emoji); }} className="hover:scale-125 transition text-lg leading-none">{emoji}</button>))}{msg.userId === user.uid && (<button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }} className="ml-2 border-l border-zinc-700 pl-2 text-zinc-500 hover:text-red-500"><Trash2 size={16} /></button>)}</div>)}
                   </div>
                </div>
             ))}
             <div ref={messagesEndRef} />
           </div>
           <div className="absolute bottom-20 left-0 w-full p-3 bg-black border-t border-zinc-900 z-30"><div className="bg-zinc-900 rounded-full flex items-center px-4 py-3 border border-zinc-800 focus-within:border-green-500 transition gap-2"><button className="text-zinc-500 hover:text-white"><Camera size={20} /></button><input className="bg-transparent flex-1 outline-none text-sm text-white placeholder-zinc-500" placeholder="Enviar mensagem..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}/><button className="text-zinc-500 hover:text-white"><AtSign size={20} /></button><button onClick={handleSendMessage} className={`${chatInput.trim() ? 'text-green-500' : 'text-zinc-600'} transition-colors`}><Send size={20} /></button></div></div>
        </div>
      )}

      {screen === "profile" && (
        <div className="flex-1 flex flex-col bg-black p-6 pb-24 overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-center uppercase tracking-widest text-green-500">Seu Perfil</h2>
            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    <img src={newProfileImage ? URL.createObjectURL(newProfileImage) : (user.photoURL || "https://ui-avatars.com/api/?name=User")} className="w-28 h-28 rounded-full border-4 border-zinc-800 object-cover" alt="Perfil" />
                    {isEditingProfile && (<label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer hover:bg-black/70 transition"><Camera size={32} className="text-white opacity-80" /><input type="file" className="hidden" accept="image/*" onChange={(e) => setNewProfileImage(e.target.files?.[0] || null)} /></label>)}
                </div>
                {isEditingProfile ? (<div className="mt-4 w-full flex gap-2"><input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-white text-center w-full focus:border-green-500 outline-none" placeholder="Seu Nome" /><button onClick={handleSaveProfile} disabled={loading} className="bg-green-500 p-2 rounded-lg text-black hover:bg-green-400"><Save size={20}/></button></div>) : (<div className="mt-4 flex items-center gap-2"><h2 className="text-2xl font-bold text-white">{user.displayName}</h2><button onClick={() => { setIsEditingProfile(true); setNewProfileName(user.displayName || ""); }} className="text-zinc-500 hover:text-white"><Pencil size={16} /></button></div>)}
                <p className="text-zinc-500 text-xs mt-1">Membro desde 2026</p>
                <button onClick={() => signOut(auth)} className="mt-4 text-red-500 text-xs flex items-center gap-1 hover:underline"><LogOut size={12}/> Sair da conta</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col items-center"><span className="text-2xl font-bold text-white">{myTotalWorkouts}</span><span className="text-[10px] text-zinc-500 uppercase">Treinos</span></div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col items-center"><span className="text-2xl font-bold text-orange-500">{myTotalCalories}</span><span className="text-[10px] text-zinc-500 uppercase">Calorias</span></div>
                 <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col items-center"><span className="text-2xl font-bold text-green-500">327</span><span className="text-[10px] text-zinc-500 uppercase">Dias Rest.</span></div>
            </div>
            <h3 className="text-sm font-bold text-zinc-400 mb-3 ml-1">Galeria de Treinos</h3>
            {myPosts.length === 0 ? (<div className="text-center py-10 text-zinc-600 border border-dashed border-zinc-800 rounded-xl"><p>Nenhum treino registrado.</p></div>) : (<div className="grid grid-cols-3 gap-2">{myPosts.map(post => (<div key={post.id} className="aspect-square rounded-lg overflow-hidden border border-zinc-800 relative group"><img src={post.imageUrl} className="w-full h-full object-cover" alt="Post" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><span className="text-xs font-bold text-white flex items-center gap-1"><Heart size={10} fill="white"/> {post.likes.length}</span></div></div>))}</div>)}
        </div>
      )}

      {/* --- NAV --- */}
      <nav className="fixed bottom-0 w-full max-w-md bg-black border-t border-zinc-900 flex justify-around py-4 z-50 h-20">
        <button onClick={() => setScreen("feed")} className={`flex flex-col items-center gap-1 transition ${screen === 'feed' ? 'text-green-500' : 'text-zinc-600'}`}><LayoutList size={22} /><span className="text-[10px] font-medium">Feed</span></button>
        <button onClick={() => setScreen("ranking")} className={`flex flex-col items-center gap-1 transition ${screen === 'ranking' ? 'text-green-500' : 'text-zinc-600'}`}><Trophy size={22} /><span className="text-[10px] font-medium">Ranking</span></button>
        <button onClick={() => setScreen("chat")} className={`flex flex-col items-center gap-1 transition ${screen === 'chat' ? 'text-green-500' : 'text-zinc-600'}`}><MessageSquare size={22} /><span className="text-[10px] font-medium">Chat</span></button>
        <button onClick={() => setScreen("profile")} className={`flex flex-col items-center gap-1 transition ${screen === 'profile' ? 'text-green-500' : 'text-zinc-600'}`}><UserIcon size={22} /><span className="text-[10px] font-medium">Perfil</span></button>
      </nav>

      {(image || editingPost) && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-end justify-center z-[100]">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6"><h3 className="text-green-500 font-black text-xl tracking-wider uppercase italic">{editingPost ? "Editar Treino" : "Confirmar Treino"}</h3><button onClick={clearModal} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition"><X size={20} /></button></div>
            <div className="relative mb-6 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-lg aspect-square max-h-56 mx-auto group"><img src={image ? URL.createObjectURL(image) : editingPost?.imageUrl} className="w-full h-full object-cover" alt="Preview" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div></div>
            
            {/* DATA E HORA */}
            <div className="grid grid-cols-2 gap-3 mb-4"><div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-2 focus-within:border-white/50 transition"><Calendar size={18} className="text-zinc-500" /><div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Dia</label><input type="date" className="w-full bg-transparent text-white text-sm outline-none custom-date-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}/></div></div><div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-2 focus-within:border-white/50 transition"><Clock size={18} className="text-zinc-500" /><div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Hora</label><input type="time" className="w-full bg-transparent text-white text-sm outline-none custom-time-input" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}/></div></div></div>
            
            {/* INPUTS DE EXERCÍCIOS (NOVO) */}
            <div className="mb-6 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-zinc-400 font-bold text-xs uppercase mb-3 flex items-center gap-2"><Dumbbell size={14}/> Montar Treino</h4>
                <div className="grid grid-cols-4 gap-2 mb-2">
                     <input placeholder="Exercício" className="col-span-4 bg-zinc-900 rounded-lg p-2 text-xs text-white border border-zinc-800" value={exName} onChange={(e) => setExName(e.target.value)} />
                     <input placeholder="Séries" type="number" className="bg-zinc-900 rounded-lg p-2 text-xs text-white border border-zinc-800" value={exSets} onChange={(e) => setExSets(e.target.value)} />
                     <input placeholder="Reps" type="number" className="bg-zinc-900 rounded-lg p-2 text-xs text-white border border-zinc-800" value={exReps} onChange={(e) => setExReps(e.target.value)} />
                     <input placeholder="Kg" type="number" className="bg-zinc-900 rounded-lg p-2 text-xs text-white border border-zinc-800" value={exWeight} onChange={(e) => setExWeight(e.target.value)} />
                     <input placeholder="Rest (s)" type="number" className="bg-zinc-900 rounded-lg p-2 text-xs text-white border border-zinc-800" value={exRest} onChange={(e) => setExRest(e.target.value)} />
                </div>
                <button onClick={addExercise} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2 rounded-lg font-bold mb-3 transition">+ Adicionar Exercício</button>
                
                {currentExercises.length > 0 && (
                    <div className="space-y-1">
                        {currentExercises.map((ex, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg border border-zinc-800/50">
                                <div className="text-xs text-white flex gap-2">
                                    <span className="font-bold">{idx + 1}. {ex.name}</span>
                                    <span className="text-zinc-500">{ex.sets}x{ex.reps} - {ex.weight}kg</span>
                                </div>
                                <button onClick={() => removeExercise(idx)} className="text-zinc-600 hover:text-red-500"><X size={12}/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4 mb-6"><div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-3 focus-within:border-green-500 transition"><Clock size={18} className="text-zinc-500" /><div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Duração</label><input type="text" placeholder="Ex: 1h 30m" className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600" value={duration} onChange={(e) => setDuration(e.target.value)}/></div></div><div className="flex gap-3"><div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-3 focus-within:border-orange-500 transition flex-1"><Flame size={18} className="text-orange-500" /><div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Calorias</label><input type="number" placeholder="Ex: 450" className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600" value={calories} onChange={(e) => setCalories(e.target.value)}/></div></div><div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-3 focus-within:border-blue-500 transition flex-1"><MapPin size={18} className="text-blue-500" /><div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Distância</label><input type="text" placeholder="Ex: 5km" className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600" value={distance} onChange={(e) => setDistance(e.target.value)}/></div></div></div>{!editingPost && (<div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex gap-3 focus-within:border-green-500 transition items-start"><AlignLeft size={18} className="text-zinc-500 mt-1" /><div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Descrição</label><textarea placeholder="Como foi o treino hoje?" rows={3} className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600 resize-none custom-scrollbar" value={initialComment} onChange={(e) => setInitialComment(e.target.value)}/></div></div>)}</div>
            <button onClick={handleSavePost} disabled={loading} className="w-full bg-green-500 py-4 rounded-xl font-black text-black text-lg uppercase tracking-wider hover:bg-green-400 transition shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mb-6">{loading ? "Salvando..." : <>{editingPost ? "Atualizar Treino" : "Postar Agora"} <Flame size={20} fill="black" /></>}</button>
          </div>
        </div>
      )}
    </div>
  );
}