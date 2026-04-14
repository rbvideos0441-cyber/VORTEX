import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Coins, Send, Mic, MicOff, Video, VideoOff, Share2, Heart, Hand, MessageCircle, Star, MoreHorizontal, Shield, Power, Plus, UserPlus, Lock, Unlock, Trophy, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { LiveStream, LiveParticipant, LiveMessage } from '../types';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';

interface LiveStreamScreenProps {
  live: LiveStream;
  isHost: boolean;
  onClose: () => void;
}

interface Slot {
  id: number;
  isOpen: boolean;
  participant: LiveParticipant | null;
}

export const LiveStreamScreen: React.FC<LiveStreamScreenProps> = ({ live: initialLive, isHost, onClose }) => {
  const [live, setLive] = useState<LiveStream>(initialLive);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showCoinRain, setShowCoinRain] = useState(false);
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>([]);
  const [activeSlotCount, setActiveSlotCount] = useState(initialLive.activeSlotCount || 0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showHostControls, setShowHostControls] = useState(false);
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState<number | null>(null);
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Real-time Live State Sync
  useEffect(() => {
    const liveRef = doc(db, 'lives', initialLive.id);
    const unsubscribe = onSnapshot(liveRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as LiveStream;
        setLive(data);
        setActiveSlotCount(data.activeSlotCount || 0);
      }
    });
    return () => unsubscribe();
  }, [initialLive.id]);

  // Real-time Chat Sync
  useEffect(() => {
    const messagesRef = collection(db, 'lives', initialLive.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveMessage));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [initialLive.id]);

  // Sync slots with activeSlotCount and live.participants
  useEffect(() => {
    const newSlots: Slot[] = Array.from({ length: activeSlotCount }, (_, i) => {
      const participant = live.participants?.[i] || null;
      return {
        id: i,
        isOpen: true,
        participant
      };
    });
    setSlots(newSlots);
  }, [activeSlotCount, live.participants]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !auth.currentUser) return;
    const messagesRef = collection(db, 'lives', initialLive.id, 'messages');
    await addDoc(messagesRef, {
      uid: auth.currentUser.uid,
      username: auth.currentUser.displayName || 'Usuário',
      text: inputText,
      type: 'chat',
      createdAt: serverTimestamp()
    });
    setInputText('');
  };

  const sendGift = async () => {
    if (!auth.currentUser) return;
    setShowCoinRain(true);
    setTimeout(() => setShowCoinRain(false), 3000);
    
    const messagesRef = collection(db, 'lives', initialLive.id, 'messages');
    await addDoc(messagesRef, {
      uid: auth.currentUser.uid,
      username: auth.currentUser.displayName || 'Usuário',
      text: 'enviou 100 moedas! ◈',
      type: 'gift',
      giftValue: 100,
      createdAt: serverTimestamp()
    });

    const liveRef = doc(db, 'lives', initialLive.id);
    await updateDoc(liveRef, {
      coinCount: (live.coinCount || 0) + 100
    });
  };

  const addReaction = (emoji: string) => {
    const id = Date.now();
    setReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const addSlot = async () => {
    if (!isHost || activeSlotCount >= 8) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    await updateDoc(liveRef, {
      activeSlotCount: activeSlotCount + 1
    });
  };

  const removeSlot = async () => {
    if (!isHost || activeSlotCount <= 0) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    const newParticipants = [...(live.participants || [])];
    if (newParticipants.length >= activeSlotCount) {
      newParticipants.pop();
    }
    await updateDoc(liveRef, {
      activeSlotCount: activeSlotCount - 1,
      participants: newParticipants
    });
  };

  const addMockParticipant = async (slotId: number) => {
    if (!isHost) return;
    const mockUser: LiveParticipant = {
      uid: `user_${Date.now()}`,
      username: `convidado_${Math.floor(Math.random() * 1000)}`,
      photoURL: `https://picsum.photos/seed/${Date.now()}/100/100`,
      isMuted: false,
      isVideoOff: false
    };
    
    const liveRef = doc(db, 'lives', initialLive.id);
    const newParticipants = [...(live.participants || [])];
    newParticipants[slotId] = mockUser;
    
    await updateDoc(liveRef, {
      participants: newParticipants
    });
  };

  const removeParticipant = async (slotId: number) => {
    if (!isHost) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    const newParticipants = [...(live.participants || [])];
    newParticipants.splice(slotId, 1);
    
    await updateDoc(liveRef, {
      participants: newParticipants
    });
  };

  const toggleMuteParticipant = async (slotId: number) => {
    if (!isHost || !live.participants?.[slotId]) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    const newParticipants = [...(live.participants || [])];
    newParticipants[slotId] = {
      ...newParticipants[slotId],
      isMuted: !newParticipants[slotId].isMuted
    };
    
    await updateDoc(liveRef, {
      participants: newParticipants
    });
  };

  const muteAllParticipants = async () => {
    if (!isHost || !live.participants) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    const newParticipants = live.participants.map(p => ({ ...p, isMuted: true }));
    
    await updateDoc(liveRef, {
      participants: newParticipants
    });
    setShowHostControls(false);
  };

  const removeAllParticipants = async () => {
    if (!isHost) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    await updateDoc(liveRef, {
      participants: []
    });
    setShowHostControls(false);
  };

  const blockUser = async (uid: string) => {
    if (!isHost) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    await updateDoc(liveRef, {
      blockedUids: arrayUnion(uid)
    });
    
    // Also remove them from participants if they are there
    const participantIndex = live.participants?.findIndex(p => p.uid === uid);
    if (participantIndex !== undefined && participantIndex !== -1) {
      await removeParticipant(participantIndex);
    }
    
    setSelectedParticipantIndex(null);
    
    // System message about the block
    const messagesRef = collection(db, 'lives', initialLive.id, 'messages');
    await addDoc(messagesRef, {
      uid: 'system',
      username: 'Sistema',
      text: `Um usuário foi bloqueado da transmissão.`,
      type: 'system',
      createdAt: serverTimestamp()
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden font-sans">
      {/* Top Bar - Host Info & Stats */}
      <div className="relative z-20 px-4 pt-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 pr-3 rounded-full border border-white/10">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <img src={live.creatorPhoto} alt="host" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold leading-tight truncate max-w-[80px]">{live.creatorName}</span>
              <div className="flex items-center gap-1">
                <Heart size={8} fill="#EC4899" className="text-vortex-secondary" />
                <span className="text-[8px] font-bold text-white/60">231</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Heart size={14} fill="#F87171" className="text-red-400" />
            <span className="text-[10px] font-bold">486</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Users size={12} className="text-white/60" />
            <span className="text-[10px] font-bold">6</span>
          </div>
          <button onClick={onClose} className="p-2 glass rounded-full text-white/80 hover:text-white transition-colors">
            <Power size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="relative z-10 flex flex-col min-h-0 flex-1 mt-2">
        <div className="flex px-2 gap-1 h-[320px] shrink-0">
          {/* Left Side - Host */}
          <div className={cn(
            "h-full rounded-2xl overflow-hidden relative border border-white/10 bg-vortex-surface transition-all duration-500",
            activeSlotCount > 0 ? "w-[60%] rounded-r-none" : "w-full"
          )}>
            {live.type === 'video' ? (
              <div className="w-full h-full relative">
                <img 
                  src="https://picsum.photos/seed/host_video/600/800" 
                  alt="host video" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 glass px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">Host</div>
                <div className="absolute bottom-2 left-2 text-[10px] font-bold drop-shadow-lg">{live.creatorName}</div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-vortex-bg p-4">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative"
                >
                  <div className="w-24 h-24 rounded-full border-4 border-vortex-accent p-1">
                    <img src={live.creatorPhoto} alt="host" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 1 }}
                      className="absolute inset-0 border border-vortex-accent rounded-full"
                    />
                  ))}
                </motion.div>
                <span className="mt-4 text-xs font-bold">{live.creatorName}</span>
              </div>
            )}
          </div>

          {/* Right Side - Participants Grid (Dynamic columns/rows) */}
          {activeSlotCount > 0 && (
            <div className="w-[40%] h-full grid grid-cols-2 grid-rows-4 gap-1">
              {slots.map((slot) => (
                <div 
                  key={slot.id}
                  onClick={() => isHost && slot.participant && setSelectedParticipantIndex(slot.id)}
                  className={cn(
                    "relative rounded-r-sm overflow-hidden border border-white/5 transition-all bg-black/40 group cursor-pointer",
                    isHost && slot.participant && "hover:border-vortex-accent/50"
                  )}
                >
                  {slot.participant ? (
                    <div className="w-full h-full relative">
                      {live.type === 'video' && !slot.participant.isVideoOff ? (
                        <img src={slot.participant.photoURL} alt={slot.participant.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-vortex-surface p-1">
                          <img src={slot.participant.photoURL} alt={slot.participant.username} className="w-8 h-8 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 text-[8px] font-bold truncate w-[90%] drop-shadow-md">{slot.participant.username}</div>
                      {slot.participant.isMuted && (
                        <div className="absolute bottom-1 right-1 bg-black/60 p-0.5 rounded">
                          <MicOff size={8} className="text-vortex-secondary" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => addMockParticipant(slot.id)}
                      className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-white/5 transition-colors"
                    >
                      <Plus size={16} className="text-vortex-accent" />
                      <span className="text-[8px] font-bold text-vortex-accent uppercase">Convidar</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Host Control Bar (Add/Remove Slots) */}
        {isHost && (
          <div className="relative z-20 px-4 mt-2 flex items-center gap-2 shrink-0">
            <button 
              onClick={addSlot}
              className="flex-1 glass py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <Plus size={14} className="text-vortex-accent" />
              Adicionar Janela
            </button>
            <button 
              onClick={removeSlot}
              className="flex-1 glass py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <X size={14} className="text-vortex-secondary" />
              Remover Janela
            </button>
          </div>
        )}

        {/* Chat Area - Dedicated Section */}
        <div className="relative z-20 px-4 mt-2 flex-1 flex flex-col justify-end min-h-0 pb-2">
          <div className="overflow-y-auto no-scrollbar space-y-2 pr-4 bg-black/20 rounded-xl p-2">
            {messages.length === 0 && (
              <div className="text-[10px] text-vortex-text-secondary italic text-center py-2">
                Bem-vindo à live! Diga algo...
              </div>
            )}
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2"
              >
                <button 
                  onClick={() => {
                    if (isHost && msg.uid !== 'system' && msg.uid !== auth.currentUser?.uid) {
                      setSelectedUserUid(msg.uid);
                    }
                  }}
                  className={cn(
                    "w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5",
                    isHost && msg.uid !== 'system' && msg.uid !== auth.currentUser?.uid && "cursor-pointer ring-1 ring-vortex-accent/30"
                  )}
                >
                  <img src={`https://picsum.photos/seed/${msg.uid}/40/40`} alt="user" referrerPolicy="no-referrer" />
                </button>
                <div className={cn(
                  "text-[10px] leading-tight px-2 py-1 rounded-lg",
                  msg.type === 'system' ? "text-vortex-accent font-bold" : 
                  msg.type === 'gift' ? "bg-vortex-gold/20 text-vortex-gold border border-vortex-gold/30" :
                  "bg-black/60 text-white"
                )}>
                  <span className="font-bold text-white/60 mr-1">{msg.username}</span>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Footer Interaction Bar */}
      <div className="relative z-20 px-4 pb-6 flex items-center gap-3 shrink-0">
        <div className="flex-1 glass rounded-full px-4 py-2 flex items-center gap-3">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Diga algo..." 
            className="flex-1 bg-transparent border-none outline-none text-xs placeholder:text-white/30"
          />
          <button onClick={sendMessage} className="text-vortex-accent">
            <Send size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={sendGift}
            className="p-2.5 bg-vortex-gold rounded-full text-white shadow-lg"
          >
            <Coins size={18} />
          </button>
          <button className="p-2.5 glass rounded-full text-white">
            <Share2 size={18} />
          </button>
          {isHost ? (
            <button 
              onClick={() => setShowHostControls(!showHostControls)}
              className={cn(
                "p-2.5 rounded-full text-white transition-all",
                showHostControls ? "bg-vortex-accent scale-110" : "bg-vortex-accent/40 hover:bg-vortex-accent"
              )}
            >
              <Shield size={18} />
            </button>
          ) : (
            <button className="p-2.5 glass rounded-full text-white">
              <UserPlus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Coin Rain Animation */}
      <AnimatePresence>
        {showCoinRain && (
          <div className="absolute inset-0 z-[110] pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -50, x: Math.random() * window.innerWidth, opacity: 1 }}
                animate={{ y: window.innerHeight + 50, rotate: 360 }}
                transition={{ duration: 2 + Math.random() * 1, ease: "linear" }}
                className="absolute text-vortex-gold"
              >
                <Coins size={20} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Host Controls Menu */}
      <AnimatePresence>
        {showHostControls && isHost && (
          <div className="absolute inset-0 z-[120] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHostControls(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-sm glass rounded-t-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Shield size={20} className="text-vortex-accent" />
                  Painel do Host
                </h3>
                <button onClick={() => setShowHostControls(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-vortex-accent/10 rounded-2xl border border-vortex-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">Privacidade da Live</span>
                    <Lock size={14} className="text-vortex-accent" />
                  </div>
                  <p className="text-[10px] text-white/60">Sua live está configurada como pública. Clique em um participante para gerenciar permissões individuais.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowHostControls(false)}
                className="w-full py-4 text-sm font-bold text-white/40 hover:text-white transition-colors"
              >
                Fechar Painel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Participant/User Action Modal */}
      <AnimatePresence>
        {(selectedParticipantIndex !== null || selectedUserUid !== null) && (
          <div className="absolute inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedParticipantIndex(null);
                setSelectedUserUid(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs glass rounded-[32px] p-6 flex flex-col items-center gap-6"
            >
              {(() => {
                const participant = selectedParticipantIndex !== null ? live.participants?.[selectedParticipantIndex] : null;
                const userUid = selectedUserUid || participant?.uid;
                const username = participant?.username || messages.find(m => m.uid === userUid)?.username || 'Usuário';
                const photoURL = participant?.photoURL || `https://picsum.photos/seed/${userUid}/100/100`;

                return (
                  <>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-4 border-vortex-accent p-1">
                        <img 
                          src={photoURL} 
                          alt="user" 
                          className="w-full h-full rounded-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="font-display font-bold text-lg">@{username}</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Gerenciar Usuário</p>
                      </div>
                    </div>

                    <div className="w-full grid grid-cols-1 gap-2">
                      {participant && (
                        <button 
                          onClick={() => {
                            toggleMuteParticipant(selectedParticipantIndex!);
                            setSelectedParticipantIndex(null);
                          }}
                          className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 transition-all border border-white/5"
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            participant.isMuted ? "bg-vortex-accent/20" : "bg-vortex-secondary/20"
                          )}>
                            {participant.isMuted ? 
                              <Mic size={18} className="text-vortex-accent" /> : 
                              <MicOff size={18} className="text-vortex-secondary" />
                            }
                          </div>
                          <span className="text-sm font-bold">
                            {participant.isMuted ? 'Desmutar Áudio' : 'Mutar Áudio'}
                          </span>
                        </button>
                      )}

                      {(participant || selectedUserUid) && (
                        <button 
                          onClick={() => {
                            if (participant) {
                              removeParticipant(selectedParticipantIndex!);
                            }
                            // If it's just a user in chat, "removing" them might mean kicking them (not implemented yet, but we can block)
                            setSelectedParticipantIndex(null);
                            setSelectedUserUid(null);
                          }}
                          className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl flex items-center gap-3 transition-all border border-red-500/10"
                        >
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <X size={18} className="text-red-500" />
                          </div>
                          <span className="text-sm font-bold text-red-400">
                            {participant ? 'Remover da Janela' : 'Remover da Live'}
                          </span>
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          if (userUid) blockUser(userUid);
                          setSelectedParticipantIndex(null);
                          setSelectedUserUid(null);
                        }}
                        className="w-full py-3 px-4 bg-red-900/20 hover:bg-red-900/30 rounded-2xl flex items-center gap-3 transition-all border border-red-900/20"
                      >
                        <div className="p-2 bg-red-900/40 rounded-lg">
                          <Shield size={18} className="text-red-500" />
                        </div>
                        <span className="text-sm font-bold text-red-500">Bloquear Usuário</span>
                      </button>
                    </div>
                  </>
                );
              })()}

              <button 
                onClick={() => {
                  setSelectedParticipantIndex(null);
                  setSelectedUserUid(null);
                }}
                className="py-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emoji Reactions Animation */}
      <div className="absolute right-4 bottom-32 z-[110] pointer-events-none">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 0, opacity: 1, scale: 0.5 }}
              animate={{ y: -300, opacity: 0, scale: 1.5, x: (Math.random() - 0.5) * 50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute text-2xl"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
