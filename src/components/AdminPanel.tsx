import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Video as VideoIcon, Radio, Shield, Search, Trash2, 
  CheckCircle, XCircle, AlertTriangle, BarChart3,
  TrendingUp, MessageSquare, Flag, Settings
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, getDocs, deleteDoc, doc, 
  updateDoc, query, orderBy, limit, where 
} from 'firebase/firestore';
import { UserProfile, Video, LiveStream } from '../types';
import { cn } from '../lib/utils';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'videos' | 'lives' | 'reports'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  const deleteUser = async (uid: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    }
  };

  const deleteVideo = async (id: string) => {
    if (window.confirm('Excluir este vídeo?')) {
      await deleteDoc(doc(db, 'videos', id));
      setVideos(videos.filter(v => v.id !== id));
    }
  };

  const toggleVerification = async (uid: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isVerified: !currentStatus });
    setUsers(users.map(u => u.uid === uid ? { ...u, isVerified: !currentStatus } : u));
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
                    { label: 'Total Usuários', value: users.length, icon: Users, color: 'text-blue-400' },
                    { label: 'Vídeos Postados', value: videos.length, icon: VideoIcon, color: 'text-vortex-accent' },
                    { label: 'Lives Ativas', value: lives.filter(l => l.isLive).length, icon: Radio, color: 'text-vortex-secondary' },
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
                        <td className="p-4 font-mono text-sm">{user.coins}</td>
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
                          <span>❤️ {video.likesCount}</span>
                          <span>💬 {video.commentsCount}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};
