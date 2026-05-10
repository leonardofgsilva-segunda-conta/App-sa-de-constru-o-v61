'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ComposedChart, 
  Bar, 
  BarChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie
} from 'recharts';
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  BarChart3, 
  Settings, 
  Bell,
  Plus,
  Search,
  Filter,
  Phone,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Calendar,
  Activity,
  AlertTriangle,
  TriangleAlert,
  Download,
  ChevronDown,
  Check,
  CheckCircle2,
  FileText,
  Scale,
  Ruler,
  History,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  RotateCcw,
  Edit3,
  X,
  Copy,
  MessageCircle,
  Mail,
  LogIn,
  ClipboardList,
  User,
  Upload,
  Camera,
  Loader2,
  Zap,
  Crown,
  Trophy,
  Medal,
  Sparkles,
  ArrowUpRight,
  Send,
  Sun,
  Moon,
  MoreHorizontal,
  CreditCard
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { cn } from '@/src/lib/utils';
import { dataService, Student, Evaluation } from './services/dataService';
import { supabase, isDemoMode } from './lib/supabase';
import { toast, Toaster } from 'sonner';
import Prescription from './components/Prescription';
import { PosturalEvaluation } from './components/PosturalEvaluation';
import { CardioEvaluation, CardioData } from './components/CardioEvaluation';
import { ReportCenter } from './components/ReportCenter';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Signup from './components/Signup';
import StudentExperience from './components/StudentExperience';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import StudentManagement from './components/StudentManagement';
import TrainerDashboard from './components/TrainerDashboard';
import { LandingPage } from './components/LandingPage';
import CheckoutPlans from './components/CheckoutPlans';

const InviteLanding = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('invite');

  useEffect(() => {
    const fetchStudent = async () => {
      if (!token) {
        setError('Token de convite ausente.');
        setLoading(false);
        return;
      }
      try {
        const data = await dataService.getStudentByInviteToken(token);
        if (data) {
          setStudent(data);
        } else {
          setError('Convite inválido ou expirado.');
        }
      } catch (err) {
        setError('Erro ao validar convite.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="text-red-500 mb-6" size={64} />
        <h1 className="text-3xl font-black text-white uppercase italic mb-4">CONVITE INVÁLIDO</h1>
        <p className="text-white/40 mb-8">{error || 'O link que você acessou não é mais válido.'}</p>
        <button onClick={onBack} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl uppercase text-[10px] font-black">Voltar ao Início</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(197,160,125,0.2)_0,transparent_70%)]" />
      </div>

      <div className="max-w-md w-full bg-zinc-900 border border-white/5 p-10 rounded-[40px] shadow-2xl relative z-10">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary mx-auto mb-6 shadow-xl flex items-center justify-center">
            {student.img && student.img !== "" ? (
              <img src={student.img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-primary font-black text-3xl">
                {student.name ? student.name.charAt(0) : '?'}
              </div>
            )}
          </div>
        
        <h1 className="text-2xl font-black text-white uppercase italic mb-2">OLÁ, {student.name.split(' ')[0]}!</h1>
        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-8">Seu treinador te convidou para a NEXO</p>
        
        <div className="space-y-4 text-left p-6 bg-white/5 rounded-3xl border border-white/5 mb-8">
           <div className="flex justify-between text-[10px] uppercase">
             <span className="text-white/40">Objetivo:</span>
             <span className="text-white font-black">{student.goal}</span>
           </div>
           <div className="flex justify-between text-[10px] uppercase">
             <span className="text-white/40">Frequência:</span>
             <span className="text-white font-black">{student.freq}</span>
           </div>
        </div>

        <button 
          onClick={() => navigate('/login')}
          className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:brightness-110 transition-all"
        >
          ACESSAR MINHA CONTA
        </button>
        <p className="mt-4 text-[9px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">
          Sua conta já foi criada pelo seu treinador.<br />Use seu e-mail cadastrado e a senha padrão 12345.
        </p>
      </div>
    </div>
  );
};

// --- Components ---

// --- NEXO LOGO ---
const NEXO_LOGO = "https://i.postimg.cc/QxBHqJbp/logo-nexo.png";

const Header = ({ 
  trainerProfile, 
  onProfileClick, 
  onLogout,
  onInviteClick,
  onNotificationClick,
  pendingCount,
  inviteCopied,
  theme,
  onThemeToggle
}: { 
  trainerProfile: { id: string, full_name: string, avatar_url: string }, 
  onProfileClick: () => void, 
  onLogout: () => void,
  onInviteClick: () => void,
  onNotificationClick: () => void,
  pendingCount: number,
  inviteCopied: boolean,
  theme: 'dark' | 'light',
  onThemeToggle: () => void
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-[100] bg-white/80 dark:bg-black/60 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 md:ml-[280px]">
      <div className="flex justify-between items-center px-4 sm:px-6 h-16 sm:h-20 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <img 
              src={NEXO_LOGO} 
              alt="NEXO" 
              className="h-[20px] sm:h-[32px] w-auto object-contain dark:brightness-110 dark:invert-0 invert" 
              style={{ minWidth: '100px' }} 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* Theme Toggle - Always visible */}
            <button 
              onClick={onThemeToggle}
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 hover:bg-primary/10 hover:text-primary transition-all border border-gray-200 dark:border-white/5 active:scale-95 shrink-0"
            >
              {theme === 'dark' ? <Sun size={14} className="sm:size-[18px]" /> : <Moon size={14} className="sm:size-[18px]" />}
            </button>

            {/* Invite Button - Hidden on Mobile, moved to menu */}
            <button 
              onClick={onInviteClick}
              title="Convidar Aluno"
              className={cn(
                "hidden sm:flex w-10 h-10 items-center justify-center rounded-xl transition-all border active:scale-95 shrink-0",
                inviteCopied 
                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 hover:bg-[#C5A07D]/10 hover:text-[#C5A07D] border-gray-200 dark:border-white/5"
              )}
            >
              {inviteCopied ? <Check size={18} /> : <Send size={18} />}
            </button>

            {/* Notifications - Always visible */}
            <button 
              onClick={onNotificationClick}
              title="Central de Aprovação"
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 relative active:scale-95 shrink-0"
            >
              <Bell size={14} className="sm:size-[18px]" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-primary text-black text-[7px] sm:text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-black animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <div className="w-[1px] h-6 sm:h-8 bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1" />

            {/* Profile Button - Hidden on Mobile, replaced by 3-dots */}
            <div className="relative">
              <button 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  } else {
                    onProfileClick();
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 p-1.5 sm:px-4 sm:py-2 rounded-full border border-gray-200 dark:border-white/5 transition-all group shrink-0 active:scale-95"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-primary/50 group-hover:border-primary transition-colors flex items-center justify-center bg-gray-200 dark:bg-black">
                  {trainerProfile.avatar_url && trainerProfile.avatar_url !== "" ? (
                    <img 
                      className="w-full h-full object-cover" 
                      src={trainerProfile.avatar_url} 
                      alt={trainerProfile.full_name}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={12} className="sm:size-[16px] text-primary/40" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start translate-y-[1px]">
                  <span className="text-[10px] font-black font-manrope uppercase tracking-widest text-gray-900 dark:text-white leading-none mb-1 line-clamp-1 max-w-[100px]">{trainerProfile.full_name}</span>
                  <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Professor</span>
                  </div>
                </div>
                <ChevronDown size={12} className="hidden sm:block text-gray-400 dark:text-white/20 group-hover:text-primary transition-colors shrink-0" />
                <MoreHorizontal size={14} className="sm:hidden text-gray-400 dark:text-white/20" />
              </button>

              <AnimatePresence>
                {isMobileMenuOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="fixed inset-0 z-[-1]"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 z-[110]"
                    >
                      <button 
                         onClick={() => { onProfileClick(); setIsMobileMenuOpen(false); }}
                         className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <User size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Editar Perfil</span>
                      </button>
                      <button 
                         onClick={() => { onProfileClick(); setIsMobileMenuOpen(false); }}
                         className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <CreditCard size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Minha Conta</span>
                      </button>
                      <button 
                         onClick={() => { onInviteClick(); setIsMobileMenuOpen(false); }}
                         className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left sm:hidden"
                      >
                        <Send size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Convidar</span>
                      </button>
                      <div className="h-[1px] bg-gray-100 dark:bg-white/5 my-1" />
                      <button 
                         onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                         className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogIn size={16} className="text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Sair</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Logout - Hidden on Mobile, moved to menu */}
            <button 
              onClick={onLogout} 
              title="Sair do Ecossistema" 
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-all border border-red-500/10 shrink-0"
            >
              <LogIn size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Registration = ({ onBack, theme }: { onBack: () => Promise<void>, theme: 'dark' | 'light' }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBack = async () => {
    console.log('[BACK HOME] limpando sessão');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Erro ao sair:', error);
    }
    console.log('[BACK HOME] indo para home pública');
    window.location.replace("/");
  };

  // Get ref from URL
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Bloqueio de clique duplo

    if (!name || !email || !phone || !birthDate || !password || !confirmPassword || !ref) {
      toast.error('Dados incompletos para o cadastro.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      
      // Chamada que cria Auth, Profile e Student (pendente)
      await dataService.registerStudentWithAuth(name, email, phone, password, ref, birthDate);
      
      setSuccess(true);
      toast.success('Cadastro enviado com sucesso. Aguarde aprovação do professor.');
    } catch (error: any) {
      console.error('[PRECADASTRO PURO] erro:', error);
      toast.error(error.message || 'Erro ao enviar solicitação.');
    } finally {
      console.log('[PRECADASTRO PURO] loading finalizado');
      setLoading(false);
    }
  };

  if (!ref) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center transition-colors duration-500">
         <AlertTriangle className="text-red-500 mb-6" size={64} />
         <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 italic">LINK INVÁLIDO</h1>
         <p className="text-gray-500 dark:text-white/60 max-w-sm font-manrope">Link inválido ou ausente. Peça um novo link ao professor.</p>
         <button 
           onClick={handleBack}
           className="mt-8 px-8 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-manrope"
         >
           Voltar ao Início
         </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center transition-colors duration-500">
         <div className="w-20 h-20 bg-[#C5A07D]/20 rounded-full flex items-center justify-center mb-6">
            <Check className="text-[#C5A07D]" size={40} />
         </div>
         <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 italic">SOLICITAÇÃO ENVIADA</h1>
         <p className="text-gray-500 dark:text-white/60 max-w-sm font-manrope">Cadastro enviado com sucesso. Aguarde aprovação do professor.</p>
         <button 
           onClick={handleBack}
           className="mt-8 px-8 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-manrope"
         >
           Voltar ao Início
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#C5A07D] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#C5A07D] rounded-full blur-[180px]" />
      </div>

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="flex flex-col items-center">
            <img 
              src={NEXO_LOGO} 
              alt="NEXO" 
              className="w-full max-w-[240px] md:max-w-[320px] h-auto object-contain mb-8 dark:invert-0 invert" 
              referrerPolicy="no-referrer" 
            />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">PRÉ-CADASTRO ALUNO</h1>
            <p className="text-[10px] font-bold text-[#C5A07D] uppercase tracking-[0.2em] mt-2">Inicie sua jornada biomecânica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">Nome Completo</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
              placeholder="Digite seu nome"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">E-mail</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">WhatsApp (com DDD)</label>
            <input 
              required
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">Data de Nascimento</label>
            <input 
              required
              type="date" 
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">Senha de Acesso</label>
            <div className="relative">
              <input 
                required
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 pr-12 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
                placeholder="Crie uma senha"
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
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-2">Confirmar Senha</label>
            <input 
              required
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope shadow-sm dark:shadow-none"
              placeholder="Confirme sua senha"
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !ref}
            className="w-full py-5 bg-[#C5A07D] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#C5A07D]/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'SOLICITAR ACESSO'}
          </button>
          
          {!ref ? (
            <p className="text-red-500 text-[9px] font-bold uppercase text-center mt-4">Link de convite inválido ou expirado.</p>
          ) : (
            <button 
              type="button"
              onClick={handleBack}
              className="w-full text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
            >
              Já tenho conta? Entrar
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
const NotificationsModal = ({ 
  isOpen, 
  onClose, 
  pendingStudents, 
  notifications,
  onAction 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  pendingStudents: Student[], 
  notifications: any[],
  onAction: (id: string, action: 'aprovar' | 'recusar') => void 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Central de Aprovação</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 dark:text-[#C5A07D]/60">Feed de Atividades e Notificações</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 dark:text-white/40">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Seção de Notificações de Alunos Pendentes */}
            {pendingStudents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Aguardando Aprovação</h3>
                {pendingStudents.map((student) => (
                  <div 
                    key={student.id}
                    className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:justify-between gap-4 group hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 flex items-center justify-center bg-gray-100 dark:bg-black">
                        {student.img && student.img !== "" ? (
                          <img src={student.img} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={24} className="text-gray-400 dark:text-white/20" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-tighter">Solicitação Pendente</p>
                        <div className="flex flex-col gap-0.5 mt-2">
                           <div className="flex items-center gap-1.5 text-[8px] text-gray-500 dark:text-white/40 font-manrope">
                              <Mail size={10} className="text-primary/40" />
                              {student.email}
                           </div>
                           <div className="flex items-center gap-1.5 text-[8px] text-gray-500 dark:text-white/40 font-manrope">
                              <Phone size={10} className="text-primary/40" />
                              {student.phone}
                           </div>
                           <div className="flex items-center gap-1.5 text-[8px] text-[#C5A07D]/60 font-manrope mt-1">
                              <Calendar size={10} />
                              Cadastrado em: {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button 
                        onClick={() => onAction(student.id, 'recusar')}
                        className="flex-1 sm:flex-none border border-red-500/10 hover:bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        Recusar
                      </button>
                      <button 
                        onClick={() => onAction(student.id, 'aprovar')}
                        className="flex-1 sm:flex-none bg-[#C5A07D] hover:brightness-110 text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#C5A07D]/10"
                      >
                        Aprovar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outras Notificações */}
            {notifications.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Histórico Recente</h3>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      notif.is_read 
                        ? "bg-transparent border-gray-100 dark:border-white/5 opacity-60" 
                        : "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-primary shrink-0">
                        {notif.type === 'new_student' ? <User size={18} /> : <Bell size={18} />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">{notif.title}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-white/60 leading-relaxed">{notif.message}</p>
                        <p className="text-[8px] text-gray-400 dark:text-white/20 font-bold uppercase tracking-widest mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingStudents.length === 0 && (
              <div className="py-20 text-center space-y-3">
                <div className="flex justify-center">
                  <Check className="text-gray-200 dark:text-white/10" size={48} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-white/20">Nenhuma solicitação pendente.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-gray-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-manrope"
            >
              Fechar Central
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


const ProfileEditModal = ({ 
  isOpen, 
  onClose, 
  profile, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  profile: any, 
  onSave: (updated: any) => Promise<void> 
}) => {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync internal state when profile prop changes
  useEffect(() => {
    setFullName(profile.full_name || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '');
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const publicUrl = await dataService.uploadTrainerAvatar(user.id, file);
      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({ ...profile, full_name: fullName, bio, avatar_url: avatarUrl });
      onClose();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-[#C5A07D]/20 to-transparent" />
        
        <div className="p-5 sm:p-8 pt-8 sm:pt-10 space-y-6 sm:space-y-8 relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Editar Perfil</h2>
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 dark:text-[#C5A07D]/60 whitespace-nowrap">Gestão de Identidade Profissional</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 dark:text-white/40">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#C5A07D]/30 group-hover:border-[#C5A07D] transition-all shadow-2xl">
                {uploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100/40 dark:bg-black/40 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-[#C5A07D]" size={32} />
                  </div>
                ) : avatarUrl && avatarUrl !== "" ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-black/40">
                    <User size={56} className="text-[#C5A07D]/20" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-[#C5A07D] text-black rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="w-full space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope"
                  placeholder="Seu nome profissional"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/30 pl-1">Especialidade / Bio Curta</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white text-sm outline-none focus:border-[#C5A07D]/30 transition-all font-manrope min-h-[100px] resize-none"
                  placeholder="Ex: Especialista em Biomecânica de Alta Performance"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button 
              onClick={onClose}
              className="w-full sm:flex-1 py-4 sm:py-5 rounded-2xl border border-gray-200 dark:border-white/5 font-black uppercase tracking-[0.2em] text-[10px] text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 transition-all outline-none"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full sm:flex-1 py-4 sm:py-5 bg-[#C5A07D] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#C5A07D]/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 outline-none"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  setViewMode 
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  setViewMode: (mode: 'trainer' | 'student') => void 
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'alunos', label: 'Alunos', icon: Users },
    { id: 'avaliacao', label: 'Avaliação', icon: Dumbbell },
    { id: 'prescricao', label: 'Prescrição', icon: ClipboardList },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-white/5 p-4 z-[60]">
        <div className="w-full flex items-center justify-center px-4 mb-8">
          <img 
            src={NEXO_LOGO} 
            alt="NEXO" 
            className="filter drop-shadow-[0_0_12px_rgba(197,160,125,0.4)] dark:brightness-110 dark:invert-0 invert h-auto w-full max-w-[200px]"
            referrerPolicy="no-referrer"
          />
        </div>
      <nav className="space-y-2 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-manrope font-bold text-sm uppercase tracking-tight",
              activeTab === tab.id 
                ? "bg-primary text-black shadow-lg shadow-primary/20" 
                : "text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-white/5 space-y-4">
        <button 
          onClick={() => setViewMode('student')}
          className="w-full py-5 bg-[#C5A07D] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#C5A07D]/30 group"
        >
          <Zap size={16} fill="currentColor" className="group-hover:animate-bounce" />
          Modo Aluno (Experience)
        </button>
        <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-3 text-center border border-gray-100 dark:border-white/5">
          <p className="text-[8px] font-black text-gray-500 dark:text-white/20 uppercase tracking-widest leading-none">Powered by NEXO Engine</p>
          <p className="text-[7px] font-bold text-gray-400 dark:text-white/10 uppercase tracking-[0.2em] mt-1">v3.8 Platinum Edition</p>
        </div>
      </div>
    </aside>
  );
};

// --- Pages ---



const Students: React.FC<{ 
  onSelectStudent: (id: string, tab: string) => void,
  trainerProfile: any,
  isModalOpen: boolean,
  setIsModalOpen: (open: boolean) => void,
  editingStudent: Student | null,
  setEditingStudent: (s: Student | null) => void,
  generatedPassword: string | null,
  setGeneratedPassword: (p: string | null) => void,
  formData: any,
  setFormData: (data: any) => void,
  initialFormState: any
}> = ({ 
  onSelectStudent, 
  trainerProfile, 
  isModalOpen, 
  setIsModalOpen, 
  editingStudent, 
  setEditingStudent, 
  generatedPassword, 
  setGeneratedPassword, 
  formData, 
  setFormData, 
  initialFormState 
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'ativos' | 'arquivados'>('ativos');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é muito grande. O limite é 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, img: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'ativos') {
        // Busca explícita por ativos (considerando que vêm do banco padronizados ou não)
        // Usamos array para pegar variações se houverem, mas o ideal é padronizar
        data = await dataService.getStudents(['ativo', 'Ativo']);
      } else {
        // Arquivados: qualquer um que NÃO seja ativo
        data = await dataService.getStudents(undefined, 'ativo');
        // Filtro adicional no cliente para garantir que variações de 'Ativo' não passem
        data = data.filter(s => s.status?.toLowerCase() !== 'ativo');
      }
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeTab]);

  const handleRestore = async (studentId: string) => {
    if (!window.confirm('Deseja restaurar este aluno para a lista ativa?')) return;
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'ativo' })
        .eq('id', studentId);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== studentId));
      alert('Aluno restaurado com sucesso!');
    } catch (err: any) {
      alert('Erro ao restaurar: ' + err.message);
    }
  };

  const handleArchive = async (studentId: string) => {
    const confirmed = window.confirm('Deseja realmente arquivar este aluno? Ele sairá da lista ativa.');
    if (!confirmed) return;

    console.log('Iniciando arquivamento para:', studentId);

    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'arquivado' })
        .eq('id', studentId);

      if (error) throw error;

      // Atualiza a lista local removendo o aluno arquivado
      setStudents(prev => prev.filter(s => s.id !== studentId));
      console.log('Aluno arquivado com sucesso.');
    } catch (err: any) {
      console.error('Erro ao arquivar:', err);
      alert('Erro técnico: ' + err.message);
    }
  };

  const handleOpenModal = (student: Student | null = null) => {
    setGeneratedPassword(null);
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        goal: student.goal,
        freq: student.freq,
        status: student.status,
        img: student.img || '',
        phone: student.phone || '',
        lesao: student.lesao || '',
        observacoes: student.observacoes || '',
        birthDate: student.birthDate || '',
        email: student.email || '',
        password: ''
      });
    } else {
      setEditingStudent(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalPassword = formData.password;
      
      // Lógica da Senha Automática: Se estiver vazio, gera 8 caracteres
      if (!finalPassword) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        finalPassword = Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
      }

      if (editingStudent) {
        await dataService.updateStudent(editingStudent.id, { ...formData, password: finalPassword });
        toast.success("Cadastro atualizado!");
      } else {
        await dataService.addStudent({ ...formData, password: finalPassword });
        toast.success("Aluno cadastrado com sucesso!");
      }

      // SÓ APÓS CONFIRMAÇÃO DO BANCO: Define a senha gerada para exibir o Bloco de Boas-Vindas
      setGeneratedPassword(finalPassword);
      
      // Automação de E-mail (opcional, mantendo o mailto se houver email)
      if (formData.email) {
        const professorName = trainerProfile.full_name || "Seu Treinador";
        const body = `Olá, ${formData.name}! Seu perfil foi criado.\n\nAcesso: ${formData.email} / Senha: ${finalPassword}\nLink: https://app-sa-de-constru-o-v56.vercel.app/\n\nAtenciosamente, ${professorName} (NEXO)`;
        const mailtoUrl = `mailto:${formData.email}?subject=${encodeURIComponent("Seu acesso à NEXO está liberado! 🚀")}&body=${encodeURIComponent(body)}`;
        
        setTimeout(() => {
          if (window.confirm("Deseja abrir seu e-mail para enviar as instruções?")) {
            window.location.href = mailtoUrl;
          }
        }, 1000);
      }

      await fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar aluno.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Mantido por compatibilidade interna, mas não utilizado no botão principal
    if (!window.confirm('AVISO: Excluir este aluno apagará todos os treinos vinculados. Confirmar?')) return;

    try {
      await supabase.from('workouts').delete().eq('student_id', id);
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert('ERRO NO BANCO: ' + err.message);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <span className="meta-label">Gestão de Alunos</span>
          <h1 className="editorial-title text-6xl md:text-8xl mt-4">
            BASE DE<br /><span className="text-primary">ALUNOS</span>
          </h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-on-primary px-8 py-4 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 shadow-xl hover:brightness-110 active:scale-95 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          Adicionar Novo Aluno
        </button>
      </section>

      {/* Tabs para Ativos/Arquivados */}
      <div className="flex gap-4 border-b border-white/5">
        <button
          onClick={() => setActiveTab('ativos')}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'ativos' ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Alunos Ativos
        </button>
        <button
          onClick={() => setActiveTab('arquivados')}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'arquivados' ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          Arquivados
        </button>
      </div>

      <section className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
          <Search size={20} />
        </div>
        <input 
          className="w-full bg-surface-container-highest thin-border py-5 pl-12 pr-4 text-on-surface placeholder:text-white/20 focus:ring-1 focus:ring-primary/30 transition-all outline-none text-xs font-bold uppercase tracking-widest" 
          placeholder="Buscar por nome ou e-mail..." 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </section>

      <div className="bg-surface-container-low thin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Aluno</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Lesão</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Objetivo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden thin-border shrink-0 flex items-center justify-center">
                          {student.img && student.img !== "" ? (
                            <img className="w-full h-full object-cover" src={student.img} alt={student.name} referrerPolicy="no-referrer" />
                          ) : (
                            <User size={20} className="text-gray-400" />
                          )}
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight text-on-surface">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {student.lesao ? (
                          <span className="text-[10px] font-bold uppercase tracking-tight text-error bg-error/10 px-2 py-1 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {student.lesao}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/40 italic">Sem lesão</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Activity size={12} />
                        {student.goal}
                      </span>
                    </td>
    <td className="px-6 py-4">
      <span className={cn(
        "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1",
        student.status?.toLowerCase() === 'ativo' ? "bg-primary/10 text-primary" : "bg-white/5 text-white/30"
      )}>
        {student.status}
      </span>
    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => onSelectStudent(student.id, 'relatorios')}
                          className="p-2 text-white/40 hover:text-primary transition-colors"
                          title="Visualizar Relatórios"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => onSelectStudent(student.id, 'avaliacao')}
                          className="p-2 text-white/40 hover:text-primary transition-colors"
                          title="Expandir Avaliação"
                        >
                          <Dumbbell size={16} />
                        </button>
                        <button 
                          onClick={() => onSelectStudent(student.id, 'prescricao')}
                          className="p-2 text-white/40 hover:text-[#C5A07D] transition-colors"
                          title="Ação Rápida (Raio)"
                        >
                          <Zap size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(student)}
                          className="p-2 text-white/40 hover:text-secondary transition-colors"
                          title="Editar Cadastro"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD Unificado */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container thin-border accent-square shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center p-8 border-b border-white/5 shrink-0 bg-surface-container z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <form onSubmit={handleSave} className="space-y-10">
                  {/* Upload de Foto no Topo */}
                  <div className="flex flex-col items-center gap-6 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Foto do Aluno</span>
                    
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full border-4 border-[#C5A07D]/20 p-1 group-hover:border-[#C5A07D]/40 transition-all duration-500 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                        {formData.img && formData.img !== "" ? (
                          <img src={formData.img} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={56} className="text-white/10" />
                        )}
                      </div>
                      
                      <label 
                        className="absolute bottom-1 right-1 w-12 h-12 bg-[#C5A07D] text-black rounded-full flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-surface-container"
                        title="Fazer upload da foto"
                      >
                        <Camera size={20} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('student-photo-upload')?.click()}
                        className="text-[10px] font-black uppercase tracking-widest text-[#C5A07D] border border-[#C5A07D]/20 px-8 py-3 rounded-full hover:bg-[#C5A07D] hover:text-black transition-all"
                      >
                        {formData.img ? 'Trocar Foto' : 'Selecionar Foto'}
                      </button>
                      <input 
                        id="student-photo-upload"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                      {formData.img && (
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, img: ''})}
                          className="text-[8px] font-bold text-error/60 uppercase tracking-widest hover:text-error mt-2 transition-colors"
                        >
                          Remover Foto
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Nome Completo</label>
                      <input 
                        required
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-sm transition-all rounded-xl"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Data de Nascimento</label>
                      <input 
                        type="date"
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-sm transition-all rounded-xl appearance-none"
                        value={formData.birthDate || ''}
                        onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Objetivo</label>
                      <input 
                        required
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-sm transition-all rounded-xl"
                        value={formData.goal || ''}
                        onChange={(e) => setFormData({...formData, goal: e.target.value})}
                        placeholder="Ex: Hipertrofia, Emagrecimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Frequência</label>
                      <input 
                        required
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-sm transition-all rounded-xl"
                        value={formData.freq || ''}
                        onChange={(e) => setFormData({...formData, freq: e.target.value})}
                        placeholder="Ex: 3x por semana"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">WhatsApp</label>
                      <input 
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-sm transition-all rounded-xl"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Ex: 5511999999999"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">E-mail</label>
                      <input 
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-sm transition-all rounded-xl"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="Ex: aluno@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Senha (Opcional)</label>
                      <input 
                        type="text"
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-sm transition-all rounded-xl"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Vazio para gerar automático"
                      />
                    </div>
                    {generatedPassword && (
                      <div className="col-span-full border border-primary/20 bg-primary/5 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Texto de Boas-Vindas (Copie)</p>
                          <button 
                            type="button"
                            onClick={() => {
                              const text = `Olá, ${formData.name}! Seu perfil foi criado.\n\nAcesso: ${formData.email} / Senha: ${generatedPassword}\nLink: https://app-sa-de-constru-o-v56.vercel.app/\n\nAtenciosamente, ${trainerProfile.full_name} (NEXO)`;
                              navigator.clipboard.writeText(text);
                              toast.success("Copiado!");
                            }}
                            className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-all"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <p className="text-[11px] leading-relaxed text-white font-manrope whitespace-pre-wrap">
                            Olá, <span className="text-primary">{formData.name}</span>! Seu perfil foi criado.{"\n"}
                            Acesso: <span className="text-primary">{formData.email}</span> / Senha: <span className="text-primary">{generatedPassword}</span>{"\n"}
                            Link: <span className="text-primary underline">https://app-sa-de-constru-o-v56.vercel.app/</span>{"\n"}
                            Atenciosamente, {trainerProfile.full_name} (NEXO)
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Status</label>
                      <select 
                        className="w-full bg-surface-container-highest thin-border p-4 focus:ring-1 focus:ring-[#C5A07D]/30 text-on-surface outline-none text-xs font-bold uppercase tracking-widest appearance-none transition-all rounded-xl"
                        value={formData.status.toLowerCase()}
                        onChange={(e) => setFormData({...formData, status: e.target.value.toLowerCase()})}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-8 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Histórico de Lesões</label>
                        <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                          <Zap size={10} className="text-primary" />
                          <span className="text-[7px] font-black uppercase tracking-widest text-primary">IA Integrada</span>
                        </div>
                      </div>
                      <textarea 
                        className="w-full bg-surface-container-highest thin-border p-5 focus:ring-1 focus:ring-[#C5A07D]/30 min-h-[120px] text-on-surface outline-none text-sm transition-all rounded-2xl resize-none"
                        value={formData.lesao}
                        onChange={(e) => setFormData({...formData, lesao: e.target.value})}
                        placeholder="Ex: Hérnia de disco, Lesão no manguito..."
                      ></textarea>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Observações / Anamnese</label>
                      <textarea 
                        className="w-full bg-surface-container-highest thin-border p-5 focus:ring-1 focus:ring-[#C5A07D]/30 min-h-[120px] text-on-surface outline-none text-sm transition-all rounded-2xl resize-none"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                        placeholder="Outras informações relevantes..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-8 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant border border-white/10 hover:bg-white/5 transition-all rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-[2] bg-[#C5A07D] text-black py-5 font-black uppercase tracking-[0.3em] text-[11px] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#C5A07D]/20 disabled:opacity-50 rounded-xl flex items-center justify-center gap-3"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingStudent ? <Check size={18} /> : <Plus size={18} />)}
                      {editingStudent ? 'SALVAR ALTERAÇÕES' : 'SALVAR ALUNO'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Assessment: React.FC<{ 
  studentId: string | null, 
  onSelectStudent: (id: string) => void, 
  setActiveTab: (tab: string) => void,
  onSaveSuccess: () => void 
}> = ({ studentId, onSelectStudent, setActiveTab, onSaveSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [studentInjury, setStudentInjury] = useState('');
  const [studentGoal, setStudentGoal] = useState('');
  const [studentObservations, setStudentObservations] = useState('');

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const initialFormState = {
    weight: 0,
    height: 0,
    age: 0,
    gender: 'male',
    folds: {
      peitoral: 0,
      abdominal: 0,
      suprailiaca: 0,
      tricipital: 0,
      subescapular: 0,
      coxa: 0,
      axilarMedia: 0
    },
    perimeters: {
      torax: 0,
      cintura: 0,
      abdomen: 0,
      bracoDir: 0,
      bracoEsq: 0,
      coxaDir: 0,
      coxaEsq: 0,
      panturrilhaDir: 0,
      panturrilhaEsq: 0
    },
    posture_data: {
      anterior: { photoUrl: '', deviations: [] },
      posterior: { photoUrl: '', deviations: [] },
      lateralDir: { photoUrl: '', deviations: [] },
      lateralEsq: { photoUrl: '', deviations: [] },
      diagnosis: '',
    },
    cardio_data: {
      resting_hr: 0,
      resting_bp_systolic: 0,
      resting_bp_diastolic: 0,
      protocol: 'cooper',
      distance: 0,
      time: '',
      final_hr: 0,
      step_hr: 0,
      vo2_max: 0,
      classification: '---'
    }
  };

  // Form State
  const [formData, setFormData] = useState(initialFormState);
  const [assessmentTab, setAssessmentTab] = useState('composicao');

  // Fetch student name and evaluation for selected date
  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setSelectedStudentName(null);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch student directly to support archived ones in view-only mode
        const { data: student, error: sError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .maybeSingle();
          
        if (student) {
          const mappedStudent = {
            id: student.id,
            name: student.name,
            goal: student.goal,
            freq: student.frequency,
            status: student.status,
            img: student.image_url,
            lesao: student.lesao,
            observacoes: student.observacoes,
            birthDate: student.birth_date
          };
          setSelectedStudentName(mappedStudent.name);
          setStudentInjury(mappedStudent.lesao || '');
          setStudentGoal(mappedStudent.goal || '');
          setStudentObservations(mappedStudent.observacoes || '');
          
          const age = calculateAge(mappedStudent.birthDate || '');
          setFormData(prev => ({ 
            ...prev, 
            age: age > 0 ? age : 25,
            gender: 'male' 
          }));
        } else {
          setSelectedStudentName(null);
        }

        // Get evaluation for selected date
        const specific = await dataService.getEvaluationByDate(studentId, evaluationDate);
        if (specific) {
          const mergedPostureData = {
            anterior: { photoUrl: '', deviations: [], ...(specific.posture_data?.anterior || {}) },
            posterior: { photoUrl: '', deviations: [], ...(specific.posture_data?.posterior || {}) },
            lateralDir: { photoUrl: '', deviations: [], ...(specific.posture_data?.lateralDir || {}) },
            lateralEsq: { photoUrl: '', deviations: [], ...(specific.posture_data?.lateralEsq || {}) },
            diagnosis: specific.posture_data?.diagnosis || ''
          };

          setFormData(prev => ({
            ...prev,
            weight: specific.weight,
            height: specific.height,
            folds: specific.folds as any,
            perimeters: specific.perimeters as any,
            posture_data: mergedPostureData,
            cardio_data: specific.cardio_data as any || prev.cardio_data
          }));
        } else {
          // Reset data fields but keep personal info
          setFormData(prev => ({
            ...initialFormState,
            age: prev.age,
            gender: prev.gender
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, evaluationDate]);

  // Search logic
  useEffect(() => {
    const searchStudents = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const allStudents = await dataService.getStudents('ativo'); // Apenas ativos na busca de avaliação
        const filtered = allStudents.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('Error searching students:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchStudents, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (student: Student) => {
    onSelectStudent(student.id);
    setSelectedStudentName(student.name);
    setStudentInjury(student.lesao || '');
    setStudentGoal(student.goal || '');
    setStudentObservations(student.observacoes || '');
    setFormData(prev => ({ 
      ...prev, 
      age: 0, 
      gender: 'male'
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const sections = [
    { id: 'anamnese', label: '1. Anamnese', icon: FileText },
    { id: 'composicao', label: '2. Composição', icon: Scale },
    { id: 'medidas', label: '3. Medidas', icon: Ruler },
    { id: 'postural', label: '4. Postural', icon: Eye },
  ];

  // Calculations
  const bmi = (() => {
    if (formData.weight <= 0 || formData.height <= 0) return 0;
    // Standardize height to meters (if > 3 assume cm)
    const heightInMeters = formData.height > 3 ? formData.height / 100 : formData.height;
    return formData.weight / (heightInMeters * heightInMeters);
  })();
  
  const getBMICategory = (val: number) => {
    if (!val || isNaN(val) || val === Infinity) return { label: '---', color: 'text-white/20', pos: '0%' };
    
    // User requested mapping: 18 = 0%, 40 = 100%
    const calculatePos = (v: number) => {
      const min = 18;
      const max = 40;
      const p = ((v - min) / (max - min)) * 100;
      return `${Math.min(Math.max(p, 0), 98)}%`;
    };

    const pos = calculatePos(val);
    if (val < 18.5) return { label: 'Abaixo do Peso', color: 'text-blue-500', pos };
    if (val < 25) return { label: 'Normal', color: 'text-green-500', pos };
    if (val < 30) return { label: 'Sobrepeso', color: 'text-yellow-500', pos };
    if (val < 35) return { label: 'Obesidade', color: 'text-orange-500', pos };
    return { label: 'Obesidade Severa', color: 'text-red-600', pos };
  };

  const bmiCat = getBMICategory(bmi);

  const calculateBodyFat = () => {
    const { folds, age, gender } = formData;
    const sum7 = Object.values(folds).reduce((a: number, b) => {
      const val = Number(b);
      return a + (isNaN(val) ? 0 : val);
    }, 0);
    
    if (sum7 === 0 || age <= 0) return 0;

    let bd = 0;
    const s7 = sum7 as number;
    const a = age as number;
    
    if (gender === 'female') {
      bd = 1.097 - (0.00046971 * s7) + (0.00000056 * Math.pow(s7, 2)) - (0.00012828 * a);
    } else {
      bd = 1.112 - (0.00043499 * s7) + (0.00000055 * Math.pow(s7, 2)) - (0.00028826 * a);
    }

    if (bd <= 0) return 0;
    const fatPercent = ((4.95 / bd) - 4.50) * 100;
    return Math.max(0, isNaN(fatPercent) ? 0 : fatPercent);
  };

  const bodyFat = calculateBodyFat();
  const fatMass = formData.weight > 0 ? formData.weight * (bodyFat / 100) : 0;
  const leanMass = formData.weight > 0 ? formData.weight - fatMass : 0;

  const handleSave = async () => {
    if (!studentId) {
      alert('Por favor, selecione um aluno na base de alunos primeiro.');
      return;
    }

    // Strict validation for weight and height
    if (formData.weight <= 0 || formData.height <= 0) {
      alert('Peso e Altura devem ser maiores que zero para salvar a avaliação.');
      return;
    }

    setIsSaving(true);
    try {
      // Update student anamnese if changed
      await dataService.updateStudent(studentId, { 
        lesao: studentInjury,
        goal: studentGoal,
        observacoes: studentObservations
      });

      await dataService.addEvaluation({
        student_id: studentId,
        weight: formData.weight,
        height: formData.height,
        bmi: Number(bmi.toFixed(2)),
        body_fat: Number(bodyFat.toFixed(2)),
        fat_mass: Number(fatMass.toFixed(2)),
        lean_mass: Number(leanMass.toFixed(2)),
        folds: formData.folds,
        perimeters: formData.perimeters,
        posture_data: formData.posture_data,
        cardio_data: formData.cardio_data,
        evaluation_date: evaluationDate // Pass the selected date
      });
      
      setIsSaving(false);
      setSaveSuccess(true);
      if (onSaveSuccess) onSaveSuccess();
      
      // Keep on same tab as requested
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      // Reset form or other logic if needed
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 sm:space-y-16"
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 sm:gap-8">
        <div className="flex-1 w-full">
          <span className="meta-label">Protocolo Elite</span>
          <h1 className="editorial-title text-[28px] sm:text-4xl md:text-8xl mt-2 sm:mt-4 leading-[1.1] sm:leading-none">AVALIAÇÃO<br className="hidden sm:block" /> FÍSICA</h1>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-8 sm:mt-12 bg-white dark:bg-zinc-900 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl w-full lg:w-fit border border-gray-100 dark:border-white/5 items-center">
            <div className="flex bg-gray-50 dark:bg-black rounded-lg sm:rounded-xl border border-gray-100 dark:border-white/5 p-1 w-full sm:w-auto">
              <button 
                onClick={() => setAssessmentTab('composicao')}
                className={cn(
                  "flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all rounded-md sm:rounded-lg",
                  assessmentTab === 'composicao' ? "bg-primary text-black shadow-lg" : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                Composição
              </button>
              <button 
                onClick={() => setAssessmentTab('postural')}
                className={cn(
                  "flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all rounded-md sm:rounded-lg",
                  assessmentTab === 'postural' ? "bg-primary text-black shadow-lg" : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                Postural
              </button>
              <button 
                onClick={() => setAssessmentTab('cardio')}
                className={cn(
                  "flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all rounded-md sm:rounded-lg",
                  assessmentTab === 'cardio' ? "bg-primary text-black shadow-lg" : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                Cardio
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-lg sm:rounded-xl border border-gray-100 dark:border-white/5 p-1 w-full sm:w-auto">
              <Calendar size={12} className="ml-2 sm:ml-3 text-primary" />
              <input 
                type="date" 
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="bg-transparent border-none text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary focus:ring-0 outline-none p-2 cursor-pointer flex-1 sm:flex-none"
              />
            </div>
          </div>

          {/* Student Search & Selection */}
          <div className="mt-8 sm:mt-12 max-w-xl relative">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none text-gray-400 dark:text-white/20 group-focus-within:text-primary transition-colors">
                <Search size={18} className="sm:size-5" />
              </div>
              <input 
                className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 py-4 sm:py-5 pl-10 sm:pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:ring-1 focus:ring-primary/30 transition-all outline-none text-[9px] sm:text-xs font-bold uppercase tracking-widest rounded-xl" 
                placeholder="Buscar aluno para avaliação..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin"></div>
                </div>
              )}
            </div>

            {/* Dropdown Results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-2xl max-h-60 overflow-y-auto rounded-xl"
                >
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-primary/10 transition-colors text-left border-b border-gray-100 dark:border-white/5 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-white/5 shrink-0 flex items-center justify-center">
                        {student.img && student.img !== "" ? (
                          <img className="w-full h-full object-cover" src={student.img} alt={student.name} referrerPolicy="no-referrer" />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">{student.goal}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Student Display */}
            {selectedStudentName && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-6 flex items-center gap-4 bg-primary/5 border border-primary/20 p-4 border-l-4 border-l-primary rounded-r-xl"
              >
                <div className="w-12 h-12 bg-primary/20 flex items-center justify-center border border-primary/30 text-primary rounded-lg">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Aluno Selecionado</p>
                  <p className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">{selectedStudentName}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <AnimatePresence>
          {saveSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-primary/10 border border-primary/20 p-4 flex items-center gap-3 text-primary rounded-xl"
            >
              <Check size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Avaliação Salva com Sucesso</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 space-y-12">
          {assessmentTab === 'composicao' && (
            <div className="space-y-12">
              {/* Section 1: Anamnese */}
              <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                  <div className="h-6 sm:h-10 w-1 bg-primary rounded-full"></div>
                  <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Histórico (Anamnese)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  <div className="space-y-2 sm:space-y-4">
                    <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/40">Objetivo Principal</label>
                    <input 
                      className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-3 sm:p-4 focus:ring-1 focus:ring-primary/30 text-gray-900 dark:text-white outline-none text-xs sm:text-sm rounded-lg sm:rounded-xl"
                      value={studentGoal}
                      onChange={(e) => setStudentGoal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-4">
                    <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/40">Lesões Prévias</label>
                    <input 
                      className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-3 sm:p-4 focus:ring-1 focus:ring-primary/30 text-gray-900 dark:text-white outline-none text-xs sm:text-sm rounded-lg sm:rounded-xl"
                      value={studentInjury}
                      onChange={(e) => setStudentInjury(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-4 col-span-full">
                    <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/40">Observações e Histórico Detalhado</label>
                    <textarea 
                      className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-4 sm:p-6 focus:ring-1 focus:ring-primary/30 min-h-[120px] sm:min-h-[150px] text-gray-900 dark:text-white outline-none text-xs sm:text-sm leading-relaxed rounded-xl sm:rounded-2xl resize-none" 
                      placeholder="Descreva cirurgias, lesões prévias or condições crônicas..."
                      value={studentObservations}
                      onChange={(e) => setStudentObservations(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </section>

              {/* Section 2: Composição */}
              <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                  <div className="h-6 sm:h-10 w-1 bg-primary rounded-full"></div>
                  <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Composição Corporal</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  <div className="bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-4 sm:p-6 relative overflow-hidden rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-white/40 mb-2 sm:mb-4">Peso (kg)</p>
                    <input 
                      className="w-full bg-transparent border-none p-0 text-2xl sm:text-4xl font-black text-primary focus:ring-0 outline-none tracking-tighter" 
                      type="number" 
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({...formData, weight: e.target.value === '' ? 0 : Number(e.target.value)})}
                      step="0.1"
                      placeholder="00.0"
                    />
                  </div>
                  <div className="bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-4 sm:p-6 relative overflow-hidden rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-white/40 mb-2 sm:mb-4">Altura (m)</p>
                    <input 
                      className="w-full bg-transparent border-none p-0 text-2xl sm:text-4xl font-black text-primary focus:ring-0 outline-none tracking-tighter" 
                      type="number" 
                      value={formData.height || ''}
                      onChange={(e) => setFormData({...formData, height: e.target.value === '' ? 0 : Number(e.target.value)})}
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-4 sm:p-6 relative overflow-hidden rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-white/40 mb-2 sm:mb-4">Idade</p>
                    <input 
                      className="w-full bg-transparent border-none p-0 text-2xl sm:text-4xl font-black text-primary focus:ring-0 outline-none tracking-tighter" 
                      type="number" 
                      value={formData.age || ''}
                      onChange={(e) => setFormData({...formData, age: e.target.value === '' ? 0 : Number(e.target.value)})}
                      placeholder="00"
                    />
                  </div>
                  <div className="bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-4 sm:p-6 flex flex-col justify-center rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-white/40 mb-2 sm:mb-4">Gênero</p>
                    <div className="flex gap-1 sm:gap-2 bg-white dark:bg-zinc-900 p-0.5 sm:p-1 rounded-lg border border-gray-100 dark:border-white/5">
                      <button 
                        onClick={() => setFormData({...formData, gender: 'male'})}
                        className={cn(
                          "flex-1 py-1.5 sm:py-2 text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all rounded-[4px] sm:rounded",
                          formData.gender === 'male' ? "bg-primary text-black" : "text-gray-400 dark:text-white/40"
                        )}
                      >
                        Masc
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, gender: 'female'})}
                        className={cn(
                          "flex-1 py-1.5 sm:py-2 text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all rounded-[4px] sm:rounded",
                          formData.gender === 'female' ? "bg-primary text-black" : "text-gray-400 dark:text-white/40"
                        )}
                      >
                        Fem
                      </button>
                    </div>
                  </div>
                </div>

                {/* IMC Gauge */}
                <div className="mb-8 sm:mb-12 bg-gray-50/50 dark:bg-black/30 p-5 sm:p-8 border border-gray-100 dark:border-white/5 rounded-[24px] sm:rounded-[32px]">
                  <div className="flex justify-between items-end mb-4 sm:mb-6">
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">Índice de Massa Corporal (IMC)</p>
                      <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mt-1 sm:mt-2">{bmi.toFixed(1)} <span className={cn("text-[9px] sm:text-sm font-bold uppercase tracking-widest ml-2", bmiCat.color)}>{bmiCat.label}</span></p>
                    </div>
                    <Activity className="text-primary size-6 sm:size-8" />
                  </div>
                  <div className="relative h-3 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden flex">
                    <div className="h-full w-[46.25%] bg-blue-500/30 border-r border-white dark:border-black" />
                    <div className="h-full w-[16.25%] bg-green-500/30 border-r border-white dark:border-black" />
                    <div className="h-full w-[12.5%] bg-yellow-500/30 border-r border-white dark:border-black" />
                    <div className="h-full w-[12.5%] bg-orange-500/30 border-r border-white dark:border-black" />
                    <div className="h-full flex-1 bg-red-600/30" />
                    
                    <motion.div 
                      initial={{ left: 0 }}
                      animate={{ left: bmiCat.pos }}
                      className="absolute top-0 bottom-0 w-1 bg-[#C5A07D] shadow-[0_0_15px_rgba(197,160,125,0.8)] z-10"
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-white/20">
                    <span>18.5</span>
                    <span>25.0</span>
                    <span>30.0</span>
                    <span>35.0</span>
                    <span>40.0</span>
                  </div>
                </div>

                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/40 mb-4 sm:mb-8">Dobras Cutâneas (mm) - Pollock 7 Dobras</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                  {[
                    { id: 'peitoral', label: 'Peitoral' },
                    { id: 'abdominal', label: 'Abdominal' },
                    { id: 'suprailiaca', label: 'Suprailíaca' },
                    { id: 'tricipital', label: 'Tricipital' },
                    { id: 'subescapular', label: 'Subescapular' },
                    { id: 'coxa', label: 'Coxa' },
                    { id: 'axilarMedia', label: 'Axilar Média' },
                  ].map((fold) => (
                    <div key={fold.id} className="space-y-1.5 sm:space-y-3">
                      <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">{fold.label}</label>
                      <input 
                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-2.5 sm:p-4 focus:ring-1 focus:ring-primary/30 outline-none text-xs font-bold text-gray-900 dark:text-white rounded-lg sm:rounded-xl" 
                        type="number" 
                        value={formData.folds[fold.id as keyof typeof formData.folds] || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          folds: { ...formData.folds, [fold.id]: e.target.value === '' ? 0 : Number(e.target.value) }
                        })}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>

                {/* Results Visualization */}
                <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div className="bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-6 sm:p-8 flex flex-col justify-center items-center rounded-2xl sm:rounded-3xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-6 sm:mb-8">% Gordura Corporal</p>
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-white/5 sm:hidden" />
                        <motion.circle 
                          cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" 
                          strokeDasharray="351.8"
                          initial={{ strokeDashoffset: 351.8 }}
                          animate={{ strokeDashoffset: 351.8 - (351.8 * bodyFat) / 100 }}
                          className="text-primary sm:hidden"
                        />
                        {/* Desktop Circle */}
                        <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-white/5 hidden sm:block" />
                        <motion.circle 
                          cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" 
                          strokeDasharray="440"
                          initial={{ strokeDashoffset: 440 }}
                          animate={{ strokeDashoffset: 440 - (440 * bodyFat) / 100 }}
                          className="text-primary hidden sm:block"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-2xl sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{bodyFat.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-6 sm:mb-8">Distribuição de Massa</p>
                    <div className="space-y-6 sm:space-y-8">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 flex items-center justify-center border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl">
                          <Activity className="text-primary size-4 sm:size-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1 sm:mb-2">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Massa Magra</span>
                            <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">{leanMass.toFixed(1)} kg</span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${formData.weight > 0 ? (leanMass / formData.weight) * 100 : 0}%` }}
                              className="bg-primary h-full"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 flex items-center justify-center border border-gray-100 dark:border-white/5 rounded-lg sm:rounded-xl">
                          <TrendingUp className="text-red-500 size-4 sm:size-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1 sm:mb-2">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Massa Gorda</span>
                            <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">{fatMass.toFixed(1)} kg</span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${formData.weight > 0 ? (fatMass / formData.weight) * 100 : 0}%` }}
                              className="bg-red-500 h-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Perímetros */}
              <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                  <div className="h-6 sm:h-10 w-1 bg-primary rounded-full"></div>
                  <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Perímetros (Medidas)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 sm:gap-x-16 gap-y-4 sm:gap-y-8">
                  {[
                    { id: 'torax', label: 'Tórax' },
                    { id: 'cintura', label: 'Cintura' },
                    { id: 'abdomen', label: 'Abdômen' },
                    { id: 'bracoDir', label: 'Braço Direito' },
                    { id: 'bracoEsq', label: 'Braço Esquerdo' },
                    { id: 'coxaDir', label: 'Coxa Direita' },
                    { id: 'coxaEsq', label: 'Coxa Esquerda' },
                    { id: 'panturrilhaDir', label: 'Panturrilha Direita' },
                    { id: 'panturrilhaEsq', label: 'Panturrilha Esquerda' },
                  ].map((p) => (
                    <div key={p.id} className="flex items-center justify-between group border-b border-gray-100 dark:border-white/5 pb-2 sm:pb-4">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white group-hover:text-primary transition-colors">{p.label}</span>
                    <input 
                      className="w-20 sm:w-28 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-2 sm:p-3 text-right font-black text-primary focus:ring-1 focus:ring-primary/30 outline-none text-xs sm:text-sm rounded-lg sm:rounded-xl" 
                      type="number" 
                      value={formData.perimeters[p.id as keyof typeof formData.perimeters] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        perimeters: { ...formData.perimeters, [p.id]: e.target.value === '' ? 0 : Number(e.target.value) }
                      })}
                      placeholder="0"
                    />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {assessmentTab === 'postural' && (
            <div className="space-y-12">
              {/* Specialized Postural Tab */}
              <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 p-10 rounded-[40px] shadow-sm">
                <PosturalEvaluation 
                  data={formData.posture_data} 
                  onChange={(posture_data) => setFormData({ ...formData, posture_data })} 
                />
              </section>
            </div>
          )}

          {assessmentTab === 'cardio' && (
            <div className="space-y-12">
              <CardioEvaluation 
                data={formData.cardio_data}
                age={formData.age}
                gender={formData.gender as 'male' | 'female'}
                weight={formData.weight}
                onChange={(data: CardioData) => setFormData(prev => ({ ...prev, cardio_data: data }))}
              />
            </div>
          )}

          <div className="flex justify-end pt-8 sm:pt-12">
            <button 
              onClick={handleSave}
              disabled={isSaving || !studentId}
              className={cn(
                "w-full sm:w-auto bg-primary text-on-primary px-8 sm:px-16 py-4 sm:py-5 font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] hover:brightness-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3",
                (isSaving || !studentId) && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent animate-spin"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Avaliação'
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Reports: React.FC<{ studentId: string | null }> = ({ studentId }) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [history, setHistory] = useState<Evaluation[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const [latest, studentResponse, allHistory] = await Promise.all([
          dataService.getLatestEvaluation(studentId),
          supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
          dataService.getEvaluationsHistory(studentId)
        ]);
        
        const s = studentResponse.data;
        if (s) {
          setStudent({
            id: s.id,
            name: s.name,
            goal: s.goal,
            freq: s.frequency,
            status: s.status,
            img: s.image_url,
            lesao: s.lesao,
            observacoes: s.observacoes,
            birthDate: s.birth_date
          } as Student);
        }
        
        setHistory(allHistory);
        
                if (latest) {
          setEvaluation(latest);
          setSelectedDate(latest.evaluation_date);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const handleDateChange = (date: string) => {
    const ev = history.find(h => h.evaluation_date === date);
    if (ev) setEvaluation(ev);
    setSelectedDate(date);
  };

  return (
    <div className="space-y-8">
      {history.length > 0 && (
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-white/5 no-print rounded-2xl shadow-sm dark:shadow-none">
          <Calendar size={18} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Data da Avaliação:</span>
          <select 
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2 text-[10px] font-black uppercase tracking-widest text-primary focus:ring-1 focus:ring-primary outline-none rounded-lg"
          >
            {[...history].reverse().map(h => {
              const dateStr = h.evaluation_date;
              return (
                <option key={h.id} value={dateStr}>
                  {new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')}
                </option>
              );
            })}
          </select>
        </div>
      )}
      <ReportCenter student={student} evaluation={evaluation} history={history} loading={loading} />
    </div>
  );
};

// --- Main App ---

// --- Components ---

const BottomNav: React.FC<{ activeTab: string, setActiveTab: (tab: string) => void }> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
    { id: 'alunos', icon: Users, label: 'Alunos' },
    { id: 'avaliacao', icon: BarChart3, label: 'Análise' },
    { id: 'prescricao', icon: ClipboardList, label: 'Treino' },
    { id: 'relatorios', icon: FileText, label: 'Relats' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-gray-200 dark:border-white/5 flex items-center justify-around p-2.5 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-1 transition-all rounded-xl",
            activeTab === item.id ? "text-primary bg-primary/5" : "text-gray-400 dark:text-white/20 active:bg-gray-100 dark:active:bg-white/5"
          )}
        >
          <item.icon size={18} className={cn("transition-transform", activeTab === item.id && "scale-110")} />
          <span className={cn(
            "text-[7px] font-black uppercase tracking-widest",
            activeTab === item.id ? "text-primary" : "text-gray-400 dark:text-white/30"
          )}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<'trainer' | 'student' | 'owner' | null>(() => {
    const demo = localStorage.getItem('nexo_demo_auth');
    if (demo === 'student') return 'student';
    if (demo === 'trainer') return 'trainer';
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('[LOADING TIMEOUT FORÇADO] O carregamento excedeu 3s, liberando UI.');
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [viewMode, setViewMode] = useState<'trainer' | 'student'>(() => {
    const demo = localStorage.getItem('nexo_demo_auth');
    return demo === 'student' ? 'student' : 'trainer';
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    return localStorage.getItem('nexo_student_id');
  });
  const [studentStatus, setStudentStatus] = useState<'ativo' | 'pendente' | 'recusado' | null>(null);
  const [highlightedJoint, setHighlightedJoint] = useState<string | null>(null);
  const [reportVersion, setReportVersion] = useState(0);
  const [refreshStudentsTrigger, setRefreshStudentsTrigger] = useState(0);
  const [trainerProfile, setTrainerProfile] = useState<any>({
    id: '',
    full_name: 'Treinador NEXO',
    img: 'https://lh3.googleusercontent.com/pw/AP1GczPrvN_N_X-sM0m_V_F_V_F_V_F_V_F_V_F_V_F_V_F_V=w200-h200-no'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // Estados de Gestão de Alunos (Lifted for global access)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const initialFormState = {
    name: '',
    goal: '',
    freq: '',
    status: 'ativo',
    img: '',
    phone: '',
    lesao: '',
    observacoes: '',
    birthDate: '',
    email: '',
    password: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    let notifChannel: any = null;
    let studentsChannel: any = null;

    const fetchData = async () => {
      const isTrainer = userRole === 'trainer';
      const hasAuth = !!session || localStorage.getItem('nexo_demo_auth') === 'trainer';

      if (hasAuth && isTrainer) {
        const [profile, pending, notifs] = await Promise.all([
          dataService.getTrainerSubscription(),
          dataService.getPendingStudents(),
          dataService.getNotifications()
        ]);

        if (profile) setTrainerProfile(profile);
        
        console.log('[TEST FLOW] pending students', pending);
        setPendingStudents(pending);
        setNotifications(notifs);

        // Realtime Notifications - ignore in demo mode
        if (!isDemoMode && profile && profile.id) {
          // Remove any existing channels with the same name to avoid "already subscribed" error
          supabase.removeChannel(supabase.channel(`notifications-${profile.id}`));
          supabase.removeChannel(supabase.channel(`pending-students-${profile.id}`));

          notifChannel = supabase
            .channel(`notifications-${profile.id}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `professor_id=eq.${profile.id}`
            }, (payload) => {
              setNotifications(prev => [payload.new, ...prev]);
              toast.info('Nova notificação recebida!');
            })
            .subscribe();

          studentsChannel = supabase
            .channel(`pending-students-${profile.id}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'students',
              filter: `professor_id=eq.${profile.id}`
            }, async () => {
              const pending = await dataService.getPendingStudents();
              setPendingStudents(pending);
              setRefreshStudentsTrigger(prev => prev + 1);
            })
            .subscribe();
        }
      }
    };
    fetchData();

    return () => {
      if (notifChannel) {
        supabase.removeChannel(notifChannel);
      }
      if (studentsChannel) {
        supabase.removeChannel(studentsChannel);
      }
    };
  }, [session, userRole]);

  const handleStudentAction = async (id: string, action: 'aprovar' | 'recusar') => {
    const student = pendingStudents.find(s => s.id === id);
    if (!student) return;

    try {
      if (action === 'aprovar') {
        console.log(`[APPROVE STUDENT] ativando student`);
        
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({
            status: 'ativo'
          })
          .eq('id', id);

        if (studentUpdateError) throw studentUpdateError;

        // Finalização
        setPendingStudents(prev => prev.filter(s => s.id !== id));
        setRefreshStudentsTrigger(prev => prev + 1);
        toast.success("Aluno aprovado com sucesso.");
      } else {
        // Recusar
        await dataService.rejectStudent(id);
        setPendingStudents(prev => prev.filter(s => s.id !== id));
        setRefreshStudentsTrigger(prev => prev + 1);
        toast.info("Solicitação recusada.");
        console.log('[TEST FLOW] student rejected', id);
      }
    } catch (error: any) {
      console.error('[APPROVE STUDENT] erro:', error);
      toast.error(`Erro ao ${action} aluno: ` + (error.message || 'Erro inesperado'));
    }
  };

  const handleInviteClick = async () => {
    try {
      // 1. Chamar RPC ao clicar no botão para garantir o perfil mais atualizado
      const trainer = await dataService.ensureTrainerProfile();
      
      if (!trainer || !trainer.id) {
        console.error('[COPY LINK ERROR] Perfil retornado sem ID ou nulo');
        toast.error("Não foi possível gerar o link do professor.");
        return;
      }

      // [FREE PLAN BLOCK] Verificação de limite
      if (trainer.plan === 'free') {
        const { data: students, error: countError } = await supabase
          .from('students')
          .select('status')
          .eq('professor_id', trainer.id)
          .or('status.ilike.pendente,status.ilike.ativo');
        
        console.log('[FREE PLAN BLOCK] trainer.id:', trainer.id);
        console.log('[FREE PLAN BLOCK] trainer.plan:', trainer.plan);
        console.log('[FREE PLAN BLOCK] total alunos pendentes/ativos:', students?.length || 0);

        if (!countError && (students?.length || 0) >= (trainer.student_limit || 1)) {
          console.log('[FREE PLAN BLOCK] link bloqueado');
          toast.error("Seu plano gratuito permite apenas 1 aluno. Faça upgrade para cadastrar mais alunos.");
          return;
        }
      }

      // 2. Atualizar estado local com o trainer retornado
      setTrainerProfile(trainer);

      // 3. Gerar link usando trainer.id
      const inviteLink = `${window.location.origin}/cadastro?ref=${trainer.id}`;
      console.log('[DASHBOARD] link gerado', inviteLink);
      console.log('[TEST FLOW] invite link', inviteLink);
      
      // 4. Tentar copiar para o clipboard
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(inviteLink);
        } else {
          // Fallback para ambientes sem clipboard API ou inseguros
          const textArea = document.createElement("textarea");
          textArea.value = inviteLink;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          textArea.style.top = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (!successful) throw new Error('execCommand copy failed');
        }
        
        setInviteCopied(true);
        toast.success("Link copiado com sucesso.", {
          description: "Envie para o aluno realizar o pré-cadastro."
        });
        setTimeout(() => setInviteCopied(false), 2000);
      } catch (copyError) {
        // 5. Se falhar totalmente, mostrar para cópia manual
        console.warn('[COPY WARNING] Clipboard failed, using prompt fallback', copyError);
        window.prompt("Copie o link abaixo manualmente:", inviteLink);
      }
    } catch (err: any) {
      console.error('[COPY LINK ERROR]', err);
      toast.error("Não foi possível gerar o link do professor.");
    }
  };

  const handleSaveProfile = async (updated: any) => {
    try {
      const saved = await dataService.updateTrainerProfile(updated);
      setTrainerProfile(saved);
      toast.success("Perfil profissional atualizado!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const isCheckingAuth = React.useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = React.useCallback(async () => {
    try {
      localStorage.removeItem('nexo_demo_auth');
      localStorage.removeItem('nexo_student_id');
      localStorage.removeItem('nexo-auth-v1'); // Limpeza manual do storage do Supabase
      setUserRole(null);
      setSession(null);
      if (!isDemoMode) {
        await supabase.auth.signOut().catch(e => console.warn('[AUTH] Ignorando erro de signOut:', e));
      }
    } catch (e) {
      console.warn('[AUTH] Erro ao deslogar:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkUserRole = async (userId: string, email?: string) => {
    // Rota de cadastro deve ser 100% pública
    if (window.location.pathname === '/cadastro') {
      console.log('[AUTH] Ignorando checkUserRole na rota /cadastro');
      setLoading(false);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const userEmail = email?.toLowerCase().trim();
      console.log('[AUTH] Analisando Perfil:', userId);

      // 1. Buscar na tabela profiles (Source of Truth para roles)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[AUTH] Profile encontrado:', profileData);

      // 2. Se a role for explicitamente 'student' ou houver registro em students
      const { data: studentRes } = await supabase
        .from('students')
        .select('id, email, name, status')
        .or(`id.eq.${userId},email.ilike.${userEmail || ''}`)
        .maybeSingle();

      if (profileData?.role === 'student' || studentRes) {
        console.log('[AUTH] Perfil ALUNO identificado');
        setUserRole('student');
        if (studentRes) {
          console.log(`[LOGIN STUDENT] status encontrado: ${studentRes.status}`);
          setSelectedStudentId(studentRes.id);
          setStudentStatus(studentRes.status);
          localStorage.setItem('nexo_student_id', studentRes.id);
        }
        setViewMode('student');
        localStorage.setItem('nexo_demo_auth', 'student');
        setLoading(false);
        return;
      }

      // 3. Se for Owner
      if (profileData?.role === 'owner') {
        console.log('[AUTH] Perfil OWNER identificado');
        setUserRole('owner');
        setViewMode('trainer');
        setLoading(false);
        return;
      }

      // 4. Identificação de PROFESSOR
      console.log('[AUTH] Identificando PROFESSOR');
      const profile = await dataService.ensureTrainerProfile();
      
      if (profile) {
        setUserRole('trainer');
        setViewMode('trainer');
        setTrainerProfile(profile);
        localStorage.setItem('nexo_demo_auth', 'trainer');
        console.log('SISTEMA DESTRAVADO: Trainer');
      } else {
        console.log('[AUTH] Perfil não identificado ou bloqueado');
        // Se não conseguiu garantir perfil de trainer, não forçar role
        setUserRole(null);
        handleLogout();
      }
    } catch (error) {
      console.error('[AUTH] ERRO NO checkUserRole:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = React.useCallback(async () => {
    if (isCheckingAuth.current) return;
    isCheckingAuth.current = true;

    // Rota de cadastro deve ser 100% pública
    if (window.location.pathname === '/cadastro') {
      console.log('[AUTH] Ignorando checkAuth na rota /cadastro');
      setLoading(false);
      isCheckingAuth.current = false;
      return;
    }

    try {
      console.log('[LOADING START]');
      setLoading(true);
      
      if (isDemoMode) {
        console.log('[AUTH] Operando em Modo Placeholder (Configurações pendentes)');
      }

      const demoAuth = localStorage.getItem('nexo_demo_auth');
      
      if (demoAuth) {
        console.log('[AUTH] Recuperando sessão DEMO:', demoAuth);
        setUserRole(demoAuth as any);
        setViewMode(demoAuth === 'student' ? 'student' : 'trainer');
        if (demoAuth === 'student') {
          const storedStudentId = localStorage.getItem('nexo_student_id');
          setSelectedStudentId(storedStudentId || null);
        }
        setLoading(false);
        return;
      }

      // Se estivermos em demo mode REAL (sem credenciais), não tentamos getSession para evitar "Failed to fetch"
      if (isDemoMode) {
        setSession(null);
        setLoading(false);
        return;
      }

      const { data: authData, error } = await supabase.auth.getSession();
      const currentSession = authData?.session;
      
      if (error) {
        // Se houver qualquer erro de token (inválido, expirado, não encontrado), limpamos a sessão
        const msg = error.message || '';
        if (msg.includes('Refresh Token') || msg.includes('Invalid token') || msg.includes('not found')) {
          console.warn('[AUTH] Sessão inválida ou expirada:', msg);
          await handleLogout();
          return;
        }
        throw error;
      }
      
      setSession(currentSession);
      if (currentSession) {
        await checkUserRole(currentSession.user.id, currentSession.user.email);
        console.log('[LOADING SUCCESS]');
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[LOADING ERROR] checkAuth error:', err);
      console.error('[AUTH] checkAuth error:', err);
      // Se houver erro de refresh token, limpamos tudo
      if (err.message?.includes('Refresh Token') || err.message?.includes('not found')) {
        await handleLogout();
      } else {
        // Tratamento genérico para erros de rede/fetch
        if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
           toast.error("Erro de conexão com o banco de dados", {
             description: "Verifique suas credenciais no painel de segredos."
           });
        }
        setLoading(false);
      }
    } finally {
      isCheckingAuth.current = false;
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    let mounted = true;
    const sessionRef = { current: session };

    // Sincronização inicial
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      console.log('[AUTH] Evento:', event, newSession?.user?.id);
      
      const currentUserId = newSession?.user?.id;
      const sessionUserId = sessionRef.current?.user?.id;

      if (event === 'SIGNED_OUT') {
        if (sessionRef.current !== null) {
          setSession(null);
          sessionRef.current = null;
          setUserRole(null);
          setViewMode('trainer');
          localStorage.removeItem('nexo_demo_auth');
          localStorage.removeItem('nexo_student_id');
        }
        setLoading(false);
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const demoAuth = localStorage.getItem('nexo_demo_auth');
        
        if (newSession) {
          if (currentUserId !== sessionUserId) {
            setSession(newSession);
            sessionRef.current = newSession;
            await checkUserRole(newSession.user.id, newSession.user.email);
          } else {
            setLoading(false);
          }
        } else if (demoAuth) {
          setLoading(false);
        } else {
          setSession(null);
          sessionRef.current = null;
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleExitExperience = React.useCallback(() => {
    if (userRole === 'trainer') {
      setViewMode('trainer');
    }
  }, [userRole]);

  const refreshReports = () => setReportVersion(v => v + 1);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const path = window.location.pathname;

    // A rota /cadastro deve ser tratada como página pública.
    if (path === '/cadastro') {
      console.log('[PRECADASTRO] rota pública detectada');
      return;
    }

    if (session && userRole) {
      console.log('[ROLE BLOCK] rota solicitada:', path);
      console.log('[ROLE BLOCK] role encontrada:', userRole);
      
      const isTrainerRoute = path.includes('/dashboard') || 
                             path.includes('/professor') || 
                             path.includes('/trainer');
      
      const isStudentRoute = path.includes('/aluno');

      // Se estiver na rota de trainer mas não for trainer
      if (isTrainerRoute) {
        if (userRole === 'student') {
          console.log('[ROLE BLOCK] redirecionando aluno para /aluno');
          setViewMode('student');
          navigate('/aluno');
          return;
        } else if (userRole === 'owner') {
          console.log('[ROLE BLOCK] redirecionando owner para /owner');
          navigate('/owner');
          return;
        } else if (userRole === 'trainer') {
          console.log('[ROLE BLOCK] acesso professor permitido');
          if (viewMode !== 'trainer') setViewMode('trainer');
        }
      }

      // Se estiver na rota de aluno mas não for aluno
      if (isStudentRoute && userRole === 'trainer') {
        console.log('[ROLE BLOCK] redirecionando professor para /dashboard');
        setViewMode('trainer');
        navigate('/dashboard');
        return;
      }

      // Se estiver na raiz e logado, redirecionar para a rota principal da role
      if (path === '/' || path === '' || path === '/login') {
        if (userRole === 'student') {
          console.log('[ROLE BLOCK] aluno na raiz, indo para /aluno');
          setViewMode('student');
          navigate('/aluno');
        } else if (userRole === 'trainer') {
          console.log('[ROLE BLOCK] professor na raiz, indo para /dashboard');
          setViewMode('trainer');
          navigate('/dashboard');
        } else if (userRole === 'owner') {
          console.log('[ROLE BLOCK] owner na raiz, indo para /owner');
          navigate('/owner');
        }
      }
    } else if (!session && !loading && !localStorage.getItem('nexo_demo_auth')) {
      const path = window.location.pathname;
      const publicPaths = ['/', '/login', '/signup', '/cadastro', '/invite', '/checkout-planos', '/reset-password'];
      if (!publicPaths.some(p => path === p || path.startsWith(p))) {
        console.log('[ROLE BLOCK] não logado, redirecionando para login');
        navigate('/');
      }
    }
  }, [session, userRole, viewMode, location.pathname, navigate, loading]);

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      <Routes>
          <Route path="/signup" element={<Signup />} />
        <Route path="/checkout-planos" element={<CheckoutPlans />} />
        <Route path="/invite" element={<InviteLanding onBack={() => navigate('/')} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/cadastro" 
          element={<Registration onBack={async () => {
            setShowLanding(true);
            console.log('[CADASTRO BACK] redirecionando para home pública');
            navigate('/');
          }} theme={theme} />} 
        />
      <Route 
        path="*" 
        element={
          loading ? (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-[#C5A07D]" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A07D] animate-pulse">
                Sincronizando Ecossistema...
              </p>
            </div>
          ) : !session && !localStorage.getItem('nexo_demo_auth') ? (
            showLanding ? (
              <LandingPage onGetStarted={() => setShowLanding(false)} />
            ) : (
              <Login 
                onLoginSuccess={() => checkAuth()} 
                onBackToLanding={() => setShowLanding(true)}
              />
            )
          ) : (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white font-manrope transition-colors duration-300">
              {viewMode === 'trainer' && userRole === 'trainer' ? (
                <>
                  <Header 
                    trainerProfile={trainerProfile} 
                    onProfileClick={() => setIsProfileModalOpen(true)} 
                    onLogout={handleLogout}
                    onInviteClick={handleInviteClick}
                    onNotificationClick={() => {
                      setIsNotificationsModalOpen(true);
                      if (unreadCount > 0) {
                        dataService.markAllNotificationsAsRead();
                        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                      }
                    }}
                    pendingCount={pendingStudents.length}
                    inviteCopied={inviteCopied}
                    theme={theme}
                    onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                  />
                  <NotificationsModal 
                    isOpen={isNotificationsModalOpen} 
                    onClose={() => setIsNotificationsModalOpen(false)} 
                    pendingStudents={pendingStudents} 
                    notifications={notifications}
                    onAction={handleStudentAction} 
                  />
                  <ProfileEditModal 
                    isOpen={isProfileModalOpen} 
                    onClose={() => setIsProfileModalOpen(false)} 
                    profile={trainerProfile} 
                    onSave={handleSaveProfile} 
                  />
                  <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} setViewMode={setViewMode} />
                  
                  <main className="px-6 md:pl-[300px] max-w-7xl mx-auto pb-32 md:pb-12">
                    <AnimatePresence mode="wait">
                      {activeTab === 'dashboard' && (
                        <TrainerDashboard 
                          key="dashboard" 
                          onSelectStudent={(id, tab, context) => {
                            setSelectedStudentId(id);
                            setHighlightedJoint(context?.joint || null);
                            setActiveTab(tab);
                          }}
                          setActiveTab={setActiveTab}
                          theme={theme}
                        />
                      )}
                      {activeTab === 'alunos' && (
                        <StudentManagement 
                          onSelectStudent={(id, tab) => {
                            setSelectedStudentId(id);
                            setHighlightedJoint(null);
                            setActiveTab(tab);
                          }} 
                          trainerProfile={trainerProfile}
                          isModalOpen={isModalOpen}
                          setIsModalOpen={setIsModalOpen}
                          editingStudent={editingStudent}
                          setEditingStudent={setEditingStudent}
                          generatedPassword={generatedPassword}
                          setGeneratedPassword={setGeneratedPassword}
                          formData={formData}
                          setFormData={setFormData}
                          initialFormState={initialFormState}
                          refreshTrigger={refreshStudentsTrigger}
                        />
                      )}
                      {activeTab === 'avaliacao' && (
                        <Assessment 
                          key="avaliacao" 
                          studentId={selectedStudentId} 
                          onSelectStudent={(id) => {
                            setSelectedStudentId(id);
                            setHighlightedJoint(null);
                          }}
                          setActiveTab={setActiveTab}
                          onSaveSuccess={refreshReports}
                        />
                      )}
                      {activeTab === 'prescricao' && (
                        <Prescription 
                          key="prescricao" 
                          studentId={selectedStudentId} 
                          highlightedJoint={highlightedJoint}
                          onSelectStudent={(id) => {
                            setSelectedStudentId(id);
                            setHighlightedJoint(null);
                          }}
                        />
                      )}
                      {activeTab === 'relatorios' && (
                        <Reports 
                          key={`relatorios-${selectedStudentId}-${reportVersion}`} 
                          studentId={selectedStudentId} 
                        />
                      )}
                    </AnimatePresence>
                  </main>

                  <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
                  
                  {/* Floating button removed as requested */}
                  {/*
                  <div className="md:hidden fixed bottom-24 right-6 z-[100]">
                    <button 
                      onClick={() => setViewMode('student')}
                      className="w-16 h-16 bg-[#C5A07D] text-black rounded-full shadow-2xl flex items-center justify-center animate-bounce border-2 border-white/20"
                    >
                      <Zap size={24} fill="currentColor" />
                    </button>
                  </div>
                  */}
                </>
              ) : studentStatus === 'pendente' ? (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#C5A07D]/20 blur-[100px] rounded-full" />
                    <img 
                      src="https://i.postimg.cc/QxBHqJbp/logo-nexo.png" 
                      alt="NEXO" 
                      className="w-48 mx-auto relative z-10"
                    />
                  </div>
                  
                  <div className="space-y-4 max-w-md relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-[#C5A07D]">Acesso Pendente</h2>
                    <p className="text-sm text-white/60 leading-relaxed font-manrope">
                      Sua solicitação de cadastro foi enviada com sucesso ao seu treinador. 
                      Para garantir a qualidade do acompanhamento, ele precisa validar seu acesso manualmente.
                    </p>
                    <div className="py-4 px-6 bg-white/5 border border-white/10 rounded-2xl inline-block">
                      <p className="text-[10px] font-bold text-[#C5A07D] uppercase tracking-widest animate-pulse">
                        Aguardando aprovação do professor...
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white transition-colors"
                  >
                    Sair da Conta
                  </button>
                </div>
              ) : studentStatus === 'recusado' ? (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-8">
                  <div className="relative">
                    <img 
                      src="https://i.postimg.cc/QxBHqJbp/logo-nexo.png" 
                      alt="NEXO" 
                      className="w-48 mx-auto"
                    />
                  </div>
                  
                  <div className="space-y-4 max-w-md">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-red-500">Acesso Recusado</h2>
                    <p className="text-sm text-white/40 leading-relaxed font-manrope">
                      Sua solicitação de acesso foi recusada. Para mais informações, entre em contato diretamente com seu treinador.
                    </p>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white transition-colors"
                  >
                    Sair da Conta
                  </button>
                </div>
              ) : (
                <StudentExperience 
                  studentId={selectedStudentId || ''} 
                  onExit={handleExitExperience}
                  onLogout={handleLogout}
                  userRole={userRole}
                  viewMode={viewMode}
                />
              )}
            </div>
          )
        } 
      />
    </Routes>
    </>
  );
}
