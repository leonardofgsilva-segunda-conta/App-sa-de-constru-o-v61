import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isDemoMode } from '../lib/supabase';
import { LogIn, Lock, Mail, Loader2, Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface LoginProps {
  onLoginSuccess: () => void;
  onBackToLanding?: () => void;
}

const NEXO_LOGO = "https://i.postimg.cc/QxBHqJbp/logo-nexo.png";

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Informe seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Enviamos um link de recuperação para seu e-mail.');
      setView('login');
    } catch (error: any) {
      toast.error('Erro ao enviar recuperação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent, roleType: 'trainer' | 'student') => {
    e.preventDefault();
    setLoading(true);
    
    console.log(`[LOGIN] Tentativa: ${roleType} | Email: ${email}`);

    // --- Demo Mode Logic ---
    const cleanEmail = email.trim().toLowerCase();
    
    // Bypasses de demonstração simplificados
    const isLeonardo = cleanEmail === 'leonardo@medensino.net' && (password === '12345' || password === 'admin123');

    if ((password === 'admin123' && cleanEmail === 'admin@nexo.com') || isLeonardo) {
      if (roleType === 'trainer') {
        localStorage.setItem('nexo_demo_auth', 'trainer');
        toast.success(isLeonardo ? 'Acesso LEONARDO (Modo Trainer)' : 'Acesso Administrador (DEMO)');
        onLoginSuccess();
        setLoading(false);
        return;
      } else if (roleType === 'student' && isLeonardo) {
        localStorage.setItem('nexo_demo_auth', 'student');
        toast.success('Acesso LEONARDO (Modo Aluno)');
        // Tentar encontrar o ID real do Leonardo no banco para carregar o treino
        try {
          const { data } = await supabase.from('students').select('id').ilike('name', '%leonardo%').maybeSingle();
          if (data) {
            localStorage.setItem('nexo_student_id', data.id);
          }
        } catch (e) {}
        onLoginSuccess();
        setLoading(false);
        return;
      }
    }

    if (cleanEmail === 'aluno@nexo.com' && password === 'aluno123' && roleType === 'student') {
      localStorage.setItem('nexo_demo_auth', 'student');
      toast.success('Acesso Aluno (DEMO)');
      onLoginSuccess();
      setLoading(false);
      return;
    }

    try {
      // 1. AUTENTICAÇÃO SUPABASE
      console.log('[LOGIN] Chamando Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (authError) {
        console.error('[LOGIN AUTH ERROR]', authError.message);
        throw authError;
      }

      const user = authData.user;
      if (!user) throw new Error('Falha crítica: Usuário não retornado.');

      // 2. CAPTURA DE PERFIL E BLOQUEIO DE ROLE
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .ilike('email', user.email || '')
          .maybeSingle();

        console.log('[TRAINER ENTRY BLOCK] user.email:', user.email);
        console.log('[TRAINER ENTRY BLOCK] role encontrada:', profileData?.role);
        console.log('[TRAINER ENTRY BLOCK] registro em students:', !!studentRecord);

        if (roleType === 'trainer') {
          if (profileData?.role === 'student' || studentRecord) {
            console.log('[TRAINER ENTRY BLOCK] aluno bloqueado');
            toast.error("Área exclusivamente para treinador.");
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
          // Se for trainer ou owner, permitir
          localStorage.removeItem('nexo_student_id');
          localStorage.setItem('nexo_demo_auth', 'trainer');
        } else if (roleType === 'student') {
          const { data: studentProfile, error: profileError } = await supabase
            .from('students')
            .select('*')
            .ilike('email', user.email || '')
            .maybeSingle();

          if (profileError) throw new Error('Erro ao buscar perfil do aluno.');
          
          if (!studentProfile) {
            console.warn('[LOGIN] Aluno não encontrado na tabela students para o e-mail:', user.email);
            throw new Error('Seu e-mail está autenticado, mas não foi localizado no cadastro deste treinador. Entre em contato com seu professor.');
          }

          localStorage.setItem('nexo_student_id', studentProfile.id);
          localStorage.setItem('nexo_demo_auth', 'student');
        }
      } catch (profileErr: any) {
        await supabase.auth.signOut();
        throw profileErr;
      }

      // 3. FINALIZAÇÃO
      toast.success('Acesso autorizado', {
        description: 'Bem-vindo ao ecossistema NEXO.'
      });
      onLoginSuccess();

    } catch (error: any) {
      console.log('[LOGIN] Restrição de acesso:', error.message);
      
      let message = error.message;
      let description = 'Verifique seus dados e tente novamente.';

      if (message === 'Invalid login credentials') {
        message = 'Acesso Negado';
        description = 'E-mail ou senha incorretos. Se você acabou de se cadastrar, verifique se confirmou seu e-mail (se aplicável).';
        
        if (isDemoMode) {
          description = 'Modo de Demonstração ativo: Use admin@nexo.com / admin123 ou leonardo@medensino.net / 12345.';
        }
      } else if (message === 'Failed to fetch') {
        message = 'Erro de Conexão';
        description = 'Não foi possível conectar ao servidor de autenticação. Verifique sua conexão ou as configurações do Supabase.';
      }

      toast.error(message, { description });
    } finally {
      // Garante parada do loading em qualquer situação
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#C5A07D] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#C5A07D] rounded-full blur-[180px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full max-w-2xl space-y-4 md:space-y-6 relative z-10"
      >
        <div className="flex flex-col items-center">
          {onBackToLanding && (
            <button 
              onClick={onBackToLanding}
              className="mb-8 text-[10px] font-black uppercase tracking-widest text-[#C5A07D]/60 hover:text-[#C5A07D] transition-colors flex items-center gap-2 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Voltar para página inicial
            </button>
          )}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#C5A07D]/10 blur-[80px] rounded-full" />
            <img 
              src={NEXO_LOGO} 
              alt="NEXO BIOMECHANICS" 
              className="object-contain relative z-10 filter drop-shadow-[0_0_20px_rgba(197,160,125,0.3)] brightness-110 w-[280px] md:w-[450px] dark:invert-0 invert"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'login' ? (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 md:space-y-6 max-w-sm mx-auto w-full"
            >
              <div className="space-y-4">
                <div className="space-y-2 group">
                  <label className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-[#C5A07D] text-center block w-full transition-colors">
                    E-MAIL
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl py-3 px-6 md:py-5 md:px-8 text-gray-900 dark:text-white text-xs md:text-sm outline-none focus:border-[#C5A07D]/20 focus:bg-[#C5A07D]/5 transition-all text-center placeholder:text-gray-400 dark:placeholder:text-white/5 font-manrope rounded-2xl shadow-sm dark:shadow-none"
                      placeholder="e-mail"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-[#C5A07D] text-center block w-full transition-colors">
                    SENHA
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl py-3 px-6 md:py-5 md:px-8 text-gray-900 dark:text-white text-xs md:text-sm outline-none focus:border-[#C5A07D]/20 focus:bg-[#C5A07D]/5 transition-all text-center placeholder:text-gray-400 dark:placeholder:text-white/5 font-manrope rounded-2xl shadow-sm dark:shadow-none"
                      placeholder="senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-[#C5A07D]/40 hover:text-[#C5A07D] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-[9px] font-black uppercase tracking-widest text-[#C5A07D]/60 hover:text-[#C5A07D] transition-all"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:gap-4 items-center">
                <button 
                  type="button"
                  onClick={(e) => handleLogin(e, 'trainer')}
                  disabled={loading}
                  className="w-full h-[42px] min-[480px]:h-[44px] md:h-[52px] max-w-[300px] min-[480px]:max-w-[320px] md:max-w-[360px] bg-[#C5A07D] text-black rounded-xl font-black uppercase tracking-[0.35em] text-[11px] min-[480px]:text-[12px] md:text-[14px] md:px-[28px] active:scale-[0.95] hover:brightness-110 hover:shadow-[0_0_20px_rgba(197,160,125,0.2)] transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>SOU TREINADOR</>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={(e) => handleLogin(e, 'student')}
                  disabled={loading}
                  className="w-full h-[42px] min-[480px]:h-[44px] md:h-[52px] max-w-[300px] min-[480px]:max-w-[320px] md:max-w-[360px] border border-[#C5A07D]/30 bg-transparent text-[#C5A07D] rounded-xl font-black uppercase tracking-[0.35em] text-[11px] min-[480px]:text-[12px] md:text-[14px] md:px-[28px] active:scale-[0.95] hover:bg-[#C5A07D]/5 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>SOU ALUNO</>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleForgotPassword}
              className="space-y-6 max-w-sm mx-auto w-full"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-[#C5A07D] text-center block w-full transition-colors">
                    Recuperação de Acesso
                  </label>
                  <p className="text-[10px] text-gray-500 dark:text-white/40 text-center font-manrope mb-4">
                    Informe seu e-mail para receber as instruções de redefinição.
                  </p>
                  <input 
                    type="email" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl py-3 px-6 md:py-5 md:px-8 text-gray-900 dark:text-white text-xs md:text-sm outline-none focus:border-[#C5A07D]/20 focus:bg-[#C5A07D]/5 transition-all text-center placeholder:text-gray-400 dark:placeholder:text-white/5 font-manrope shadow-sm dark:shadow-none"
                    placeholder="digite seu e-mail"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 md:py-5 bg-[#C5A07D] text-black rounded-xl font-black uppercase tracking-[0.35em] text-sm active:scale-[0.95] hover:brightness-110 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'ENVIAR RECUPERAÇÃO'}
                </button>
                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="text-[10px] font-black uppercase tracking-widest text-[#C5A07D]/60 hover:text-[#C5A07D] transition-all"
                >
                  Voltar ao Login
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="pt-8 md:pt-12 text-center">
          <p className="text-[6px] md:text-[7px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.6em] leading-relaxed italic">
            NEXO — CIÊNCIA EM MOVIMENTO, RESULTADO EM DADOS
          </p>
        </div>
      </motion.div>
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-gradient-to-b from-[#C5A07D]/20 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-gradient-to-t from-[#C5A07D]/20 to-transparent opacity-50" />
    </div>
  );
};

export default Login;
