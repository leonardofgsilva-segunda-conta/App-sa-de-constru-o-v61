import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const NEXO_LOGO = "https://i.postimg.cc/QxBHqJbp/logo-nexo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Senha atualizada com sucesso.');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      toast.error('Erro ao atualizar senha: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm w-full space-y-6"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-500" size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic">SENHA ATUALIZADA</h1>
          <p className="text-gray-500 dark:text-white/40 font-manrope">Sua senha foi redefinida com sucesso. Você será redirecionado para o login.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#C5A07D] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#C5A07D] rounded-full blur-[180px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        <div className="flex flex-col items-center">
          <img 
            src={NEXO_LOGO} 
            alt="NEXO" 
            className="w-48 mb-8 dark:invert-0 invert"
          />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic">NOVA SENHA</h1>
          <p className="text-[10px] font-bold text-[#C5A07D] uppercase tracking-[0.2em] mt-2">Redefina seu acesso</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">Nova Senha</label>
            <div className="relative">
              <input 
                required
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 pr-12 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
                placeholder="Mínimo 6 caracteres"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C5A07D] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">Confirmar Nova Senha</label>
            <input 
              required
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
              placeholder="Confirme a nova senha"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#C5A07D] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#C5A07D]/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'ATUALIZAR SENHA'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
