import React from 'react';
import { motion } from 'framer-motion';
import { X, Coins, Zap, Star, Trophy, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

interface CoinShopProps {
  onClose: () => void;
  currentCoins: number;
}

const COIN_PACKAGES = [
  { id: '1', coins: 100, price: 'R$ 4,90', bonus: 0, popular: false },
  { id: '2', coins: 500, price: 'R$ 19,90', bonus: 50, popular: true },
  { id: '3', coins: 1200, price: 'R$ 44,90', bonus: 150, popular: false },
  { id: '4', coins: 3000, price: 'R$ 99,90', bonus: 500, popular: false },
  { id: '5', coins: 7000, price: 'R$ 199,90', bonus: 1200, popular: false },
  { id: '6', coins: 15000, price: 'R$ 399,90', bonus: 3000, popular: false },
];

export const CoinShop: React.FC<CoinShopProps> = ({ onClose, currentCoins }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative w-full max-w-md bg-vortex-bg rounded-t-[32px] sm:rounded-[32px] overflow-hidden border-t border-white/10"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-linear-to-r from-vortex-accent/10 to-vortex-secondary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-vortex-gold/20 rounded-xl">
              <Coins className="text-vortex-gold" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Loja de Moedas</h2>
              <p className="text-xs text-vortex-text-secondary">Saldo atual: <span className="text-vortex-gold font-bold">{currentCoins}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            {COIN_PACKAGES.map((pkg) => (
              <button 
                key={pkg.id}
                className={cn(
                  "relative p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group",
                  pkg.popular 
                    ? "bg-vortex-accent/10 border-vortex-accent shadow-[0_0_20px_rgba(124,58,237,0.2)]" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-vortex-accent text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Mais Popular
                  </div>
                )}

                <div className="relative">
                  <Coins size={32} className={cn(pkg.popular ? "text-vortex-gold" : "text-white/80")} />
                  {pkg.bonus > 0 && (
                    <div className="absolute -top-2 -right-4 bg-vortex-secondary text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                      +{pkg.bonus}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-lg font-mono font-bold">{pkg.coins + pkg.bonus}</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold">Moedas</p>
                </div>

                <div className={cn(
                  "w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all",
                  pkg.popular ? "bg-vortex-accent text-white" : "bg-white/10 text-white/80 group-hover:bg-white/20"
                )}>
                  {pkg.price}
                </div>
              </button>
            ))}
          </div>

          {/* Benefits */}
          <div className="mt-8 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 px-2">Vantagens de ter Moedas</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-3 glass rounded-2xl">
                <div className="p-2 bg-vortex-secondary/20 rounded-lg">
                  <Zap size={16} className="text-vortex-secondary" />
                </div>
                <p className="text-xs font-medium">Envie presentes exclusivos em lives</p>
              </div>
              <div className="flex items-center gap-3 p-3 glass rounded-2xl">
                <div className="p-2 bg-vortex-highlight/20 rounded-lg">
                  <Star size={16} className="text-vortex-highlight" />
                </div>
                <p className="text-xs font-medium">Destaque seus comentários no chat</p>
              </div>
              <div className="flex items-center gap-3 p-3 glass rounded-2xl">
                <div className="p-2 bg-vortex-gold/20 rounded-lg">
                  <Trophy size={16} className="text-vortex-gold" />
                </div>
                <p className="text-xs font-medium">Apoie seus criadores favoritos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/40 border-t border-white/5">
          <div className="flex items-center gap-3 text-[10px] text-white/40">
            <CreditCard size={14} />
            <p>Pagamento seguro via Vortex Pay. As moedas são creditadas instantaneamente.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
