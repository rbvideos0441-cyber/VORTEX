import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Edit2, Grid, Heart, Repeat, Radio, Link as LinkIcon, MapPin, Star, Coins, LogOut, Shield, CheckCircle, Clock, AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, HostRequest } from '../types';
import { logOut, db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';

interface ProfileScreenProps {
  profile: UserProfile;
  onEdit: () => void;
  onOpenShop?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onEdit, onOpenShop }) => {
  const [activeTab, setActiveTab] = useState('videos');
  const [showSettings, setShowSettings] = useState(false);
  const [showHostForm, setShowHostForm] = useState(false);
  const [hostRequest, setHostRequest] = useState<HostRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ reason: '', experience: '' });

  useEffect(() => {
    checkHostRequest();
  }, [profile.uid]);

  const checkHostRequest = async () => {
    try {
      const q = query(
        collection(db, 'host_requests'),
        where('uid', '==', profile.uid),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHostRequest({ id: snap.docs[0].id, ...snap.docs[0].data() } as HostRequest);
      }
    } catch (error) {
      console.error("Error checking host request:", error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const submitHostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSubmitting(true);

    try {
      const newRequest = {
        uid: auth.currentUser.uid,
        username: profile.username,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        reason: form.reason,
        experience: form.experience,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'host_requests'), newRequest);
      await checkHostRequest();
      setShowHostForm(false);
    } catch (error) {
      console.error("Error submitting host request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'videos', icon: Grid, label: 'Vídeos' },
    { id: 'liked', icon: Heart, label: 'Curtidos' },
    { id: 'reposts', icon: Repeat, label: 'Reposts' },
    { id: 'lives', icon: Radio, label: 'Lives' },
  ];

  const handleLogout = async () => {
    console.log("Iniciando logout...");
    try {
      await logOut();
      console.log("Logout concluído com sucesso.");
      // Pequeno delay para garantir que o SDK do Firebase processe o logout antes do reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="absolute inset-0 bg-vortex-bg overflow-y-auto no-scrollbar pb-32">
      {/* Banner */}
      <div className="relative h-48 w-full bg-linear-to-br from-vortex-accent/20 to-vortex-secondary/20 overflow-hidden">
        {profile.bannerURL && (
          <img src={profile.bannerURL} alt="banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-vortex-bg via-transparent to-transparent" />
        
        <div className="absolute top-6 right-6 z-20">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 glass rounded-full text-white/80 hover:text-white transition-colors"
            title="Configurações"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 -mt-16 relative z-10">
        <div className="flex items-end justify-between mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-vortex-bg bg-vortex-surface overflow-hidden shadow-2xl relative">
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute bottom-0 left-0 right-0 bg-vortex-secondary text-[10px] font-bold text-center py-1 uppercase tracking-widest">
                LIVE
              </div>
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-2 right-2 bg-vortex-highlight p-1 rounded-full border-2 border-vortex-bg text-white">
                <Star size={12} fill="currentColor" />
              </div>
            )}
          </div>
          
          <button 
            onClick={onEdit}
            className="px-6 py-2.5 glass rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Edit2 size={16} />
            Editar Perfil
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            {profile.displayName}
            {profile.isPremium && <span className="text-[10px] bg-vortex-gold/20 text-vortex-gold px-2 py-0.5 rounded-full border border-vortex-gold/30">PREMIUM</span>}
          </h1>
          <p className="text-vortex-text-secondary font-medium">@{profile.username}</p>
        </div>

        <p className="text-sm text-vortex-text-primary/90 mb-4 leading-relaxed max-w-sm">
          {profile.bio || "Nenhuma bio definida ainda. ✨"}
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-vortex-highlight hover:underline">
              <LinkIcon size={14} />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profile.location && (
            <div className="flex items-center gap-1.5 text-xs text-vortex-text-secondary">
              <MapPin size={14} />
              {profile.location}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {!profile.isHost && !loadingRequest && (
            <div className="p-4 glass rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-vortex-accent/20 rounded-xl text-vortex-accent">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Programa de Hosts</h3>
                  <p className="text-[10px] text-white/40">Torne-se um host oficial e faça transmissões ao vivo.</p>
                </div>
              </div>

              {hostRequest ? (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold",
                  hostRequest.status === 'pending' ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                  hostRequest.status === 'approved' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                  "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  {hostRequest.status === 'pending' ? <Clock size={14} /> : 
                   hostRequest.status === 'approved' ? <CheckCircle size={14} /> : 
                   <AlertTriangle size={14} />}
                  {hostRequest.status === 'pending' ? 'Solicitação em análise...' :
                   hostRequest.status === 'approved' ? 'Você agora é um host!' :
                   'Solicitação recusada. Tente novamente mais tarde.'}
                </div>
              ) : (
                <button 
                  onClick={() => setShowHostForm(true)}
                  className="w-full py-3 bg-vortex-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-vortex-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Quero ser Host
                </button>
              )}
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-1 mt-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-vortex-surface rounded-sm overflow-hidden relative group cursor-pointer">
              <img 
                src={`https://picsum.photos/seed/vortex_profile_${i}/300/400`} 
                alt="post" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-mono text-white">
                <Radio size={10} className="text-vortex-secondary" />
                {Math.floor(Math.random() * 100)}k
              </div>
            </div>
          ))}
        </div>
      </div>

      <HostFormModal 
        isOpen={showHostForm}
        onClose={() => setShowHostForm(false)}
        onSubmit={submitHostRequest}
        form={form}
        setForm={setForm}
        submitting={submitting}
      />
    </div>
  );
};

const HostFormModal = ({ isOpen, onClose, onSubmit, form, setForm, submitting }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-vortex-surface border border-white/10 rounded-[32px] p-8 shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-white/40"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="p-4 bg-vortex-accent/20 rounded-full text-vortex-accent">
                <Shield size={32} />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Solicitação de Host</h3>
                <p className="text-sm text-white/40 mt-2">Conte-nos por que você quer ser um host no VORTEX.</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Por que ser host?</label>
                <textarea 
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Ex: Quero compartilhar meu talento musical..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-vortex-accent min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Experiência com Lives</label>
                <textarea 
                  required
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  placeholder="Ex: Já fiz lives em outras plataformas..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-vortex-accent min-h-[80px] resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-vortex-accent text-white rounded-2xl font-bold shadow-lg shadow-vortex-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {submitting ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
