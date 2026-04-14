import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, Camera, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { saveUserProfile, isUsernameAvailable } from '../firebase';

interface OnboardingFlowProps {
  user: any;
  onComplete: (profile: UserProfile) => void;
}

const CATEGORIES = [
  { id: 'comedy', label: 'Comédia', icon: '😂' },
  { id: 'dance', label: 'Dança', icon: '💃' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'food', label: 'Culinária', icon: '🍳' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'fashion', label: 'Moda', icon: '👗' },
  { id: 'music', label: 'Música', icon: '🎵' },
  { id: 'sports', label: 'Esportes', icon: '⚽' },
  { id: 'art', label: 'Arte', icon: '🎨' },
  { id: 'travel', label: 'Viagem', icon: '✈️' },
  { id: 'beauty', label: 'Beleza', icon: '💄' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNextStep = async () => {
    if (step === 1 && selectedInterests.length < 5) return;
    
    if (step === 3) {
      setIsCheckingUsername(true);
      const available = await isUsernameAvailable(username);
      setIsCheckingUsername(false);
      
      if (!available) {
        setUsernameError('Nome de usuário já em uso ou inválido');
        return;
      }

      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || username,
        photoURL: user.photoURL || '',
        username: username.toLowerCase(),
        bio: '',
        followersCount: 0,
        followingCount: 0,
        isPremium: false,
        isVerified: false,
        badges: [],
        coins: 0,
        interests: selectedInterests,
        onboardingCompleted: true,
        createdAt: new Date(),
      };

      await saveUserProfile(newProfile);
      onComplete(newProfile);
      return;
    }

    setStep(prev => prev + 1);
  };

  return (
    <div className="h-screen w-full bg-vortex-bg text-vortex-text-primary p-8 flex flex-col">
      <div className="flex justify-between items-center mb-12">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1 w-8 rounded-full transition-all",
                step >= i ? "bg-vortex-accent" : "bg-white/10"
              )} 
            />
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-vortex-text-secondary">
          Passo {step} de 3
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-3xl font-display font-bold mb-2">O que você curte?</h2>
            <p className="text-vortex-text-secondary mb-8">Selecione pelo menos 5 categorias para calibrar seu feed.</p>
            
            <div className="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pb-8">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleInterestToggle(cat.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                    selectedInterests.includes(cat.id) 
                      ? "bg-vortex-accent/20 border-vortex-accent text-white" 
                      : "bg-vortex-surface border-white/5 text-vortex-text-secondary"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                  {selectedInterests.includes(cat.id) && (
                    <div className="absolute top-2 right-2 text-vortex-accent">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-3xl font-display font-bold mb-2">Siga criadores</h2>
            <p className="text-vortex-text-secondary mb-8">Siga pelo menos 3 criadores para começar a ver conteúdo.</p>
            
            <div className="space-y-4 overflow-y-auto no-scrollbar pb-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between p-4 glass rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-vortex-surface overflow-hidden">
                      <img src={`https://picsum.photos/seed/creator${i}/100/100`} alt="creator" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="font-bold">Criador Exemplo {i}</p>
                      <p className="text-xs text-vortex-text-secondary">@criador_{i}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold">
                    Seguir
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-3xl font-display font-bold mb-2">Personalize seu perfil</h2>
            <p className="text-vortex-text-secondary mb-12">Escolha como o mundo verá você no VORTEX.</p>
            
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-vortex-surface border-4 border-vortex-accent flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} className="text-vortex-text-secondary" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-vortex-accent rounded-full text-white shadow-lg">
                  <Camera size={20} />
                </button>
              </div>

              <div className="w-full space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-vortex-text-secondary ml-4">Nome de usuário</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-vortex-text-secondary">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                      setUsernameError('');
                    }}
                    placeholder="seu_username"
                    className="w-full bg-vortex-surface border border-white/5 rounded-full py-4 pl-12 pr-6 focus:border-vortex-accent outline-none transition-all"
                  />
                </div>
                {usernameError && <p className="text-vortex-secondary text-xs ml-4">{usernameError}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleNextStep}
        disabled={
          (step === 1 && selectedInterests.length < 5) || 
          (step === 3 && (username.length < 3 || isCheckingUsername))
        }
        className={cn(
          "w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all mt-auto",
          ((step === 1 && selectedInterests.length >= 5) || step === 2 || (step === 3 && username.length >= 3))
            ? "bg-vortex-accent text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]"
            : "bg-white/5 text-vortex-text-secondary cursor-not-allowed"
        )}
      >
        {isCheckingUsername ? 'Verificando...' : step === 3 ? 'Finalizar' : 'Próximo'}
        <ChevronRight size={20} />
      </button>
    </div>
  );
};
