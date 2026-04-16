import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoFeed } from './components/VideoFeed';
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ProfileScreen } from './components/ProfileScreen';
import { EditProfileScreen } from './components/EditProfileScreen';
import { CreateVideoFlow } from './components/CreateVideoFlow';
import { LiveStreamScreen } from './components/LiveStreamScreen';
import { CoinShop } from './components/CoinShop';
import { AdminPanel } from './components/AdminPanel';
import { Video, UserProfile, LiveStream } from './types';

const MOCK_LIVE: LiveStream = {
  id: 'live_1',
  creatorId: 'host_1',
  creatorName: 'vortex_official',
  creatorPhoto: 'https://picsum.photos/seed/host/200/200',
  title: 'VORTEX Launch Party! 🚀',
  viewerCount: 12400,
  coinCount: 3200,
  isLive: true,
  type: 'video',
  startedAt: new Date(),
  activeSlotCount: 3,
  participants: [
    { uid: 'p1', username: 'dj_neon', photoURL: 'https://picsum.photos/seed/p1/100/100', isMuted: false, isVideoOff: false, isSpeaking: true },
    { uid: 'p2', username: 'cyber_queen', photoURL: 'https://picsum.photos/seed/p2/100/100', isMuted: true, isVideoOff: false },
    { uid: 'p3', username: 'pixel_art', photoURL: 'https://picsum.photos/seed/p3/100/100', isMuted: false, isVideoOff: true },
  ],
  goal: {
    current: 3200,
    target: 5000,
    label: 'Chuva de Moedas'
  }
};

const MOCK_AUDIO_LIVE: LiveStream = {
  id: 'live_2',
  creatorId: 'host_2',
  creatorName: 'tech_talks',
  creatorPhoto: 'https://picsum.photos/seed/tech/200/200',
  title: 'O Futuro do WebRTC no VORTEX',
  viewerCount: 8300,
  coinCount: 1800,
  isLive: true,
  type: 'audio',
  startedAt: new Date(),
  activeSlotCount: 3,
  participants: [
    { uid: 's1', username: 'dev_master', photoURL: 'https://picsum.photos/seed/s1/100/100', isMuted: false, isVideoOff: true, isSpeaking: true },
    { uid: 's2', username: 'ux_guru', photoURL: 'https://picsum.photos/seed/s2/100/100', isMuted: false, isVideoOff: true },
    { uid: 's3', username: 'cloud_architect', photoURL: 'https://picsum.photos/seed/s3/100/100', isMuted: true, isVideoOff: true },
  ]
};
import { auth, getUserProfile, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2, Mic, Video as VideoIcon } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from './lib/utils';

const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    creatorId: 'user1',
    creatorName: 'cyberpunk_vibe',
    creatorPhoto: 'https://picsum.photos/seed/cyber/200/200',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-dark-room-2106-large.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cyber1/400/800',
    description: 'Noites neon na cidade. #cyberpunk #vortex #neon',
    musicName: 'Midnight City - M83',
    likesCount: 12400,
    commentsCount: 450,
    sharesCount: 1200,
    createdAt: new Date(),
    tags: ['cyberpunk', 'vortex', 'neon']
  },
  {
    id: '2',
    creatorId: 'user2',
    creatorName: 'explorador_natureza',
    creatorPhoto: 'https://picsum.photos/seed/nature/200/200',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-in-the-wind-172-large.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/nature1/400/800',
    description: 'A magia da hora dourada. 🍂 #natureza #paz #horadourada',
    musicName: 'Sons da Natureza - Relaxante',
    likesCount: 8900,
    commentsCount: 120,
    sharesCount: 300,
    createdAt: new Date(),
    tags: ['natureza', 'paz', 'horadourada']
  },
  {
    id: '3',
    creatorId: 'user3',
    creatorName: 'skater_pro',
    creatorPhoto: 'https://picsum.photos/seed/skate/200/200',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-skater-doing-a-trick-in-a-skatepark-1548-large.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/skate1/400/800',
    description: 'Finalmente acertei essa manobra! 🛹 #skate #pro #manobra',
    musicName: 'Skate or Die - Punk Rock',
    likesCount: 45000,
    commentsCount: 2300,
    sharesCount: 5600,
    createdAt: new Date(),
    tags: ['skate', 'pro', 'manobra']
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'shop' | 'inbox' | 'profile' | 'admin'>('home');
  const [activeFeed, setActiveFeed] = useState<'following' | 'foryou' | 'trending' | 'nearby'>('foryou');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [activeLive, setActiveLive] = useState<LiveStream | null>(null);
  const [showLiveSelection, setShowLiveSelection] = useState(false);
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);

  useEffect(() => {
    console.log("Iniciando onAuthStateChanged listener...");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Mudança de estado de autenticação detectada:", currentUser?.email || "Nenhum usuário");
      setUser(currentUser);
      try {
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.uid);
          console.log("Perfil do usuário recuperado:", userProfile?.username || "Nenhum perfil");
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao recuperar perfil do usuário:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const startLive = async (type: 'video' | 'audio') => {
    if (!user || !profile) return;
    
    if (!profile.isHost && user.email !== 'rbvideos0441@gmail.com') {
      alert("Apenas hosts oficiais podem iniciar transmissões ao vivo.");
      return;
    }
    
    const liveId = `live_${user.uid}`;
    const liveData: LiveStream = {
      id: liveId,
      creatorId: user.uid,
      creatorName: profile.username,
      creatorPhoto: profile.photoURL || 'https://picsum.photos/seed/user/200/200',
      title: `${profile.username}'s Live Stream`,
      viewerCount: 0,
      coinCount: 0,
      isLive: true,
      type,
      startedAt: new Date(),
      activeSlotCount: 0,
      participants: []
    };

    // Save to Firestore for real-time sync
    const liveRef = doc(db, 'lives', liveId);
    await setDoc(liveRef, {
      ...liveData,
      startedAt: serverTimestamp()
    }, { merge: true });

    setActiveLive(liveData);
    setShowLiveSelection(false);
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'create') {
      setIsCreatingVideo(true);
    } else {
      setActiveTab(tab as any);
    }
  };

  const handleAdminAccess = () => {
    if (profile?.role === 'admin' || user?.email === 'rbvideos0441@gmail.com') {
      setActiveTab('admin');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-vortex-bg flex items-center justify-center">
        <Loader2 size={48} className="text-vortex-accent animate-spin" />
      </div>
    );
  }

  // If not logged in and not on home, show auth
  if (!user && activeTab !== 'home') {
    return <AuthScreen />;
  }

  // If logged in but no profile, show onboarding
  if (user && !profile) {
    return <OnboardingFlow user={user} onComplete={setProfile} />;
  }

  return (
    <div className="h-screen w-full bg-vortex-bg text-vortex-text-primary flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 relative">
        {activeTab === 'home' && (
          <>
            <TopNav 
              activeFeed={activeFeed} 
              setActiveFeed={setActiveFeed} 
              onLiveClick={() => setShowLiveSelection(true)}
            />
            <VideoFeed 
              videos={videos} 
              onLiveClick={() => setShowLiveSelection(true)}
              onProfileClick={() => setActiveTab('profile')}
            />
          </>
        )}

        {activeTab === 'profile' && profile && (
          <ProfileScreen 
            profile={profile} 
            onEdit={() => setIsEditingProfile(true)} 
            onOpenShop={() => setActiveTab('shop')}
          />
        )}

        {/* Placeholder for other tabs */}
        {activeTab === 'discover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-vortex-text-secondary gap-6">
            <p className="font-display text-xl italic opacity-50">Explorar em breve...</p>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-vortex-text-secondary">
            <p className="font-display text-xl italic opacity-50">Mensagens em breve...</p>
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPanel />
        )}

        {activeTab === 'shop' && profile && (
          <CoinShop 
            currentCoins={profile.coins} 
            onClose={() => setActiveTab('home')} 
          />
        )}
      </main>

      {/* Edit Profile Modal */}
      {isEditingProfile && profile && (
        <EditProfileScreen 
          profile={profile} 
          onClose={() => setIsEditingProfile(false)}
          onSave={setProfile}
        />
      )}

      {/* Create Video Flow */}
      {isCreatingVideo && (
        <CreateVideoFlow 
          onClose={() => setIsCreatingVideo(false)}
          onPublish={(data) => {
            if (profile) {
              const newVideo: Video = {
                id: `v_${Date.now()}`,
                creatorId: profile.uid,
                creatorName: profile.username,
                creatorPhoto: profile.photoURL,
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-dark-room-2106-large.mp4', // Mock URL for now
                thumbnailUrl: 'https://picsum.photos/seed/new_video/400/800',
                description: data.caption,
                musicName: 'Som Original',
                likesCount: 0,
                commentsCount: 0,
                sharesCount: 0,
                createdAt: new Date(),
                tags: []
              };
              setVideos([newVideo, ...videos]);
            }
            setIsCreatingVideo(false);
            setActiveTab('home');
          }}
        />
      )}

      {/* Live Stream Screen */}
      {activeLive && (
        <LiveStreamScreen 
          live={activeLive}
          isHost={user?.uid === activeLive.creatorId}
          onClose={() => setActiveLive(null)}
        />
      )}

      {/* Live Selection Modal */}
      <AnimatePresence>
        {showLiveSelection && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLiveSelection(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass rounded-3xl p-8 flex flex-col gap-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold mb-2">Iniciar Transmissão</h2>
                {(!profile?.isHost && user?.email !== 'rbvideos0441@gmail.com') ? (
                  <p className="text-sm text-red-400 font-bold">Apenas hosts oficiais podem iniciar transmissões.</p>
                ) : (
                  <p className="text-sm text-white/50">Escolha o formato da sua live</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => startLive('video')}
                  disabled={!profile?.isHost && user?.email !== 'rbvideos0441@gmail.com'}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 transition-all group",
                    (!profile?.isHost && user?.email !== 'rbvideos0441@gmail.com') ? "opacity-50 cursor-not-allowed" : "hover:bg-vortex-accent/20 hover:border-vortex-accent"
                  )}
                >
                  <div className="p-4 bg-vortex-accent rounded-full group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                    <VideoIcon size={32} className="text-white" />
                  </div>
                  <span className="font-bold">Vídeo</span>
                </button>

                <button 
                  onClick={() => startLive('audio')}
                  disabled={!profile?.isHost && user?.email !== 'rbvideos0441@gmail.com'}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 transition-all group",
                    (!profile?.isHost && user?.email !== 'rbvideos0441@gmail.com') ? "opacity-50 cursor-not-allowed" : "hover:bg-vortex-secondary/20 hover:border-vortex-secondary"
                  )}
                >
                  <div className="p-4 bg-vortex-secondary rounded-full group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                    <Mic size={32} className="text-white" />
                  </div>
                  <span className="font-bold">Áudio</span>
                </button>
              </div>

              <button 
                onClick={() => setShowLiveSelection(false)}
                className="mt-2 py-3 text-sm font-bold text-white/40 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isAdmin={profile?.role === 'admin' || user?.email === 'rbvideos0441@gmail.com'}
      />
    </div>
  );
}
