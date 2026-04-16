import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Camera, Check, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { saveUserProfile, isUsernameAvailable } from '../firebase';
import { cn } from '../lib/utils';

interface EditProfileScreenProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    website: profile.website || '',
    location: profile.location || '',
    pronouns: profile.pronouns || '',
    photoURL: profile.photoURL,
    bannerURL: profile.bannerURL || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          [type === 'photo' ? 'photoURL' : 'bannerURL']: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Check username if changed
    if (formData.username !== profile.username) {
      const available = await isUsernameAvailable(formData.username, profile.uid);
      if (!available) {
        setUsernameError('Nome de usuário indisponível');
        setIsSaving(false);
        return;
      }
    }

    const updatedProfile: UserProfile = {
      ...profile,
      ...formData,
      username: formData.username.toLowerCase(),
    };

    try {
      await saveUserProfile(updatedProfile);
      onSave(updatedProfile);
      setIsSaving(false);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-vortex-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button onClick={onClose} className="p-2 -ml-2 text-vortex-text-secondary hover:text-white transition-colors">
          <X size={24} />
        </button>
        <h2 className="font-display font-bold text-lg">Editar Perfil</h2>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="text-vortex-accent font-bold hover:text-vortex-accent/80 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'Salvar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        {/* Photos Section */}
        <div className="flex flex-col items-center gap-8 mb-12">
          {/* Banner Edit */}
          <input 
            type="file" 
            ref={bannerInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'banner')}
          />
          <div className="w-full h-32 bg-vortex-surface rounded-2xl relative overflow-hidden group">
            {formData.bannerURL && (
              <img src={formData.bannerURL} alt="banner" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => bannerInputRef.current?.click()}
                className="p-3 glass rounded-full text-white shadow-xl hover:scale-110 transition-transform"
              >
                <Camera size={24} />
              </button>
            </div>
          </div>

          {/* Avatar Edit */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'photo')}
          />
          <div className="relative -mt-20">
            <div className="w-32 h-32 rounded-full border-4 border-vortex-bg bg-vortex-surface overflow-hidden shadow-2xl group relative">
              <img src={formData.photoURL} alt="avatar" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 glass rounded-full text-white shadow-xl hover:scale-110 transition-transform"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-vortex-text-secondary ml-4">Nome de exibição</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full bg-vortex-surface border border-white/5 rounded-2xl py-4 px-6 focus:border-vortex-accent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-vortex-text-secondary ml-4">Nome de usuário</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-vortex-text-secondary">@</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
                  setUsernameError('');
                }}
                className={cn(
                  "w-full bg-vortex-surface border rounded-2xl py-4 pl-12 pr-6 focus:border-vortex-accent outline-none transition-all",
                  usernameError ? "border-vortex-secondary" : "border-white/5"
                )}
              />
            </div>
            {usernameError && <p className="text-vortex-secondary text-xs ml-4">{usernameError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-vortex-text-secondary ml-4">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 150) }))}
              placeholder="Conte um pouco sobre você..."
              rows={3}
              className="w-full bg-vortex-surface border border-white/5 rounded-2xl py-4 px-6 focus:border-vortex-accent outline-none transition-all resize-none"
            />
            <p className="text-[10px] text-right text-vortex-text-secondary mr-2">{formData.bio.length}/150</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-vortex-text-secondary ml-4">Pronomes</label>
              <input
                type="text"
                value={formData.pronouns}
                onChange={(e) => setFormData(prev => ({ ...prev, pronouns: e.target.value }))}
                placeholder="Ex: Ele/Dele"
                className="w-full bg-vortex-surface border border-white/5 rounded-2xl py-4 px-6 focus:border-vortex-accent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-vortex-text-secondary ml-4">Localização</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: São Paulo, Brasil"
                className="w-full bg-vortex-surface border border-white/5 rounded-2xl py-4 px-6 focus:border-vortex-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-vortex-text-secondary ml-4">Website</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://seusite.com"
              className="w-full bg-vortex-surface border border-white/5 rounded-2xl py-4 px-6 focus:border-vortex-accent outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
