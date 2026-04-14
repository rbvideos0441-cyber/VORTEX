import React from 'react';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'discover', icon: Search, label: 'Descobrir' },
    { id: 'create', icon: Plus, label: 'Criar', isSpecial: true },
    { id: 'inbox', icon: MessageSquare, label: 'Entrada' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <div className="max-w-md mx-auto glass rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative -top-6 bg-vortex-accent p-4 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.5)] text-white hover:scale-110 transition-transform"
              >
                <Icon size={24} strokeWidth={3} />
              </button>
            );
          }
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all relative",
                activeTab === tab.id ? "text-vortex-accent scale-110" : "text-vortex-text-secondary hover:text-vortex-text-primary"
              )}
            >
              <div className="relative">
                <Icon size={24} />
                {tab.id === 'home' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-vortex-secondary rounded-full border border-vortex-surface animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
