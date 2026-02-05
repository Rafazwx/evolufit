/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { auth, db, storage } from "../firebase"; 
import { 
  signInWithPopup, // <--- MUDANÇA: Agora usamos Popup
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
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
  LayoutList, X, Clock, MapPin, Flame, Send, Camera, AtSign, Bell, BellRing, AlignLeft, Calendar, ArrowLeft, AlertTriangle
} from "lucide-react";

import WeeklyChart from "./graficos/weeklychart";

// --- Interfaces ---
interface Comment {
  userName: string;
  text: string;
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
  createdAt: any;
}

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string;
  createdAt: any;
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
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Estado para o botão de login
  
  // Inputs do Modal
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [distance, setDistance] = useState("");
  const [initialComment, setInitialComment] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<"feed" | "ranking" | "chat">("feed");

  // --- Inicializar Data/Hora ---
  useEffect(() => {
    if (image) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);

      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setSelectedTime(`${hh}:${min}`);
    }
  }, [image]);

  // --- Auth & Notificações ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthChecking(false); 
    });

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") setNotificationsEnabled(true);
    }
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('Erro SW:', err));
    }
    return () => unsub();
  }, []);

  // --- Monitorar Posts ---
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setPosts(data);
    });
  }, []);

  // --- Monitorar Chat ---
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

  // --- LOGIN COM POPUP (SOLUÇÃO IPHONE) ---
  const handleLogin = async () => {
    setLoginError(""); 
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      // Se der certo, o onAuthStateChanged vai pegar o usuário e mudar a tela
    } catch (error: any) {
      console.error("Erro no Login:", error);
      
      // Traduzindo erros comuns para o usuário
      let msg = "Erro ao fazer login. Tente novamente.";
      if (error.code === 'auth/popup-blocked') msg = "O navegador bloqueou o popup. Permita popups para entrar.";
      if (error.code === 'auth/popup-closed-by-user') msg = "Você fechou a janela antes de terminar o login.";
      if (error.code === 'auth/cancelled-popup-request') msg = "Muitas tentativas. Espere um pouco.";
      if (error.code === 'auth/network-request-failed') msg = "Sem internet. Verifique sua conexão.";
      
      setLoginError(msg);
      setIsLoggingIn(false);
    }
  };

  // --- Upload ---
  const handleUpload = async () => {
    if (!image || !user) return;
    setLoading(true);
    try {
      const storageRef = ref(storage, `posts/${Date.now()}-${image.name}`);
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);
      
      const startComments = initialComment.trim() 
        ? [{ userName: user.displayName || "Atleta", text: initialComment.trim() }] 
        : [];

      let finalDate = new Date();
      if (selectedDate && selectedTime) {
        finalDate = new Date(`${selectedDate}T${selectedTime}`);
      }

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
        createdAt: Timestamp.fromDate(finalDate), 
      });
      
      clearModal();
      if (notificationsEnabled) new Notification("EvoFit", { body: "Treino registrado! 🔥" });

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const clearModal = () => {
      setImage(null);
      setDuration("");
      setCalories("");
      setDistance("");
      setInitialComment("");
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: chatInput,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp()
      });
      setChatInput("");
    } catch (e) { console.error(e); }
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


  // --- TELA DE CARREGAMENTO ---
  if (isAuthChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <Flame size={48} className="text-green-500 fill-green-500 animate-pulse" />
        <p className="mt-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  // --- TELA DE LOGIN ---
  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="flex items-center gap-2 mb-6">
        <Flame size={32} className="text-green-500 fill-green-500" />
        <span className="text-3xl font-bold text-white tracking-tighter">EvoFit</span>
      </div>
      <h1 className="text-2xl font-bold mb-2 text-center">Bem-vindo ao Desafio</h1>
      <p className="text-zinc-400 text-center mb-8 text-sm px-4">Junte-se aos seus amigos e alcance a sua melhor versão em 2026.</p>
      
      {/* --- CAIXA DE ERRO --- */}
      {loginError && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6 flex items-start gap-3 w-full">
           <AlertTriangle className="text-red-500 shrink-0" size={20} />
           <p className="text-red-200 text-xs text-left break-all">{loginError}</p>
        </div>
      )}

      <button 
        onClick={handleLogin} 
        disabled={isLoggingIn}
        className="bg-white text-black w-full py-4 rounded-full font-bold text-sm shadow-lg hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoggingIn ? "Abrindo Google..." : "Entrar com Google"}
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-black min-h-screen text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* --- TELA 1: FEED --- */}
      {screen === "feed" && (
        <>
          <div className="relative h-48 w-full">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10"></div>
             <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Gym Background" />
             <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center">
                <div className="flex items-center gap-1"><Flame size={20} className="text-green-500 fill-green-500"/><h2 className="text-lg font-bold tracking-tight">EvoFit</h2></div>
                <div className="flex gap-4 items-center">
                  <button onClick={requestNotification} className={notificationsEnabled ? "text-green-500" : "text-white/80"}>{notificationsEnabled ? <BellRing size={20} /> : <Bell size={20} />}</button>
                  <button onClick={() => signOut(auth)}><LogOut size={20} className="text-white/80"/></button>
                </div>
             </div>
             <div className="absolute bottom-4 left-4 z-20"><h1 className="text-2xl font-bold text-white">Desafio Fit 2026</h1></div>
          </div>

          <main className="flex-1 pb-32 px-4 -mt-4 relative z-20">
            {/* Top 3 Resumo */}
            <div className="bg-zinc-900 rounded-2xl p-4 mb-4 grid grid-cols-3 gap-2 text-center border border-zinc-800 shadow-xl">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-1"><img src={leader.photo || "https://ui-avatars.com/api/?name=?"} className="w-10 h-10 rounded-full border-2 border-red-500" alt="Líder" /><span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-sm">1º</span></div>
                <span className="text-[10px] font-bold mt-1 truncate w-full">{leader.name.split(' ')[0]}</span>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-r border-zinc-800">
                <div className="relative mb-1"><img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-green-500" alt="Você" /><span className="absolute -bottom-1 -right-1 bg-green-500 text-black text-[8px] font-bold px-1 rounded-sm">{myRank}º</span></div>
                <span className="text-[10px] font-bold mt-1 text-green-400">Você</span>
              </div>
              <div className="flex flex-col items-center justify-center"><span className="text-2xl font-bold text-white">327</span><span className="text-[9px] text-zinc-500 uppercase mt-1">Dias Rest.</span></div>
            </div>

            {/* --- GRÁFICO --- */}
            <div className="h-40 w-full mb-4">
               <WeeklyChart posts={posts} userId={user.uid} />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Feed da Comunidade</h3>
              {posts.map((post) => (
                <div key={post.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={post.userPhoto} className="w-8 h-8 rounded-full" alt="User" />
                      <div>
                          <p className="font-bold text-sm text-white leading-none">{post.userName}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Calendar size={10} />
                              <p className="text-[10px]">
                                {post.createdAt?.toDate 
                                  ? post.createdAt.toDate().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})
                                  : "Hoje"}
                              </p>
                            </div>
                            {post.duration && (<div className="flex items-center gap-1 text-zinc-400"><Clock size={10} /><p className="text-[10px]">{post.duration}</p></div>)}
                          </div>
                      </div>
                    </div>
                    {post.userId === user.uid && (<button onClick={() => deleteDoc(doc(db, "posts", post.id))}><Trash2 size={16} className="text-zinc-600 hover:text-red-500"/></button>)}
                  </div>
                  <img src={post.imageUrl} className="w-full aspect-square object-cover bg-zinc-950" alt="Treino" />
                  <div className="p-3">
                    <div className="flex gap-4 mb-2">
                      <button onClick={async () => {
                        const ref = doc(db, "posts", post.id);
                        post.likes.includes(user.uid) ? await updateDoc(ref, { likes: arrayRemove(user.uid) }) : await updateDoc(ref, { likes: arrayUnion(user.uid) });
                      }}><Heart size={24} className={post.likes.includes(user.uid) ? "fill-red-500 text-red-500" : "text-white"} /></button>
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

      {/* --- TELA 2: RANKING --- */}
      {screen === "ranking" && (
        <div className="flex-1 p-6 pb-24 bg-black">
           <h2 className="text-xl font-bold mb-6 text-center uppercase tracking-widest text-green-500">Ranking Geral</h2>
           <div className="space-y-3">{ranking.map((r, i) => (<div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${i===0 ? 'bg-zinc-900 border-green-500' : 'bg-black border-zinc-800'}`}><div className="flex items-center gap-4"><span className={`font-black text-lg w-6 text-center ${i===0 ? 'text-green-500' : 'text-zinc-600'}`}>{i+1}</span><img src={r.photo} className="w-12 h-12 rounded-full border border-zinc-800" alt="Rank" /><span className="font-bold">{r.name}</span></div><div className="text-right"><span className="block font-bold text-lg text-white">{r.count}</span><span className="text-[10px] text-zinc-500 uppercase">Treinos</span></div></div>))}</div>
        </div>
      )}

      {/* --- TELA 3: CHAT --- */}
      {screen === "chat" && (
        <div className="flex-1 flex flex-col h-[100dvh] bg-black relative"> 
           <header className="p-4 border-b border-zinc-900 flex items-center gap-4 bg-black z-20"><button onClick={() => setScreen("feed")}><ArrowLeft size={24} className="text-zinc-400" /></button><div className="flex-1"><h2 className="font-bold text-sm text-white">Comunidade EvoFit</h2><p className="text-[10px] text-green-500 flex items-center gap-1">● Online</p></div></header>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">{messages.length === 0 && (<div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2 opacity-50"><MessageSquare size={48} /><p className="text-xs">O chat está silencioso...</p></div>)}{messages.map((msg) => (<div key={msg.id} className={`flex items-start gap-3 ${msg.userId === user.uid ? 'flex-row-reverse' : ''}`}><img src={msg.userPhoto} className="w-8 h-8 rounded-full border border-zinc-800" alt="User" /><div className={`rounded-2xl p-3 max-w-[75%] ${msg.userId === user.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}><p className={`text-[10px] font-bold mb-1 ${msg.userId === user.uid ? 'text-green-200' : 'text-zinc-400'}`}>{msg.userName}</p><p className="text-sm leading-tight">{msg.text}</p></div></div>))}<div ref={messagesEndRef} /></div>
           <div className="absolute bottom-20 left-0 w-full p-3 bg-black border-t border-zinc-900 z-30"><div className="bg-zinc-900 rounded-full flex items-center px-4 py-3 border border-zinc-800 focus-within:border-green-500 transition gap-2"><button className="text-zinc-500 hover:text-white"><Camera size={20} /></button><input className="bg-transparent flex-1 outline-none text-sm text-white placeholder-zinc-500" placeholder="Enviar mensagem..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}/><button className="text-zinc-500 hover:text-white"><AtSign size={20} /></button><button onClick={handleSendMessage} className={`${chatInput.trim() ? 'text-green-500' : 'text-zinc-600'} transition-colors`}><Send size={20} /></button></div></div>
        </div>
      )}

      {/* --- NAV --- */}
      <nav className="fixed bottom-0 w-full max-w-md bg-black border-t border-zinc-900 flex justify-around py-4 z-50 h-20">
        <button onClick={() => setScreen("feed")} className={`flex flex-col items-center gap-1 transition ${screen === 'feed' ? 'text-green-500' : 'text-zinc-600'}`}><LayoutList size={22} /><span className="text-[10px] font-medium">Feed</span></button>
        <button onClick={() => setScreen("ranking")} className={`flex flex-col items-center gap-1 transition ${screen === 'ranking' ? 'text-green-500' : 'text-zinc-600'}`}><Trophy size={22} /><span className="text-[10px] font-medium">Ranking</span></button>
        <button onClick={() => setScreen("chat")} className={`flex flex-col items-center gap-1 transition ${screen === 'chat' ? 'text-green-500' : 'text-zinc-600'}`}><MessageSquare size={22} /><span className="text-[10px] font-medium">Chat</span></button>
      </nav>

      {/* --- MODAL DE UPLOAD --- */}
      {image && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-end justify-center z-[100]">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-green-500 font-black text-xl tracking-wider uppercase italic">Confirmar Treino</h3>
              <button onClick={clearModal} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition"><X size={20} /></button>
            </div>

            <div className="relative mb-6 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-lg aspect-square max-h-56 mx-auto group">
              <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" alt="Preview" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-2 focus-within:border-white/50 transition">
                  <Calendar size={18} className="text-zinc-500" />
                  <div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Dia</label><input type="date" className="w-full bg-transparent text-white text-sm outline-none custom-date-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}/></div>
               </div>
               <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-2 focus-within:border-white/50 transition">
                  <Clock size={18} className="text-zinc-500" />
                  <div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Hora</label><input type="time" className="w-full bg-transparent text-white text-sm outline-none custom-time-input" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}/></div>
               </div>
            </div>

            <div className="space-y-4 mb-6">
               <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-3 focus-within:border-green-500 transition">
                  <Clock size={18} className="text-zinc-500" />
                  <div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Duração</label><input type="text" placeholder="Ex: 1h 30m" className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600" value={duration} onChange={(e) => setDuration(e.target.value)}/></div>
               </div>

               <div className="flex gap-3">
                  <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-3 focus-within:border-orange-500 transition flex-1">
                      <Flame size={18} className="text-orange-500" />
                      <div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Calorias</label><input type="number" placeholder="Ex: 450" className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600" value={calories} onChange={(e) => setCalories(e.target.value)}/></div>
                  </div>
                  <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex items-center gap-3 focus-within:border-blue-500 transition flex-1">
                      <MapPin size={18} className="text-blue-500" />
                      <div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Distância</label><input type="text" placeholder="Ex: 5km" className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600" value={distance} onChange={(e) => setDistance(e.target.value)}/></div>
                  </div>
               </div>

               <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 flex gap-3 focus-within:border-green-500 transition items-start">
                  <AlignLeft size={18} className="text-zinc-500 mt-1" />
                  <div className="flex-1"><label className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Descrição</label><textarea placeholder="Como foi o treino hoje?" rows={3} className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600 resize-none custom-scrollbar" value={initialComment} onChange={(e) => setInitialComment(e.target.value)}/></div>
               </div>
            </div>

            <button onClick={handleUpload} disabled={loading} className="w-full bg-green-500 py-4 rounded-xl font-black text-black text-lg uppercase tracking-wider hover:bg-green-400 transition shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mb-6">
               {loading ? "Enviando..." : <>Postar Agora <Flame size={20} fill="black" /></>}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}