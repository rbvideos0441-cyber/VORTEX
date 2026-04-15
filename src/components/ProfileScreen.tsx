import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Edit2, Grid, Heart, Repeat, Radio, Link as LinkIcon, MapPin, Star, Coins, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { logOut } from '../firebase';

interface ProfileScreenProps {
  profile: UserProfile;
  onEdit: () => void;
  onOpenShop?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onEdit, onOpenShop }) => {
  const [activeTab, setActiveTab] = useState('videos');
  const [showSettings, setShowSettings] = useState(false);

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
    </div>
  );
};
