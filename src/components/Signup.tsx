import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowLeft, 
  ChevronRight,
  CheckCircle2,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<'professor' | 'aluno'>('professor');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'semestral' | 'anual'>('free');
  const [gender, setGender] = useState<'masculino' | 'feminino'>('masculino');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    confirmEmail: '',
    password: '',
    phone: ''
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email !== formData.confirmEmail) {
      toast.error('Os e-mails não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const fullName = `${formData.nome} ${formData.sobrenome}`.trim();
      
      console.log('[REGISTER] criando auth user', cleanEmail);
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: fullName,
            role: 'trainer'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered') || authError.status === 422) {
          toast.error('Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.');
          return;
        }
        throw authError;
      }
      if (!authData.user) throw new Error('Não foi possível criar o usuário.');

      console.log('[REGISTER] auth user criado', authData.user.id);

      // 2. Criar/Garantir registro em profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          email: cleanEmail,
          role: 'trainer',
          full_name: fullName
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Não jogamos erro aqui se o auth funcionou, tentamos continuar
      } else {
        console.log('[REGISTER] profile criado');
      }

      // 3. Criar/Garantir registro em trainers
      const { error: trainerError } = await supabase
        .from('trainers')
        .upsert({
          user_id: authData.user.id,
          email: cleanEmail,
          full_name: fullName,
          plan: selectedPlan,
          subscription_status: 'active',
          student_limit: selectedPlan === 'free' ? 1 : 100
        }, { onConflict: 'user_id' });

      if (trainerError) {
        console.error('Erro ao criar registro de trainer:', trainerError);
      } else {
        console.log('[REGISTER] trainer criado');
      }

      console.log('[REGISTER] cadastro finalizado');
      toast.success('Conta criada com sucesso!');

      // Se o plano for pago, redireciona para checkout, senão dashboard
      if (selectedPlan !== 'free') {
        const { data: checkoutData } = await supabase.functions.invoke('create-checkout', {
          body: { planId: selectedPlan, email: cleanEmail }
        });
        
        navigate('/checkout-planos', { state: { plan: selectedPlan, email: cleanEmail } });
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('[REGISTER] Erro no fluxo:', error);
      toast.error('Erro ao criar conta: ' + (error.message || 'Erro inesperado.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500/30 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-500 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-500 rounded-full blur-[180px]" />
      </div>

      <div className="w-full max-w-2xl z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <Link to="/">
            <img 
              src="https://i.postimg.cc/7P1rgBrY/logo-nexo.png" 
              alt="NEXO Logo" 
              className="h-24 md:h-32 w-auto object-contain transition-transform hover:scale-105 active:scale-95" 
              referrerPolicy="no-referrer"
            />
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-black uppercase tracking-[0.5em] text-amber-500 mt-6"
          >
            Elite Performance System
          </motion.h1>
        </div>

        {/* Signup Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-white/5 rounded-[48px] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          
          <form className="space-y-8" onSubmit={handleSignup}>
            {/* Account Type Toggle */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Tipo de Conta</label>
              <div className="grid grid-cols-2 gap-4 p-2 bg-black/40 rounded-3xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setAccountType('professor')}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    accountType === 'professor' 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <Users size={16} />
                  Professor
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('aluno')}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    accountType === 'aluno' 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <User size={16} />
                  Aluno
                </button>
              </div>
            </div>

            {/* Plan Selection */}
            {accountType === 'professor' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Escolha seu Plano</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['free', 'semestral', 'anual'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        selectedPlan === plan 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                          : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'
                      }`}
                    >
                      {plan === 'free' ? 'Gratuito' : plan === 'semestral' ? 'Semestral' : 'Anual'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name / Sobrenome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Nome</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium"
                    placeholder="Nome"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Sobrenome</label>
                <input 
                  type="text" 
                  required
                  value={formData.sobrenome}
                  onChange={(e) => setFormData({...formData, sobrenome: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium"
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Confirm Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Digite seu e-mail novamente</label>
              <input 
                type="email" 
                required
                value={formData.confirmEmail}
                onChange={(e) => setFormData({...formData, confirmEmail: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium"
                placeholder="seu@email.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-amber-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Phone / Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Telefone / WhatsApp</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold border-r border-white/10 pr-3">+55</span>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-24 pr-6 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Gênero</label>
                <div className="grid grid-cols-2 gap-2 h-[54px]">
                  <button
                    type="button"
                    onClick={() => setGender('masculino')}
                    className={`flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      gender === 'masculino' 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                        : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'
                    }`}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('feminino')}
                    className={`flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      gender === 'feminino' 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                        : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'
                    }`}
                  >
                    Feminino
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-black rounded-[24px] font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  CADASTRAR
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 font-medium tracking-tight">
                Já tem uma conta? <Link to="/login" className="text-amber-500 font-black hover:text-amber-400 transition-colors underline underline-offset-4 decoration-2">Entre aqui</Link>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Value Prop */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40">
          <div className="flex items-center gap-3 justify-center">
            <CheckCircle2 size={16} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Ciência Pura</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <CheckCircle2 size={16} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Tecnologia Elite</span>
          </div>
        </div>

        {/* Back to landing */}
        <div className="mt-12 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-white/20 hover:text-white transition-colors uppercase tracking-[0.3em]">
            <ArrowLeft size={12} />
            Voltar para a Navegação
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
