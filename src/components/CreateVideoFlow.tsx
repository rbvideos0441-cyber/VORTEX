import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Music, Zap, Timer, Sliders, Check, Upload, Scissors, Type, Smile, Mic, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface CreateVideoFlowProps {
  onClose: () => void;
  onPublish: (videoData: any) => void;
}

export const CreateVideoFlow: React.FC<CreateVideoFlowProps> = ({ onClose, onPublish }) => {
  const [step, setStep] = useState<'record' | 'edit' | 'publish'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(15);
  const [caption, setCaption] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<'text' | 'stickers' | 'voice' | 'trim' | 'sound' | null>(null);
  const [volume, setVolume] = useState(100);
  const [overlayText, setOverlayText] = useState('');
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, we'd upload to storage. 
      // For now, we'll create a local URL to "preview" it.
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setStep('edit');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Step 1: Record */}
      <AnimatePresence mode="wait">
        {step === 'record' && (
          <motion.div 
            key="record"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full"
          >
            {/* Camera View Placeholder */}
            <div className="absolute inset-0 bg-vortex-surface flex items-center justify-center">
              <Camera size={80} className="text-white/10" />
              <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
              <button onClick={onClose} className="p-2 glass rounded-full text-white">
                <X size={24} />
              </button>
              <button className="flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-bold text-white">
                <Music size={16} />
                Adicionar Som
              </button>
              <div className="w-10" />
            </div>

            {/* Right Sidebar Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20">
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="p-2 glass rounded-full"><Zap size={20} /></div>
                <span className="text-[10px] font-bold uppercase">Filtros</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="p-2 glass rounded-full"><Timer size={20} /></div>
                <span className="text-[10px] font-bold uppercase">Timer</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="p-2 glass rounded-full"><Sliders size={20} /></div>
                <span className="text-[10px] font-bold uppercase">Veloc.</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="p-2 glass rounded-full"><Wand2 size={20} /></div>
                <span className="text-[10px] font-bold uppercase">Beleza</span>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-12 left-0 right-0 px-8 flex items-center justify-between z-20">
              <input 
                type="file" 
                ref={galleryInputRef} 
                className="hidden" 
                accept="video/*"
                onChange={handleGalleryUpload}
              />
              <button 
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-2 text-white opacity-60"
              >
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center">
                  <Upload size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase">Galeria</span>
              </button>

              <button 
                onClick={() => setIsRecording(!isRecording)}
                className="relative flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: isRecording ? 0.8 : 1, borderRadius: isRecording ? '8px' : '50%' }}
                    className="w-16 h-16 bg-vortex-secondary"
                  />
                </div>
                {isRecording && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity }}
                    className="absolute -inset-2 border-2 border-vortex-secondary rounded-full"
                  />
                )}
              </button>

              <button 
                onClick={() => setStep('edit')}
                className="flex flex-col items-center gap-2 text-white"
              >
                <div className="w-12 h-12 bg-vortex-accent rounded-full flex items-center justify-center shadow-lg">
                  <Check size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase">Pronto</span>
              </button>
            </div>

            {/* Duration Selector */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 z-20">
              {['15s', '60s', '3m', '10m'].map(d => (
                <button 
                  key={d}
                  onClick={() => setTimer(parseInt(d))}
                  className={cn(
                    "text-[10px] font-bold tracking-widest uppercase transition-colors",
                    timer === parseInt(d) ? "text-white" : "text-white/40"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Edit */}
        {step === 'edit' && (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="relative h-full w-full flex flex-col"
          >
            <div className="flex-1 bg-vortex-surface relative overflow-hidden">
               {/* Video Preview */}
               <div className="absolute inset-0 flex items-center justify-center">
                 {videoFile ? (
                   <video 
                     src={videoFile} 
                     className="w-full h-full object-cover" 
                     autoPlay 
                     loop 
                     muted 
                   />
                 ) : (
                   <Scissors size={48} className="text-white/10" />
                 )}
               </div>
               
               {/* Edit Sidebar */}
               <div className="absolute right-4 top-24 flex flex-col gap-6 z-20">
                 <button 
                   onClick={() => setActiveEditor('text')}
                   className="p-2 glass rounded-full text-white hover:bg-vortex-accent transition-colors"
                 >
                   <Type size={20} />
                 </button>
                 <button 
                   onClick={() => setActiveEditor('stickers')}
                   className="p-2 glass rounded-full text-white hover:bg-vortex-accent transition-colors"
                 >
                   <Smile size={20} />
                 </button>
                 <button 
                   onClick={() => setActiveEditor('voice')}
                   className="p-2 glass rounded-full text-white hover:bg-vortex-accent transition-colors"
                 >
                   <Mic size={20} />
                 </button>
                 <button 
                   onClick={() => setActiveEditor('trim')}
                   className="p-2 glass rounded-full text-white hover:bg-vortex-accent transition-colors"
                 >
                   <Scissors size={20} />
                 </button>
               </div>

               {/* Overlay Text Preview */}
               {overlayText && (
                 <motion.div 
                   drag
                   className="absolute inset-0 flex items-center justify-center pointer-events-none"
                 >
                   <span className="bg-black/60 px-4 py-2 rounded-lg text-2xl font-bold text-white pointer-events-auto cursor-move">
                     {overlayText}
                   </span>
                 </motion.div>
               )}

               <div className="absolute top-6 left-6 z-20">
                 <button onClick={() => setStep('record')} className="p-2 glass rounded-full text-white">
                   <X size={24} />
                 </button>
               </div>
            </div>

            <div className="p-6 bg-black flex items-center justify-between relative">
              <button 
                onClick={() => setActiveEditor('sound')}
                className="flex items-center gap-2 text-white/60 font-bold text-sm hover:text-white transition-colors"
              >
                <Music size={18} />
                Ajustar Som
              </button>
              <button 
                onClick={() => setStep('publish')}
                className="px-8 py-3 bg-vortex-accent rounded-full font-bold shadow-lg"
              >
                Avançar
              </button>

              {/* Editor Modals */}
              <AnimatePresence>
                {activeEditor && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full left-0 right-0 p-6 bg-vortex-surface/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 z-30"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-sm uppercase tracking-widest">
                        {activeEditor === 'text' && 'Adicionar Texto'}
                        {activeEditor === 'stickers' && 'Stickers & Emojis'}
                        {activeEditor === 'voice' && 'Gravador de Voz'}
                        {activeEditor === 'trim' && 'Cortar Vídeo'}
                        {activeEditor === 'sound' && 'Volume do Som'}
                      </h3>
                      <button onClick={() => setActiveEditor(null)} className="p-1 hover:bg-white/10 rounded-full">
                        <X size={20} />
                      </button>
                    </div>

                    {activeEditor === 'text' && (
                      <div className="space-y-4">
                        <input 
                          autoFocus
                          type="text"
                          value={overlayText}
                          onChange={(e) => setOverlayText(e.target.value)}
                          placeholder="Digite seu texto aqui..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-vortex-accent"
                        />
                        <div className="flex gap-2">
                          {['white', 'vortex-accent', 'vortex-secondary', 'vortex-highlight'].map(color => (
                            <div key={color} className={cn("w-8 h-8 rounded-full cursor-pointer border-2 border-white/20", `bg-${color}`)} />
                          ))}
                        </div>
                      </div>
                    )}

                    {activeEditor === 'sound' && (
                      <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between text-xs font-bold text-white/40">
                          <span>Volume</span>
                          <span>{volume}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="200" 
                          value={volume}
                          onChange={(e) => setVolume(parseInt(e.target.value))}
                          className="w-full accent-vortex-accent"
                        />
                      </div>
                    )}

                    {activeEditor === 'stickers' && (
                      <div className="grid grid-cols-6 gap-4 py-2">
                        {['🔥', '✨', '🚀', '💯', '❤️', '😂', '🎮', '🎵', '⚡', '👑', '🌈', '💎'].map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => {
                              setOverlayText(prev => prev + emoji);
                              setActiveEditor(null);
                            }}
                            className="text-3xl hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeEditor === 'voice' && (
                      <div className="flex flex-col items-center gap-6 py-8">
                        <div className="w-20 h-20 rounded-full bg-vortex-secondary/20 flex items-center justify-center relative">
                          <div className="absolute inset-0 rounded-full border-2 border-vortex-secondary animate-ping opacity-20" />
                          <Mic size={32} className="text-vortex-secondary" />
                        </div>
                        <p className="text-xs font-bold text-white/60">Pressione para gravar voz</p>
                        <button className="w-full py-4 bg-vortex-secondary rounded-full font-bold">Gravar</button>
                      </div>
                    )}

                    {activeEditor === 'trim' && (
                      <div className="space-y-6 py-4">
                        <div className="h-12 bg-white/5 rounded-lg border border-white/10 relative overflow-hidden">
                          <div className="absolute inset-y-0 left-4 right-12 bg-vortex-accent/30 border-x-4 border-vortex-accent" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase">
                          <span>00:00</span>
                          <span>Duração: 00:15</span>
                          <span>00:15</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Step 3: Publish */}
        {step === 'publish' && (
          <motion.div 
            key="publish"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full w-full bg-vortex-bg flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
              <button onClick={() => setStep('edit')} className="text-white/60"><X size={24} /></button>
              <h2 className="font-display font-bold text-lg">Publicar</h2>
              <div className="w-6" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex gap-4">
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escreva uma legenda... #hashtags @menções"
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm h-24"
                />
                <div className="w-20 h-28 bg-vortex-surface rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/20 uppercase text-center p-2">
                    Capa do Vídeo
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-vortex-highlight" />
                    <span className="text-sm font-bold">Quem pode ver</span>
                  </div>
                  <select 
                    className="bg-transparent text-xs font-bold outline-none"
                    onChange={(e) => setIsPrivate(e.target.value === 'private')}
                  >
                    <option value="public">Público</option>
                    <option value="friends">Amigos</option>
                    <option value="private">Privado</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Smile size={20} className="text-vortex-secondary" />
                    <span className="text-sm font-bold">Permitir Comentários</span>
                  </div>
                  <div className="w-10 h-6 bg-vortex-accent rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Scissors size={20} className="text-vortex-highlight" />
                    <span className="text-sm font-bold">Permitir Dueto/Ponto</span>
                  </div>
                  <div className="w-10 h-6 bg-vortex-accent rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <button className="py-4 glass rounded-full font-bold text-sm">Rascunho</button>
              <button 
                onClick={() => onPublish({ caption, isPrivate })}
                className="py-4 bg-vortex-accent rounded-full font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              >
                Publicar Agora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
