import React from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Apple, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';
import { signInWithGoogle } from '../firebase';

export const AuthScreen: React.FC = () => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleGoogleLogin = async () => {
    console.log("Iniciando login com Google...");
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      const result = await signInWithGoogle();
      console.log("Login com Google bem-sucedido:", result.user.email);
    } catch (error: any) {
      console.error("Erro ao fazer login com Google:", error);
      if (error.code === 'auth/popup-blocked') {
        setErrorMsg("O popup foi bloqueado pelo seu navegador. Por favor, permita popups para este site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMsg("Este domínio não está autorizado no Firebase Console. Por favor, adicione este domínio às configurações de autenticação.");
      } else {
        setErrorMsg("Erro ao entrar com Google. Por favor, tente novamente.");
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-dark-room-2106-large.mp4"
      />
      
      {/* Dark Overlay with Glassmorphism */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-display font-extrabold mb-2 tracking-tighter italic premium-text">
            VORTEX
          </h1>
          <p className="text-vortex-text-secondary mb-12 font-medium tracking-widest uppercase text-xs">
            Seu mundo em movimento
          </p>

          <div className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-3 rounded-xl mb-4">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className={cn(
                "w-full py-4 glass rounded-full flex items-center justify-center gap-3 font-bold hover:bg-white/10 transition-all group",
                isLoggingIn && "opacity-50 cursor-wait"
              )}
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Chrome size={20} className="group-hover:text-vortex-highlight transition-colors" />
              )}
              {isLoggingIn ? 'Entrando...' : 'Continuar com Google'}
            </button>

            <button
              className="w-full py-4 glass rounded-full flex items-center justify-center gap-3 font-bold hover:bg-white/10 transition-all group opacity-50 cursor-not-allowed"
              disabled
            >
              <Apple size={20} />
              Continuar com Apple
            </button>

            <div className="py-4 flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-[10px] uppercase tracking-widest text-vortex-text-secondary">ou</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <button
              className="w-full py-4 bg-vortex-accent rounded-full flex items-center justify-center gap-3 font-bold hover:bg-vortex-accent/80 transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]"
            >
              <Mail size={20} />
              Email e Senha
            </button>
          </div>

          <p className="mt-12 text-[10px] text-vortex-text-secondary px-8 leading-relaxed">
            Ao continuar, você concorda com nossos <span className="text-white underline">Termos de Serviço</span> e <span className="text-white underline">Política de Privacidade</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
