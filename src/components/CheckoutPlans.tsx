import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  Crown, 
  Zap, 
  ShieldCheck, 
  ArrowLeft,
  CreditCard,
  Sparkles,
  Award
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { handleCheckout } from '../services/stripeService';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
  icon: typeof Zap;
  ctaText: string;
  buttonClass: string;
}

const plans: Plan[] = [
  {
    id: 'gratis',
    name: 'GRATUITO',
    price: 'R$ 0',
    period: '/teste',
    description: 'Teste na prática. 1 Aluno para validação do método.',
    icon: Zap,
    ctaText: 'COMEÇAR GRÁTIS',
    buttonClass: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
    features: [
      '1 Aluno',
      'Avaliação Antropométrica',
      'Avaliação Postural',
      'Avaliação Cardiorrespiratória',
      'Biofeedback Integrado',
      'Cálculo de PR AUTOMÁTICO',
      'Temporizador com Voz',
      'Aba de Periodização'
    ]
  },
  {
    id: 'semestral',
    name: 'SEMESTRAL',
    price: 'R$ 59,90',
    period: '/mês',
    description: 'Acesso total e irrestrito a todas as ferramentas científicas por 6 meses.',
    icon: Crown,
    ctaText: 'ASSINAR SEMESTRAL',
    buttonClass: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
    features: [
      'Alunos Ilimitados',
      'Avaliação Antropométrica',
      'Avaliação Postural',
      'Avaliação Cardiorrespiratória',
      'Biofeedback Integrado',
      'Cálculo de PR AUTOMÁTICO',
      'Temporizador com Voz',
      'Aba de Periodização'
    ]
  },
  {
    id: 'anual',
    name: 'ANUAL',
    price: 'R$ 39,90',
    period: '/mês',
    description: 'Não importa o tamanho da sua carteira, gerencie todos com ciência e sem limites.',
    highlight: true,
    icon: Award,
    ctaText: 'ASSINAR ANUAL',
    buttonClass: 'bg-amber-500 text-black shadow-xl shadow-amber-500/20 hover:brightness-110',
    features: [
      'Alunos Ilimitados',
      'Avaliação Antropométrica',
      'Avaliação Postural',
      'Avaliação Cardiorrespiratória',
      'Biofeedback Integrado',
      'Cálculo de PR AUTOMÁTICO',
      'Temporizador com Voz',
      'Aba de Periodização'
    ]
  }
];

const CheckoutPlans: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<string | null>(null);
  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  useEffect(() => {
    const state = location.state as { plan?: string, email?: string } | null;
    if (state?.plan && state.plan !== 'free') {
      onSubscribe(state.plan, state.email);
    }
  }, [location.state]);

  const onSubscribe = async (planId: string, email?: string) => {
    if (!isStripeConfigured) {
      toast.error('Sistema de pagamentos em manutenção.');
      return;
    }

    console.log(`[onSubscribe] Plano selecionado: ${planId} | Email: ${email}`);
    try {
      setLoading(planId);
      const result = await handleCheckout(planId, email);
      
      console.log(`[onSubscribe] Resultado do checkout:`, result);
      
      if (!result.success) {
        toast.error(result.message || 'Erro ao processar plano.');
        setLoading(null);
      }
    } catch (error: any) {
      console.error('[onSubscribe] Erro catastrófico no checkout:', error);
      toast.error('Erro inesperado no checkout.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500/30 py-16 px-6 relative overflow-hidden flex flex-col justify-center">
      {/* Background Decorative Gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[180px] pointer-events-none" />
      
      {!isStripeConfigured && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Checkout em Manutenção</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500">Investimento em Elite</span>
            <div className="h-px w-8 bg-amber-500/50" />
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none"
            >
              Escolha seu <span className="text-neutral-800 dark:text-amber-500/20">escalonamento.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 max-w-xl mx-auto font-medium text-sm leading-relaxed"
            >
              Escolha o plano que melhor se adapta à sua escala de consultoria. 
              Ciência de elite ao alcance de todos os profissionais.
            </motion.p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`relative p-8 rounded-[40px] border transition-all duration-500 flex flex-col ${
                plan.highlight 
                  ? 'bg-neutral-900 border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.1)] ring-1 ring-amber-500/20' 
                  : 'bg-neutral-900/40 border-white/5 hover:border-white/10'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-xl">
                  MELHOR CUSTO-BENEFÍCIO
                </div>
              )}

              <div className="space-y-8 flex-1">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">{plan.name}</span>
                    <plan.icon size={20} className={plan.highlight ? 'text-amber-500' : 'text-gray-600'} />
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter italic">{plan.price}</span>
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{plan.period}</span>
                  </div>
                  
                  <p className="text-gray-400 text-xs font-medium leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <div className="w-full h-px bg-white/5" />

                <ul className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-[11px] text-gray-300 font-bold uppercase tracking-wide">
                      <div className={`shrink-0 w-5 h-5 rounded-lg flex items-center justify-center ${plan.highlight ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-gray-600'}`}>
                        <Check size={10} strokeWidth={4} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <button
                  onClick={() => onSubscribe(plan.id)}
                  disabled={loading !== null || (plan.id !== 'gratis' && !isStripeConfigured)}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 active:scale-95 ${
                    plan.id !== 'gratis' && !isStripeConfigured 
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50' 
                      : plan.buttonClass
                  }`}
                >
                  {loading === plan.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {plan.id !== 'gratis' && !isStripeConfigured ? 'INDISPONÍVEL' : plan.ctaText}
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Nav */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-3">
            <CreditCard size={14} className="text-amber-500" />
            Pagamento 100% Seguro via Stripe
          </p>
          <Link 
            to="/dashboard" 
            className="text-[11px] font-black text-white/20 hover:text-white uppercase tracking-[0.3em] transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Acessar versão gratuita limitada
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPlans;
