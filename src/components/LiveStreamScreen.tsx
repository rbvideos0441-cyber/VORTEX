import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Coins, Send, Mic, MicOff, Video, VideoOff, Share2, Heart, Hand, MessageCircle, Star, MoreHorizontal, Shield, Power, Plus, UserPlus, Lock, Unlock, Trophy, Zap, Check, AlertTriangle, Trash2, Camera, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { LiveStream, LiveParticipant, LiveMessage, UserProfile } from '../types';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove, setDoc, deleteDoc, getDocs, where, getDoc, increment } from 'firebase/firestore';

interface LiveStreamScreenProps {
  live: LiveStream;
  isHost: boolean;
  onClose: () => void;
}

const VideoStream = ({ stream, muted = false, className, filter = 'none' }: { stream: MediaStream; muted?: boolean; className?: string; filter?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const filterStyles: Record<string, string> = {
    none: '',
    sepia: 'sepia(0.8)',
    grayscale: 'grayscale(1)',
    beauty: 'contrast(1.1) brightness(1.1) saturate(1.1) blur(0.5px)',
    warm: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)',
    cool: 'saturate(1.2) hue-rotate(10deg) brightness(1.1)',
    vintage: 'contrast(1.2) brightness(0.9) sepia(0.5) saturate(0.8)',
    neon: 'contrast(1.5) brightness(1.2) saturate(2) hue-rotate(20deg)'
  };

  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      muted={muted} 
      className={className} 
      style={{ filter: filterStyles[filter] }}
      referrerPolicy="no-referrer" 
    />
  );
};

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [duration, setDuration] = useState('00:00');
  const [friends, setFriends] = useState<any[]>([]);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [videoFilter, setVideoFilter] = useState('none');
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [showEffectsMenu, setShowEffectsMenu] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [hasAttemptedMedia, setHasAttemptedMedia] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isModerator = live.moderatorUids?.includes(auth.currentUser?.uid || '');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  const iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Live duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (live.startedAt) {
        try {
          const start = live.startedAt.toDate ? live.startedAt.toDate().getTime() : new Date(live.startedAt).getTime();
          const now = Date.now();
          const diff = Math.floor((now - start) / 1000);
          
          if (diff < 0) {
            setDuration('00:00');
            return;
          }

          const h = Math.floor(diff / 3600);
          const m = Math.floor((diff % 3600) / 60);
          const s = diff % 60;

          const formatted = h > 0 
            ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          
          setDuration(formatted);
        } catch (e) {
          setDuration('00:00');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [live.startedAt]);

  // Fetch friends (simulated by fetching other users)
  useEffect(() => {
    if (!showShareMenu) return;
    
    const fetchFriends = async () => {
      try {
        const q = query(collection(db, 'users'), limit(10));
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs
          .map(doc => doc.data())
          .filter(u => u.uid !== auth.currentUser?.uid);
        setFriends(users);
      } catch (err) {
        console.error("Error fetching friends for sharing:", err);
      }
    };
    
    fetchFriends();
  }, [showShareMenu]);

  const shareWithFriend = async (friend: any) => {
    if (sharedWith.includes(friend.uid)) return;
    
    // Simulate sharing (could be a notification or message in a real app)
    setSharedWith(prev => [...prev, friend.uid]);
    
    // Add a system message to the chat locally to show it was shared
    const shareMsg: LiveMessage = {
      id: `share_${Date.now()}`,
      uid: 'system',
      username: 'Sistema',
      text: `Você compartilhou a live com ${friend.displayName}!`,
      type: 'system'
    };
    setMessages(prev => [...prev, shareMsg]);
  };

  // Fetch global settings and check access
  useEffect(() => {
    if (isHost) {
      setHasPaid(true);
      return;
    }

    const checkAccess = async () => {
      try {
        // Fetch settings
        const settingsSnap = await getDocs(collection(db, 'app_settings'));
        let settings = { requireEntryFee: false, liveEntryFee: 0 };
        if (!settingsSnap.empty) {
          settings = settingsSnap.docs[0].data() as any;
        }
        setGlobalSettings(settings);

        if (!settings.requireEntryFee) {
          setHasPaid(true);
          return;
        }

        // Check if user already paid
        const accessId = `${initialLive.id}_${auth.currentUser?.uid}`;
        const accessSnap = await getDocs(query(collection(db, 'stream_access'), where('userId', '==', auth.currentUser?.uid), where('liveId', '==', initialLive.id)));
        
        if (!accessSnap.empty) {
          setHasPaid(true);
        } else {
          setHasPaid(false);
        }
      } catch (err) {
        console.error("Error checking stream access:", err);
        // Fallback to allowing entry if error occurs to not block users
        setHasPaid(true);
      }
    };

    checkAccess();
  }, [initialLive.id, isHost]);

  const handlePayment = async () => {
    if (!auth.currentUser || !globalSettings) return;
    setIsPaying(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
      
      if (userSnap.empty) throw new Error("Usuário não encontrado");
      const userData = userSnap.docs[0].data();
      
      if ((userData.coins || 0) < globalSettings.liveEntryFee) {
        alert("Moedas insuficientes!");
        setIsPaying(false);
        return;
      }

      // Deduct coins
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        coins: (userData.coins || 0) - globalSettings.liveEntryFee
      });

      // Record access
      await addDoc(collection(db, 'stream_access'), {
        userId: auth.currentUser.uid,
        liveId: initialLive.id,
        paidAt: serverTimestamp(),
        amount: globalSettings.liveEntryFee
      });

      setHasPaid(true);
    } catch (err) {
      console.error("Payment error:", err);
      alert("Erro ao processar pagamento.");
    } finally {
      setIsPaying(false);
    }
  };

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

  // Initialize Local Media
  const initMedia = useCallback(async () => {
    setHasAttemptedMedia(true);
    try {
      // Stop existing tracks if quality changes
      localStreamRef.current?.getTracks().forEach(track => track.stop());

      const getStream = async (withVideo: boolean) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser does not support media devices');
        }
        const constraints = {
          video: withVideo ? {
            width: videoQuality === 'high' ? 1280 : videoQuality === 'medium' ? 640 : 320,
            height: videoQuality === 'high' ? 720 : videoQuality === 'medium' ? 480 : 240,
            frameRate: videoQuality === 'high' ? 30 : 24
          } : false,
          audio: true
        };
        return await navigator.mediaDevices.getUserMedia(constraints);
      };

      let stream: MediaStream;
      try {
        // Try to get both video and audio
        stream = await getStream(live.type === 'video');
        setPermissionError(null);
        setShowPermissionGuide(false);
      } catch (videoErr: any) {
        console.warn("Combined media access failed, trying fallback:", videoErr);
        
        const isNotFoundError = videoErr.name === 'NotFoundError' || videoErr.name === 'DevicesNotFoundError';
        const isPermissionError = videoErr.name === 'NotAllowedError' || videoErr.name === 'PermissionDeniedError' || videoErr.message?.includes('denied');

        if (isPermissionError) {
          setShowPermissionGuide(true);
          if (live.type === 'video') {
            setPermissionError("Acesso à câmera ou microfone negado. Tentando apenas áudio...");
          } else {
            setPermissionError("Acesso ao microfone negado.");
          }
        } else if (isNotFoundError && live.type === 'video') {
          // If camera not found, don't show error yet, just try audio
          console.log("Camera not found, falling back to audio-only mode.");
        }

        try {
          // Fallback: Try audio only
          stream = await getStream(false);
          setPermissionError(null);
          setShowPermissionGuide(false);
          
          if (isNotFoundError && live.type === 'video') {
            setPermissionError("Câmera não detectada. Iniciando em modo apenas áudio.");
            // Clear this after a few seconds
            setTimeout(() => setPermissionError(null), 5000);
          }
        } catch (audioErr: any) {
          console.error("Error accessing audio device:", audioErr);
          const isAudioPermissionError = audioErr.name === 'NotAllowedError' || audioErr.name === 'PermissionDeniedError' || audioErr.message?.includes('denied');
          const isAudioNotFoundError = audioErr.name === 'NotFoundError' || audioErr.name === 'DevicesNotFoundError';

          if (isAudioPermissionError) {
            setShowPermissionGuide(true);
            setPermissionError("O acesso ao microfone foi negado. Você precisa autorizar o acesso nas configurações do seu navegador.");
          } else if (isAudioNotFoundError) {
            setPermissionError("Nenhum microfone ou câmera foi encontrado. Verifique se estão conectados.");
          } else if (audioErr.message === 'Browser does not support media devices') {
            setPermissionError("Seu navegador não suporta acesso à câmera ou microfone.");
          } else {
            setPermissionError(`Erro de mídia: ${audioErr.message || 'Erro desconhecido'}`);
          }
          return;
        }
      }
      
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Update tracks in existing peer connections
      Object.values(peerConnections.current).forEach((pc) => {
        const peer = pc as RTCPeerConnection;
        const senders = peer.getSenders();
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) sender.replaceTrack(track);
        });
      });
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  }, [videoQuality, live.type, peerConnections]);

  useEffect(() => {
    // We no longer auto-init media to avoid immediate permission errors.
    // Users (host or participants) must click a button to start their camera/mic.
    
    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebRTC Signaling Logic
  useEffect(() => {
    if (!auth.currentUser) return;

    const signalingRef = collection(db, 'lives', initialLive.id, 'signaling');

    // Host Logic: Listen for incoming connections from participants
    if (isHost) {
      const unsubscribe = onSnapshot(signalingRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const data = change.doc.data();
          const participantId = change.doc.id;

          if (change.type === 'added' || change.type === 'modified') {
            if (data.offer && !data.answer) {
              // Handle incoming offer from participant
              const pc = createPeerConnection(participantId);
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await updateDoc(doc(signalingRef, participantId), { answer });
            }
            
            if (data.iceCandidate && data.from === 'participant') {
              const pc = peerConnections.current[participantId];
              if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
            }
          }
        });
      });
      return () => unsubscribe();
    } else {
      // Participant Logic: Create offer to host
      const initParticipantPC = async () => {
        const pc = createPeerConnection('host');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        await setDoc(doc(signalingRef, auth.currentUser!.uid), {
          offer,
          from: 'participant',
          timestamp: serverTimestamp()
        });

        const unsubscribe = onSnapshot(doc(signalingRef, auth.currentUser!.uid), async (docSnap) => {
          const data = docSnap.data();
          if (data?.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
          if (data?.iceCandidate && data.from === 'host') {
            await pc.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
          }
        });
        return unsubscribe;
      };

      const unsubPromise = initParticipantPC();
      return () => { unsubPromise.then(unsub => unsub()); };
    }
  }, [isHost, localStream]);

  const createPeerConnection = (id: string) => {
    const pc = new RTCPeerConnection(iceConfig);
    peerConnections.current[id] = pc;

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = async (event) => {
      if (event.candidate && auth.currentUser) {
        const signalingRef = collection(db, 'lives', initialLive.id, 'signaling');
        const docId = isHost ? id : auth.currentUser.uid;
        await updateDoc(doc(signalingRef, docId), {
          iceCandidate: event.candidate.toJSON(),
          from: isHost ? 'host' : 'participant'
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [id]: event.streams[0]
      }));
    };

    return pc;
  };

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

  const sendGift = async (amountArg: any = 100) => {
    if (!auth.currentUser) return;
    
    // Ensure amount is a number and not a React event
    const amount = typeof amountArg === 'number' ? amountArg : 100;
    
    try {
      const senderRef = doc(db, 'users', auth.currentUser.uid);
      const senderSnap = await getDoc(senderRef);
      
      if (!senderSnap.exists()) return;
      const senderData = senderSnap.data() as UserProfile;
      
      if ((senderData.coins || 0) < amount) {
        alert("Moedas insuficientes!");
        return;
      }

      setShowCoinRain(true);
      setTimeout(() => setShowCoinRain(false), 3000);
      
      // Deduct from sender
      await updateDoc(senderRef, {
        coins: increment(-amount)
      });

      // Add 70% to host
      const hostRef = doc(db, 'users', live.creatorId);
      const hostAmount = Math.floor(amount * 0.7);
      await updateDoc(hostRef, {
        coins: increment(hostAmount)
      });

      // Log message
      const messagesRef = collection(db, 'lives', initialLive.id, 'messages');
      await addDoc(messagesRef, {
        uid: auth.currentUser.uid,
        username: auth.currentUser.displayName || 'Usuário',
        text: `enviou ${amount} moedas! ◈`,
        type: 'gift',
        giftValue: amount,
        createdAt: serverTimestamp()
      });

      // Update live coin count
      const liveRef = doc(db, 'lives', initialLive.id);
      await updateDoc(liveRef, {
        coinCount: increment(amount)
      });

    } catch (error) {
      console.error("Error sending gift:", error);
      alert("Erro ao enviar presente.");
    }
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
    if (!isHost && !isModerator) return;
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
      text: `Um usuário foi bloqueado da transmissão por um ${isHost ? 'host' : 'moderador'}.`,
      type: 'system',
      createdAt: serverTimestamp()
    });
  };

  const toggleModerator = async (uid: string) => {
    if (!isHost) return;
    const liveRef = doc(db, 'lives', initialLive.id);
    const isCurrentlyMod = live.moderatorUids?.includes(uid);
    
    await updateDoc(liveRef, {
      moderatorUids: isCurrentlyMod ? arrayRemove(uid) : arrayUnion(uid)
    });

    const messagesRef = collection(db, 'lives', initialLive.id, 'messages');
    await addDoc(messagesRef, {
      uid: 'system',
      username: 'Sistema',
      text: `${isCurrentlyMod ? 'Removido' : 'Adicionado'} cargo de moderador para um usuário.`,
      type: 'system',
      createdAt: serverTimestamp()
    });
  };

  const deleteMessage = async (messageId: string) => {
    if (!isHost && !isModerator) return;
    const messageRef = doc(db, 'lives', initialLive.id, 'messages', messageId);
    await deleteDoc(messageRef);
  };

  const copyLiveLink = () => {
    const link = `https://vortex.app/live/${live.id}`;
    navigator.clipboard.writeText(link);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
    setShowShareMenu(false);
  };

  const sendLike = async () => {
    addReaction('❤️');
    const liveRef = doc(db, 'lives', initialLive.id);
    await updateDoc(liveRef, {
      likesCount: (live.likesCount || 0) + 1
    });
  };

  const shareOnSocial = async (platform: string) => {
    const shareUrl = `https://vortex.app/live/${live.id}`;
    const shareText = `Assista à live de ${live.creatorName} no VORTEX! ◈`;

    // Try Web Share API first if it's a general share or supported
    if (platform === 'Share' && navigator.share) {
      try {
        await navigator.share({
          title: 'VORTEX Live',
          text: shareText,
          url: shareUrl,
        });
        setShowShareMenu(false);
        return;
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }

    let url = '';
    switch (platform) {
      case 'WhatsApp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'Instagram':
        // Instagram doesn't have a direct web share URL, so we'll copy the link and notify
        copyLiveLink();
        return;
    }

    if (url) {
      window.open(url, '_blank');
      setShowShareMenu(false);
    }
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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold leading-tight truncate max-w-[80px]">{live.creatorName}</span>
                <span className="text-[8px] font-mono bg-vortex-accent/20 text-vortex-accent px-1 rounded border border-vortex-accent/30">{duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={8} fill="#EC4899" className="text-vortex-secondary" />
                <span className="text-[8px] font-bold text-white/60">{live.likesCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Users size={14} className="text-vortex-accent" />
            <span className="text-[10px] font-bold">{live.viewerCount || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Coins size={12} className="text-vortex-gold" />
            <span className="text-[10px] font-bold">{live.coinCount || 0}</span>
          </div>
          <button onClick={onClose} className="p-2 glass rounded-full text-white/80 hover:text-white transition-colors">
            <Power size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="relative z-10 flex flex-col min-h-0 flex-1 mt-2">
        {hasPaid === false && !isHost && (
          <div className="absolute inset-0 z-[150] bg-vortex-bg/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xs space-y-6"
            >
              <div className="w-20 h-20 bg-vortex-gold/20 rounded-full flex items-center justify-center mx-auto text-vortex-gold border border-vortex-gold/30">
                <Lock size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Transmissão Privada</h2>
                <p className="text-sm text-white/60 mt-2">Esta live exige uma taxa de entrada para visualização.</p>
              </div>
              
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Taxa de Entrada</p>
                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-vortex-gold">
                  <Coins size={28} />
                  {globalSettings?.liveEntryFee || 0}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="w-full py-4 bg-vortex-accent text-white rounded-2xl font-bold shadow-lg shadow-vortex-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPaying ? <Loader2 className="animate-spin" size={20} /> : <Unlock size={20} />}
                  {isPaying ? 'Processando...' : 'Pagar e Entrar'}
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-4 text-sm font-bold text-white/40 hover:text-white transition-colors"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {permissionError && (isHost || live.participants?.some(p => p.uid === auth.currentUser?.uid)) && (
          <div className="absolute inset-x-4 top-0 z-50 glass bg-red-500/10 border-red-500/20 p-4 rounded-2xl flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="text-red-400" size={24} />
            <p className="text-xs font-bold text-red-400">{permissionError}</p>
            {showPermissionGuide ? (
              <div className="bg-black/60 p-4 rounded-xl border border-white/10 space-y-3 max-w-xs">
                <div className="text-left space-y-2">
                  <p className="text-[10px] text-white/80 leading-relaxed">
                    <span className="text-vortex-accent font-bold block mb-1 underline">Como resolver:</span>
                    1. Clique no ícone de <span className="text-vortex-accent font-bold">Cadeado 🔒</span> na barra de endereços.<br/>
                    2. Ative <span className="text-white font-bold">Câmera</span> e <span className="text-white font-bold">Microfone</span>.<br/>
                    3. Se não funcionar, clique em <span className="text-white font-bold">"Configurações do site"</span> e limpe as permissões.
                  </p>
                  <p className="text-[9px] text-white/40 italic">
                    Dica: Tente abrir o app em uma <span className="text-vortex-secondary">nova aba</span> se o erro persistir.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex-1 py-2 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
                  >
                    Recarregar
                  </button>
                  <button 
                    onClick={initMedia}
                    className="flex-1 py-2 bg-vortex-accent text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-vortex-accent/80 transition-colors shadow-lg shadow-vortex-accent/20"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={initMedia}
                  className="px-6 py-2 bg-vortex-accent text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-vortex-accent/20"
                >
                  Tentar Novamente
                </button>
                <p className="text-[9px] text-white/40">Certifique-se de que nenhum outro app está usando sua câmera/mic.</p>
              </div>
            )}
          </div>
        )}
        <div className="flex px-2 gap-1 h-[320px] shrink-0">
          {/* Left Side - Host */}
          <div className={cn(
            "h-full rounded-2xl overflow-hidden relative border border-white/10 bg-vortex-surface transition-all duration-500",
            activeSlotCount > 0 ? "w-[60%] rounded-r-none" : "w-full"
          )}>
            {live.type === 'video' ? (
              <div className="w-full h-full relative">
                {isHost && localStream ? (
                  <VideoStream stream={localStream} muted filter={videoFilter} className="w-full h-full object-cover" />
                ) : isHost && !localStream && !permissionError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-vortex-surface p-6 text-center">
                    <Camera size={48} className="text-vortex-accent mb-4 animate-pulse" />
                    <h4 className="text-sm font-bold mb-2">Pronto para começar?</h4>
                    <p className="text-[10px] text-white/60 mb-6">Ative sua câmera e microfone para iniciar a transmissão.</p>
                    <button 
                      onClick={initMedia}
                      className="px-8 py-3 bg-vortex-accent text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                    >
                      Ativar Câmera
                    </button>
                  </div>
                ) : remoteStreams['host'] ? (
                  <VideoStream stream={remoteStreams['host']} className="w-full h-full object-cover" />
                ) : (
                  <img 
                    src="https://picsum.photos/seed/host_video/600/800" 
                    alt="host video" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
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
                        remoteStreams[slot.participant.uid] ? (
                          <VideoStream stream={remoteStreams[slot.participant.uid]} className="w-full h-full object-cover" />
                        ) : slot.participant.uid === auth.currentUser?.uid && localStream ? (
                          <VideoStream stream={localStream} muted filter={videoFilter} className="w-full h-full object-cover" />
                        ) : slot.participant.uid === auth.currentUser?.uid && !localStream ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-vortex-surface p-2 text-center">
                            <button 
                              onClick={initMedia}
                              className="p-2 bg-vortex-accent text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                            >
                              <Video size={16} />
                            </button>
                            <span className="text-[8px] font-bold mt-1 uppercase tracking-widest">Entrar</span>
                          </div>
                        ) : (
                          <img src={slot.participant.photoURL} alt={slot.participant.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-vortex-surface p-1">
                          <img src={slot.participant.photoURL} alt={slot.participant.username} className="w-8 h-8 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                          {slot.participant.uid === auth.currentUser?.uid && !localStream && (
                            <button 
                              onClick={initMedia}
                              className="mt-1 p-1 bg-vortex-secondary text-white rounded-full hover:scale-110 transition-transform"
                            >
                              <Mic size={10} />
                            </button>
                          )}
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
                className="group flex items-start gap-2 relative"
              >
                <button 
                  onClick={() => {
                    if ((isHost || isModerator) && msg.uid !== 'system' && msg.uid !== auth.currentUser?.uid) {
                      setSelectedUserUid(msg.uid);
                    }
                  }}
                  className={cn(
                    "w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5",
                    (isHost || isModerator) && msg.uid !== 'system' && msg.uid !== auth.currentUser?.uid && "cursor-pointer ring-1 ring-vortex-accent/30"
                  )}
                >
                  <img src={`https://picsum.photos/seed/${msg.uid}/40/40`} alt="user" referrerPolicy="no-referrer" />
                </button>
                <div className={cn(
                  "text-[10px] leading-tight px-2 py-1 rounded-lg flex flex-col",
                  msg.type === 'system' ? "text-vortex-accent font-bold" : 
                  msg.type === 'gift' ? "bg-vortex-gold/20 text-vortex-gold border border-vortex-gold/30" :
                  "bg-black/60 text-white"
                )}>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white/60">{msg.username}</span>
                    {live.moderatorUids?.includes(msg.uid) && (
                      <Shield size={8} className="text-vortex-highlight" />
                    )}
                    {live.creatorId === msg.uid && (
                      <Star size={8} className="text-vortex-gold" fill="currentColor" />
                    )}
                  </div>
                  {msg.text}
                </div>
                {(isHost || isModerator) && msg.type !== 'system' && (
                  <button 
                    onClick={() => deleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all ml-1"
                    title="Excluir mensagem"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Footer Interaction Bar */}
      <div className="relative z-20 px-4 pb-6 flex flex-col items-center gap-3 shrink-0">
        <div className="w-full glass rounded-full px-4 py-2 flex items-center gap-3">
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

        <div className="flex items-center justify-center gap-3">
          <button 
            onClick={sendLike}
            className="p-2.5 bg-vortex-secondary rounded-full text-white shadow-lg shadow-vortex-secondary/20 active:scale-125 transition-transform"
          >
            <Heart size={18} fill="currentColor" />
          </button>
          <button 
            onClick={() => sendGift(100)}
            className="p-2.5 bg-vortex-gold rounded-full text-white shadow-lg"
          >
            <Coins size={18} />
          </button>
          <button 
            onClick={() => setShowShareMenu(true)}
            className="p-2.5 glass rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <Share2 size={18} />
          </button>
          {isHost || live.participants?.some(p => p.uid === auth.currentUser?.uid) ? (
            <button 
              onClick={() => setShowEffectsMenu(true)}
              className="p-2.5 bg-vortex-accent rounded-full text-white shadow-lg shadow-vortex-accent/20"
            >
              <Zap size={18} />
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
                const isUserMod = live.moderatorUids?.includes(userUid || '');

                return (
                  <>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-4 border-vortex-accent p-1 relative">
                        <img 
                          src={photoURL} 
                          alt="user" 
                          className="w-full h-full rounded-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                        {isUserMod && (
                          <div className="absolute -top-1 -right-1 bg-vortex-highlight p-1.5 rounded-full border-2 border-vortex-surface shadow-lg">
                            <Shield size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="font-display font-bold text-lg">@{username}</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                          {isUserMod ? 'Moderador da Live' : 'Gerenciar Usuário'}
                        </p>
                      </div>
                    </div>

                    <div className="w-full grid grid-cols-1 gap-2">
                      {isHost && userUid !== auth.currentUser?.uid && (
                        <button 
                          onClick={() => {
                            if (userUid) toggleModerator(userUid);
                            setSelectedParticipantIndex(null);
                            setSelectedUserUid(null);
                          }}
                          className={cn(
                            "w-full py-3 px-4 rounded-2xl flex items-center gap-3 transition-all border",
                            isUserMod 
                              ? "bg-vortex-highlight/10 border-vortex-highlight/20 text-vortex-highlight" 
                              : "bg-white/5 border-white/5 text-white/80 hover:bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            isUserMod ? "bg-vortex-highlight/20" : "bg-white/10"
                          )}>
                            <Shield size={18} />
                          </div>
                          <span className="text-sm font-bold">
                            {isUserMod ? 'Remover Moderador' : 'Tornar Moderador'}
                          </span>
                        </button>
                      )}

                      {participant && (isHost || isModerator) && (
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

                      {(participant || selectedUserUid) && (isHost || isModerator) && userUid !== live.creatorId && (
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

                      {(isHost || isModerator) && userUid !== live.creatorId && (
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
                      )}
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

      {/* Share Menu */}
      <AnimatePresence>
        {showShareMenu && (
          <div className="absolute inset-0 z-[140] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-sm glass rounded-t-3xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Compartilhar Live</h3>
                <button onClick={() => setShowShareMenu(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: 'WhatsApp', icon: '📱', color: 'bg-green-500' },
                  { name: 'Instagram', icon: '📸', color: 'bg-pink-500' },
                  { name: 'Twitter', icon: '🐦', color: 'bg-blue-400' },
                  { name: 'Facebook', icon: '👥', color: 'bg-blue-600' },
                ].map((platform) => (
                  <button 
                    key={platform.name}
                    onClick={() => shareOnSocial(platform.name)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg", platform.color)}>
                      {platform.icon}
                    </div>
                    <span className="text-[10px] font-bold text-white/60">{platform.name}</span>
                  </button>
                ))}
              </div>

              {/* Share with Friends Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Amigos na Plataforma</h4>
                  <span className="text-[10px] text-vortex-accent font-mono">{friends.length} online</span>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {friends.length === 0 ? (
                    <div className="w-full py-4 text-center text-[10px] text-white/20 italic">
                      Nenhum amigo encontrado...
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <button 
                        key={friend.uid}
                        onClick={() => shareWithFriend(friend)}
                        className="flex flex-col items-center gap-2 shrink-0 group"
                      >
                        <div className="relative">
                          <img 
                            src={friend.photoURL} 
                            alt={friend.displayName} 
                            className={cn(
                              "w-12 h-12 rounded-full object-cover border-2 transition-all",
                              sharedWith.includes(friend.uid) ? "border-green-500 opacity-50" : "border-white/10 group-hover:border-vortex-accent"
                            )}
                            referrerPolicy="no-referrer"
                          />
                          {sharedWith.includes(friend.uid) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                              <Check size={20} className="text-green-500" />
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-white/60 truncate w-12 text-center">
                          {friend.displayName.split(' ')[0]}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={copyLiveLink}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/5"
                >
                  <Share2 size={18} className="text-vortex-accent" />
                  <span className="text-sm font-bold">Copiar Link da Live</span>
                </button>
              </div>

              <button 
                onClick={() => setShowShareMenu(false)}
                className="w-full py-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[150] bg-vortex-accent px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Check size={16} className="text-white" />
            <span className="text-xs font-bold text-white">Link copiado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effects & Quality Menu */}
      <AnimatePresence>
        {showEffectsMenu && (
          <div className="absolute inset-0 z-[160] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEffectsMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-sm glass rounded-t-3xl p-6 space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Zap size={20} className="text-vortex-accent" />
                  Efeitos & Qualidade
                </h3>
                <button onClick={() => setShowEffectsMenu(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Quality Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Qualidade do Vídeo</p>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setVideoQuality(q)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all border",
                        videoQuality === q 
                          ? "bg-vortex-accent border-vortex-accent text-white" 
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {q === 'low' ? '360p' : q === 'medium' ? '720p' : '1080p'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Filtros de Câmera</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'none', name: 'Normal' },
                    { id: 'beauty', name: 'Beauty' },
                    { id: 'warm', name: 'Quente' },
                    { id: 'cool', name: 'Frio' },
                    { id: 'sepia', name: 'Sépia' },
                    { id: 'grayscale', name: 'P&B' },
                    { id: 'vintage', name: 'Vintage' },
                    { id: 'neon', name: 'Neon' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setVideoFilter(f.id)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl border-2 transition-all overflow-hidden",
                        videoFilter === f.id ? "border-vortex-accent scale-110" : "border-white/10 group-hover:border-white/30"
                      )}>
                        <div className="w-full h-full bg-gradient-to-br from-vortex-surface to-black flex items-center justify-center text-[10px] font-bold">
                          {f.name[0]}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold transition-colors",
                        videoFilter === f.id ? "text-vortex-accent" : "text-white/40"
                      )}>
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowEffectsMenu(false)}
                className="w-full py-4 bg-vortex-accent rounded-2xl font-bold text-sm shadow-lg shadow-vortex-accent/20"
              >
                Aplicar Efeitos
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emoji Reactions Animation */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-40 z-[110] pointer-events-none">
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
