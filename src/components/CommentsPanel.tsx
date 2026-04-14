import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smile, Heart } from 'lucide-react';

interface Comment {
  id: string;
  user: string;
  text: string;
  likes: number;
  time: string;
}

export const CommentsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [comments] = useState<Comment[]>([
    { id: '1', user: 'vortex_fan', text: 'Essa manobra foi insana! 🔥', likes: 124, time: '2h' },
    { id: '2', user: 'cyber_girl', text: 'A estética desse vídeo está perfeita.', likes: 89, time: '5h' },
    { id: '3', user: 'skate_life', text: 'Onde fica esse pico?', likes: 45, time: '1d' },
  ]);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-x-0 bottom-0 h-[70vh] bg-vortex-surface rounded-t-[32px] z-[60] flex flex-col shadow-2xl border-t border-white/5"
    >
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <h3 className="font-display font-bold text-lg">342 Comentários</h3>
        <button onClick={onClose} className="p-2 text-vortex-text-secondary hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-vortex-bg border border-white/5 overflow-hidden shrink-0">
              <img src={`https://picsum.photos/seed/${comment.user}/100/100`} alt="user" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-vortex-text-secondary">@{comment.user}</span>
                <span className="text-[10px] text-white/20">{comment.time}</span>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">{comment.text}</p>
              <div className="flex items-center gap-4 mt-2">
                <button className="text-[10px] font-bold text-vortex-text-secondary hover:text-white">Responder</button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Heart size={16} className="text-vortex-text-secondary hover:text-vortex-secondary transition-colors cursor-pointer" />
              <span className="text-[10px] font-mono text-vortex-text-secondary">{comment.likes}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-vortex-bg border-t border-white/5 flex items-center gap-3">
        <div className="flex-1 bg-vortex-surface rounded-full px-6 py-3 flex items-center gap-3 border border-white/5">
          <input 
            type="text" 
            placeholder="Adicione um comentário..." 
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
          <Smile size={20} className="text-vortex-text-secondary cursor-pointer" />
        </div>
        <button className="p-3 bg-vortex-accent rounded-full text-white shadow-lg">
          <Send size={20} />
        </button>
      </div>
    </motion.div>
  );
};
