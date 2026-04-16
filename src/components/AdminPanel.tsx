import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Video as VideoIcon, Radio, Shield, Search, Trash2, 
  CheckCircle, XCircle, AlertTriangle, BarChart3,
  TrendingUp, MessageSquare, Flag, Settings, Coins, Plus, Save, Loader2
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, getDocs, deleteDoc, doc, 
  updateDoc, query, orderBy, limit, where, setDoc
} from 'firebase/firestore';
import { UserProfile, Video, LiveStream, CoinPackage, HostRequest, OperationType } from '../types';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
};

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'videos' | 'lives' | 'reports' | 'shop' | 'settings' | 'host_requests'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [hostRequests, setHostRequests] = useState<HostRequest[]>([]);
  const [globalSettings, setGlobalSettings] = useState<{
    liveEntryFee: number;
    requireEntryFee: boolean;
  }>({ liveEntryFee: 0, requireEntryFee: false });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users' || activeTab === 'overview') {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsers(usersSnap.docs.map(d => d.data() as UserProfile));
      }
      if (activeTab === 'videos' || activeTab === 'overview') {
        const videosSnap = await getDocs(collection(db, 'videos'));
        setVideos(videosSnap.docs.map(d => d.data() as Video));
      }
      if (activeTab === 'lives' || activeTab === 'overview') {
        const livesSnap = await getDocs(collection(db, 'lives'));
        setLives(livesSnap.docs.map(d => d.data() as LiveStream));
      }
      if (activeTab === 'shop') {
        const packagesSnap = await getDocs(collection(db, 'coin_packages'));
        if (packagesSnap.empty) {
          // Default packages if none exist
          const defaults: CoinPackage[] = [
            { id: '1', coins: 100, price: 'R$ 4,90', bonus: 0, popular: false },
            { id: '2', coins: 500, price: 'R$ 19,90', bonus: 50, popular: true },
            { id: '3', coins: 1200, price: 'R$ 44,90', bonus: 150, popular: false },
          ];
          setCoinPackages(defaults);
        } else {
          setCoinPackages(packagesSnap.docs.map(d => d.data() as CoinPackage));
        }
      }
      if (activeTab === 'settings' || activeTab === 'overview') {
        const settingsSnap = await getDocs(collection(db, 'app_settings'));
        if (!settingsSnap.empty) {
          const data = settingsSnap.docs[0].data();
          setGlobalSettings({
            liveEntryFee: data.liveEntryFee || 0,
            requireEntryFee: data.requireEntryFee || false
          });
        }
      }
      if (activeTab === 'host_requests' || activeTab === 'overview') {
        const requestsSnap = await getDocs(query(collection(db, 'host_requests'), orderBy('createdAt', 'desc')));
        setHostRequests(requestsSnap.docs.map(d => ({ id: d.id, ...d.data() } as HostRequest)));
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  const saveCoinPackage = async (pkg: CoinPackage) => {
    setSavingId(pkg.id);
    try {
      await setDoc(doc(db, 'coin_packages', pkg.id), pkg);
      setFeedback({ type: 'success', message: 'Pacote salvo com sucesso!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `coin_packages/${pkg.id}`);
      setFeedback({ type: 'error', message: 'Erro ao salvar pacote. Verifique permissões.' });
    } finally {
      setSavingId(null);
    }
  };

  const addCoinPackage = () => {
    const newPkg: CoinPackage = {
      id: Date.now().toString(),
      coins: 1000,
      price: 'R$ 0,00',
      bonus: 0,
      popular: false
    };
    setCoinPackages([...coinPackages, newPkg]);
  };

  const removeCoinPackage = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Pacote',
      message: 'Tem certeza que deseja excluir este pacote de moedas?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'coin_packages', id));
          setCoinPackages(coinPackages.filter(p => p.id !== id));
          setFeedback({ type: 'success', message: 'Pacote removido!' });
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `coin_packages/${id}`);
          setFeedback({ type: 'error', message: 'Erro ao remover pacote.' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteUser = async (uid: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Usuário',
      message: 'Tem certeza que deseja excluir este usuário? Esta ação é irreversível.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', uid));
          setUsers(users.filter(u => u.uid !== uid));
          setFeedback({ type: 'success', message: 'Usuário excluído!' });
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
          setFeedback({ type: 'error', message: 'Erro ao excluir usuário.' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteVideo = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Vídeo',
      message: 'Tem certeza que deseja excluir este vídeo?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'videos', id));
          setVideos(videos.filter(v => v.id !== id));
          setFeedback({ type: 'success', message: 'Vídeo excluído!' });
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `videos/${id}`);
          setFeedback({ type: 'error', message: 'Erro ao excluir vídeo.' });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const saveGlobalSettings = async () => {
    setSavingId('global_settings');
    try {
      await setDoc(doc(db, 'app_settings', 'general'), globalSettings);
      setFeedback({ type: 'success', message: 'Configurações salvas!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'app_settings/general');
      setFeedback({ type: 'error', message: 'Erro ao salvar configurações.' });
    } finally {
      setSavingId(null);
    }
  };

  const handleHostRequest = async (request: HostRequest, status: 'approved' | 'rejected') => {
    setSavingId(request.id);
    try {
      // Update request status
      await updateDoc(doc(db, 'host_requests', request.id), { status });
      
      // If approved, update user profile
      if (status === 'approved') {
        await updateDoc(doc(db, 'users', request.uid), { isHost: true });
      }

      setHostRequests(hostRequests.map(r => r.id === request.id ? { ...r, status } : r));
      setFeedback({ type: 'success', message: `Solicitação ${status === 'approved' ? 'aprovada' : 'recusada'}!` });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `host_requests/${request.id}`);
      setFeedback({ type: 'error', message: 'Erro ao processar solicitação.' });
    } finally {
      setSavingId(null);
    }
  };

  const toggleVerification = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerified: !currentStatus });
      setUsers(users.map(u => u.uid === uid ? { ...u, isVerified: !currentStatus } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      setFeedback({ type: 'error', message: 'Erro ao alternar verificação.' });
    }
  };

  return (
    <div className="absolute inset-0 bg-vortex-bg text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-vortex-surface/50 backdrop-blur-xl gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-vortex-accent rounded-xl">
              <Shield size={24} />
            </div>
            <h1 className="text-lg md:text-xl font-display font-bold">Painel de Controle</h1>
          </div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest text-center md:text-left">Administração VORTEX</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-center">
          <div className="relative w-full max-w-md md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:border-vortex-accent transition-all w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-2 md:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar shrink-0 justify-center md:justify-start">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'videos', label: 'Vídeos', icon: VideoIcon },
            { id: 'lives', label: 'Transmissões', icon: Radio },
            { id: 'host_requests', label: 'Solicitações Host', icon: Shield },
            { id: 'shop', label: 'Loja de Moedas', icon: Coins },
            { id: 'settings', label: 'Configurações', icon: Settings },
            { id: 'reports', label: 'Denúncias', icon: Flag },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-vortex-accent text-white shadow-lg shadow-vortex-accent/20" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
          
          <div className="hidden md:block mt-auto pt-4 border-t border-white/5">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white w-full">
              <Settings size={18} />
              Configurações
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-6 md:space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: 'Total Usuários', value: users.length || 0, icon: Users, color: 'text-blue-400' },
                    { label: 'Vídeos Postados', value: videos.length || 0, icon: VideoIcon, color: 'text-vortex-accent' },
                    { label: 'Lives Ativas', value: lives.filter(l => l.isLive).length || 0, icon: Radio, color: 'text-vortex-secondary' },
                    { label: 'Novas Denúncias', value: 0, icon: Flag, color: 'text-red-400' },
                  ].map((stat, i) => (
                    <div key={i} className="glass p-4 md:p-6 rounded-[20px] md:rounded-[24px] border border-white/5">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                          <stat.icon size={18} md:size={20} />
                        </div>
                        <TrendingUp size={14} md:size={16} className="text-green-400" />
                      </div>
                      <p className="text-xl md:text-2xl font-mono font-bold">{stat.value}</p>
                      <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="glass p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-white/5">
                    <h3 className="font-display font-bold mb-4 md:mb-6 flex items-center gap-2">
                      <Users size={18} className="text-vortex-accent" />
                      Usuários Recentes
                    </h3>
                    <div className="space-y-3 md:space-y-4">
                      {users.slice(0, 5).map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-2 md:p-3 bg-white/5 rounded-xl md:rounded-2xl">
                          <div className="flex items-center gap-2 md:gap-3">
                            <img src={user.photoURL} className="w-7 h-7 md:w-8 md:h-8 rounded-full" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-[11px] md:text-xs font-bold">{user.displayName}</p>
                              <p className="text-[9px] md:text-[10px] text-white/40">@{user.username}</p>
                            </div>
                          </div>
                          <button className="text-[9px] md:text-[10px] text-vortex-accent font-bold uppercase">Ver</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-white/5">
                    <h3 className="font-display font-bold mb-4 md:mb-6 flex items-center gap-2">
                      <MessageSquare size={18} className="text-vortex-secondary" />
                      Atividade da Plataforma
                    </h3>
                    <div className="flex flex-col items-center justify-center h-40 md:h-48 text-white/20">
                      <BarChart3 size={40} md:size={48} />
                      <p className="text-[10px] md:text-xs mt-4">Gráfico em tempo real</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'host_requests' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-display font-bold">Solicitações de Host</h3>
                    <p className="text-xs text-white/40">Analise os pedidos de usuários para se tornarem hosts oficiais.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {hostRequests.length === 0 ? (
                    <div className="glass p-12 rounded-[32px] border border-white/5 flex flex-col items-center justify-center text-white/20">
                      <Shield size={48} />
                      <p className="text-sm mt-4 font-bold uppercase tracking-widest">Nenhuma solicitação pendente</p>
                    </div>
                  ) : (
                    hostRequests.map(request => (
                      <div key={request.id} className="glass p-6 rounded-[32px] border border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img src={request.photoURL} className="w-12 h-12 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                            <div>
                              <h4 className="font-bold">{request.displayName}</h4>
                              <p className="text-xs text-white/40">@{request.username}</p>
                            </div>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            request.status === 'pending' ? "bg-yellow-500/20 text-yellow-500" :
                            request.status === 'approved' ? "bg-green-500/20 text-green-500" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {request.status === 'pending' ? 'Pendente' :
                             request.status === 'approved' ? 'Aprovado' : 'Recusado'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Motivo</p>
                            <p className="text-sm text-white/80 bg-white/5 p-4 rounded-2xl border border-white/5">{request.reason}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Experiência</p>
                            <p className="text-sm text-white/80 bg-white/5 p-4 rounded-2xl border border-white/5">{request.experience}</p>
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex items-center gap-3 pt-2">
                            <button 
                              onClick={() => handleHostRequest(request, 'approved')}
                              disabled={savingId === request.id}
                              className="flex-1 py-3 bg-green-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {savingId === request.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                              Aprovar
                            </button>
                            <button 
                              onClick={() => handleHostRequest(request, 'rejected')}
                              disabled={savingId === request.id}
                              className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {savingId === request.id ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                              Recusar
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="glass rounded-[24px] md:rounded-[32px] border border-white/5 overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Usuário</th>
                      <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Status</th>
                      <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Moedas</th>
                      <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.uid} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={user.photoURL} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-sm font-bold flex items-center gap-1">
                                {user.displayName}
                                {user.isVerified && <CheckCircle size={12} className="text-vortex-highlight" />}
                              </p>
                              <p className="text-xs text-white/40">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[8px] font-bold uppercase",
                            user.isPremium ? "bg-vortex-gold/20 text-vortex-gold" : "bg-white/10 text-white/60"
                          )}>
                            {user.isPremium ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-sm">{user.coins || 0}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleVerification(user.uid, user.isVerified)}
                              className="p-2 hover:bg-vortex-highlight/20 rounded-lg text-vortex-highlight transition-all"
                              title="Alternar Verificação"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => deleteUser(user.uid)}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                              title="Excluir Usuário"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {videos.map(video => (
                  <div key={video.id} className="glass rounded-xl md:rounded-2xl overflow-hidden border border-white/5 group relative">
                    <img src={video.thumbnailUrl} className="w-full aspect-[3/4] object-cover opacity-60 group-hover:opacity-100 transition-all" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent p-3 md:p-4 flex flex-col justify-end">
                      <p className="text-[10px] md:text-xs font-bold line-clamp-1">{video.description}</p>
                      <p className="text-[8px] md:text-[10px] text-white/60">@{video.creatorName}</p>
                      <div className="flex items-center justify-between mt-2 md:mt-3">
                        <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-white/40">
                          <span>❤️ {video.likesCount || 0}</span>
                          <span>💬 {video.commentsCount || 0}</span>
                        </div>
                        <button 
                          onClick={() => deleteVideo(video.id)}
                          className="p-1.5 md:p-2 bg-red-500/20 text-red-400 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={12} md:size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="flex flex-col items-center justify-center h-64 text-white/20">
                <AlertTriangle size={48} />
                <p className="text-sm mt-4 font-bold uppercase tracking-widest">Nenhuma denúncia pendente</p>
                <p className="text-xs mt-1">A plataforma está limpa! ✨</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div className="glass p-8 rounded-[32px] border border-white/10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-vortex-accent/20 rounded-2xl text-vortex-accent">
                      <Radio size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold">Transmissões ao Vivo</h3>
                      <p className="text-sm text-white/40">Configure as regras de entrada para lives.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold">Cobrar Entrada</p>
                        <p className="text-xs text-white/40">Exigir moedas para entrar em qualquer live.</p>
                      </div>
                      <button 
                        onClick={() => setGlobalSettings(prev => ({ ...prev, requireEntryFee: !prev.requireEntryFee }))}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          globalSettings.requireEntryFee ? "bg-vortex-accent" : "bg-white/10"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          globalSettings.requireEntryFee ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>

                    {globalSettings.requireEntryFee && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Valor da Entrada (Moedas)</label>
                        <div className="relative">
                          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-vortex-gold" size={18} />
                          <input 
                            type="number"
                            value={globalSettings.liveEntryFee}
                            onChange={(e) => setGlobalSettings(prev => ({ ...prev, liveEntryFee: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg font-bold outline-none focus:border-vortex-accent"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button 
                    onClick={saveGlobalSettings}
                    disabled={savingId === 'global_settings'}
                    className="w-full py-4 bg-vortex-accent text-white rounded-2xl font-bold shadow-lg shadow-vortex-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingId === 'global_settings' ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {savingId === 'global_settings' ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'shop' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-display font-bold">Configuração da Loja</h3>
                    <p className="text-xs text-white/40">Gerencie os pacotes de moedas disponíveis para os usuários.</p>
                  </div>
                  <button 
                    onClick={addCoinPackage}
                    className="px-4 py-2 bg-vortex-accent text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-vortex-accent/20"
                  >
                    <Plus size={16} />
                    Novo Pacote
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coinPackages.map((pkg, index) => (
                    <div key={pkg.id} className="glass p-6 rounded-[24px] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-vortex-gold/20 rounded-lg">
                            <Coins className="text-vortex-gold" size={20} />
                          </div>
                          <span className="text-sm font-bold">Pacote #{index + 1}</span>
                        </div>
                        <button 
                          onClick={() => removeCoinPackage(pkg.id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Moedas</label>
                          <input 
                            type="number"
                            value={pkg.coins || 0}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              const newPkgs = [...coinPackages];
                              newPkgs[index].coins = isNaN(val) ? 0 : val;
                              setCoinPackages(newPkgs);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-vortex-accent"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Bônus</label>
                          <input 
                            type="number"
                            value={pkg.bonus || 0}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              const newPkgs = [...coinPackages];
                              newPkgs[index].bonus = isNaN(val) ? 0 : val;
                              setCoinPackages(newPkgs);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-vortex-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Preço (Texto)</label>
                          <input 
                            type="text"
                            value={pkg.price}
                            onChange={(e) => {
                              const newPkgs = [...coinPackages];
                              newPkgs[index].price = e.target.value;
                              setCoinPackages(newPkgs);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-vortex-accent"
                          />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={pkg.popular}
                              onChange={(e) => {
                                const newPkgs = [...coinPackages];
                                newPkgs[index].popular = e.target.checked;
                                setCoinPackages(newPkgs);
                              }}
                              className="hidden"
                            />
                            <div className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-all",
                              pkg.popular ? "bg-vortex-accent border-vortex-accent" : "border-white/20"
                            )}>
                              {pkg.popular && <CheckCircle size={12} />}
                            </div>
                            <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">Destaque Popular</span>
                          </label>
                        </div>
                      </div>

                      <button 
                        onClick={() => saveCoinPackage(pkg)}
                        disabled={savingId === pkg.id}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {savingId === pkg.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}
                        {savingId === pkg.id ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 border backdrop-blur-xl",
              feedback.type === 'success' ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"
            )}
          >
            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span className="text-sm font-bold">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-vortex-surface border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-red-500/20 rounded-full text-red-500">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">{confirmModal.title}</h3>
                  <p className="text-sm text-white/60 mt-2">{confirmModal.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmModal.onConfirm}
                    className="py-3 rounded-xl bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
