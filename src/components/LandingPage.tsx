import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Target, 
  BarChart3, 
  Mic, 
  CheckCircle2, 
  ArrowRight, 
  Trophy,
  Shield,
  Smartphone,
  TrendingUp,
  LayoutGrid,
  Star,
  Calendar,
  Activity,
  X,
  Menu,
  LogIn
} from 'lucide-react';
import type { Variants } from 'motion/react';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_50px_rgba(255,255,255,0.05)]" />
      </div>

      {/* Header */}
      <header className="relative w-full z-50 pt-2 md:pt-6 pb-2 md:pb-4 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://i.postimg.cc/7P1rgBrY/logo-nexo.png" 
              alt="NEXO Logo" 
              className="h-12 md:h-20 lg:h-24 w-auto object-contain" 
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Planos</button>
            <button onClick={() => onGetStarted()} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Já tenho conta</button>
            <Link 
              to="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
            >
              Cadastrar
            </Link>
          </nav>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-amber-500"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-[45]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-[calc(100%+8px)] right-6 w-[240px] bg-neutral-900 border border-white/10 p-2 rounded-[24px] md:hidden flex flex-col gap-1 shadow-2xl z-50"
              >
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <LayoutGrid size={16} className="text-amber-500" />
                  Planos
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGetStarted();
                  }} 
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <LogIn size={16} className="text-amber-500" />
                  Já tenho conta
                </button>
                <div className="h-px bg-white/5 my-1" />
                <Link 
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <ArrowRight size={16} />
                  Cadastrar
                </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>      {/* Hero Section */}
      <section className="relative pt-4 md:pt-32 lg:pt-40 pb-6 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-16 lg:gap-24 items-center min-h-[auto] lg:min-h-[85vh]">
          {/* Left Column: Content */}
          <div className="text-center lg:text-left z-10 text-balance">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1 mb-2 md:mb-8"
            >
              <span className="text-amber-500 text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.5em] border-b border-amber-500/30 pb-0.5">
                A Próxima Geração do Personal Trainer
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-3 md:mb-8 tracking-tighter"
            >
              Eleve o Nível da sua Consultoria. A Ciência Conectada ao <span className="text-amber-500">Resultado.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[11px] sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mb-5 md:mb-12 leading-relaxed font-medium mx-auto lg:mx-0"
            >
              Abandone as planilhas estáticas e os achismos. Entregue uma experiência premium com cálculo automático de PR, avaliações precisas e periodização inteligente. Retenha mais alunos e valorize o seu serviço.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-6"
            >
              <Link 
                to="/signup"
                className="w-full sm:w-auto group relative px-6 md:px-10 py-3.5 md:py-6 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] md:text-sm rounded-xl md:rounded-[24px] transition-all shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:shadow-[0_0_60px_rgba(245,158,11,0.4)] active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Quero Ser um Trainer Nexo
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-6 border-2 border-white/10 hover:border-white/30 text-white font-black uppercase tracking-widest text-[10px] md:text-sm rounded-xl md:rounded-[24px] transition-all"
              >
                Ver Planos
              </button>
            </motion.div>
          </div>

          {/* Right Column: Large Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            className="relative w-full flex justify-center lg:justify-end z-10 py-6 md:py-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
            <img 
              src="https://i.postimg.cc/SQvkdmSx/PRINCIPAL.png" 
              alt="Plataforma NEXO" 
              className="w-[300px] sm:w-[450px] md:w-[580px] h-auto object-contain transform translate-x-0 md:translate-x-16 lg:translate-x-24 xl:translate-x-32 scale-110 md:scale-150 xl:scale-[1.60] origin-center lg:origin-right drop-shadow-[0_0_60px_rgba(245,158,11,0.35)] hover:drop-shadow-[0_0_90px_rgba(245,158,11,0.5)] transition-all duration-700 hover:-translate-y-4 z-10 mx-auto md:mx-0"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Science & Prevention Section */}
      <section className="relative py-8 md:py-32 px-6 overflow-hidden bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Training Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: -50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full flex justify-center lg:justify-start order-2 lg:order-1 z-10 py-4 md:py-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
            <img 
              src="https://i.postimg.cc/C5txbyN8/TREINO.png" 
              alt="Monitoramento Científico de Treino" 
              className="w-full max-w-[280px] sm:max-w-none transform translate-x-0 md:translate-x-[-4rem] lg:translate-x-[-8rem] scale-95 md:scale-150 xl:scale-[1.60] origin-center lg:origin-left drop-shadow-[0_0_60px_rgba(245,158,11,0.25)] transition-all duration-700 ease-in-out hover:-translate-y-6 hover:drop-shadow-[0_0_80px_rgba(245,158,11,0.4)] z-10 mx-auto md:mx-0"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Right Column: Content */}
          <div className="text-center lg:text-left z-10 order-1 lg:order-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 mb-3 md:mb-8 bg-amber-500/10 border border-amber-500/20 rounded-full"
            >
              <Shield size={12} className="text-amber-500" />
              <span className="text-amber-500 text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.5em]">
                Alerta Científico
              </span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 md:mb-8 tracking-tighter text-white"
            >
              Controle Preciso do Volume Semanal do Cliente.
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[11px] sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mb-5 md:mb-12 leading-relaxed font-medium mx-auto lg:mx-0"
            >
              Você já viu alguma plataforma que alerta automaticamente, baseada em evidências científicas, quando o volume de séries ultrapassa o limite ideal para o seu aluno? O NEXO monitora a carga de trabalho real e te avisa: treinar mais nem sempre é treinar melhor.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Periodization Section */}
      <section className="relative py-8 md:py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Content */}
          <div className="text-center lg:text-left z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 mb-3 md:mb-8 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
            >
              <Calendar size={12} className="text-indigo-500" />
              <span className="text-indigo-400 text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.5em]">
                Planejamento de Performance
              </span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 md:mb-8 tracking-tighter text-white"
            >
              Periodização Estratégica:<br /><span className="text-amber-500">O Mapa do Resultado.</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[11px] sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mb-5 md:mb-12 leading-relaxed font-medium mx-auto lg:mx-0"
            >
              Pare de montar treinos avulsos. Com o NEXO, você organiza Macrociclos e Mesociclos com clareza visual e científica. Planeje o pico de performance do seu aluno e tenha o controle total da evolução a longo prazo, tudo em uma interface intuitiva e profissional.
            </motion.p>
          </div>

          {/* Right Column: Periodization Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full flex justify-center lg:justify-end z-10 py-4 md:py-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
            <img 
              src="https://i.postimg.cc/ncCkxv9N/PERIODIZAC-A-O.png" 
              alt="Periodização Estratégica NEXO" 
              className="w-full max-w-[280px] sm:max-w-none transform translate-x-0 md:translate-x-32 lg:translate-x-48 xl:translate-x-64 scale-95 md:scale-150 xl:scale-[1.60] origin-center lg:origin-right drop-shadow-[0_0_60px_rgba(79,70,229,0.25)] transition-all duration-700 ease-in-out hover:-translate-y-6 hover:drop-shadow-[0_0_90px_rgba(99,102,241,0.4)] z-10 mx-auto md:mx-0"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Postural Evaluation Section */}
      <section className="relative py-8 md:py-32 px-6 overflow-hidden bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-16 lg:gap-32 items-center">
          
          {/* Left Column: Content */}
          <div className="text-center lg:text-left z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 mb-3 md:mb-8 bg-cyan-500/10 border border-cyan-500/20 rounded-full"
            >
              <Activity size={12} className="text-cyan-500" />
              <span className="text-cyan-400 text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.5em]">
                Diagnóstico de Elite
              </span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 md:mb-8 tracking-tighter text-white"
            >
              Avaliação Postural Digital:<br /><span className="text-cyan-500">Relatórios Sem Digitação.</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[11px] sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mb-5 md:mb-12 leading-relaxed font-medium mx-auto lg:mx-0"
            >
              Identifique desvios posturais com precisão milimétrica. O NEXO analisa os dados e gera um relatório completo automaticamente para você. Pare de perder horas escrevendo laudos manuais; entregue um diagnóstico de elite para o seu aluno em segundos, baseado puramente em ciência.
            </motion.p>
          </div>

          {/* Right Column: Postural Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full flex justify-center lg:justify-end z-10 py-4 md:py-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
            <img 
              src="https://i.postimg.cc/J0Jd1ZG0/POSTURAL.png" 
              alt="Avaliação Postural NEXO" 
              className="w-full max-w-[280px] sm:max-w-none transform translate-x-0 md:translate-x-48 lg:translate-x-48 xl:translate-x-64 scale-95 md:scale-150 xl:scale-[1.60] origin-center lg:origin-right drop-shadow-[0_0_60px_rgba(6,182,212,0.25)] transition-all duration-700 ease-in-out hover:-translate-y-6 hover:drop-shadow-[0_0_90px_rgba(34,211,238,0.4)] z-10 mx-auto md:mx-0"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Conversion / Iceberg Section */}
      <section className="relative py-8 md:py-32 px-6 overflow-hidden bg-gradient-to-b from-transparent via-amber-950/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl md:text-5xl font-bold text-white mb-4 md:mb-8 tracking-tighter"
          >
            E acredite... isso é apenas a <span className="text-amber-500">ponta do iceberg.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto text-[11px] md:text-xl text-gray-300 mb-6 md:mb-12 leading-relaxed font-medium"
          >
            Nem chegamos a falar sobre o histórico completo de anamnese, a gestão inteligente da sua carteira ou a percepção de valor incalculável que o seu aluno terá ao abrir o aplicativo. O NEXO é mais do que tecnologia; é o seu novo posicionamento de mercado. Chegou a hora de dar um salto definitivo na sua entrega e cobrar o que você realmente merece.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.button 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(245,158,11,0.2)",
                  "0 0 40px rgba(245,158,11,0.4)",
                  "0 0 20px rgba(245,158,11,0.2)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-8 md:px-12 py-4 md:py-5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-sm md:text-lg rounded-full transition-all shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95"
            >
              Ver Planos de Assinatura
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-8 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-20">
            <h2 className="text-xl md:text-6xl font-black tracking-tight mb-3 md:mb-6">Investimento em Elite</h2>
            <p className="text-gray-500 text-[10px] md:text-xl max-w-2xl mx-auto">
              Escolha o plano que melhor se adapta à sua escala de consultoria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Starter */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-6 md:p-10 rounded-3xl md:rounded-[48px] bg-neutral-950 border border-white/5 flex flex-col"
            >
              <div className="mb-8">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Gratuito</span>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-2xl font-bold">R$</span>
                  <span className="text-6xl font-black">0</span>
                </div>
                <p className="mt-4 text-gray-500 text-xs font-medium">Teste na prática. 1 Aluno para validação do método.</p>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  '1 Aluno',
                  'Avaliação Antropométrica',
                  'Avaliação Postural',
                  'Avaliação Cardiorrespiratória',
                  'Biofeedback Integrado',
                  'Cálculo de PR AUTOMÁTICO',
                  'Temporizador com comando de voz',
                  'Aba de Periodização'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                    <CheckCircle2 size={16} className="text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup"
                className="w-full inline-block text-center py-5 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-black uppercase tracking-widest text-xs"
              >
                Começar Grátis
              </Link>
            </motion.div>

            {/* Semestral */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-10 rounded-[48px] bg-neutral-950 border border-white/5 flex flex-col"
            >
              <div className="mb-8">
                <span className="text-amber-500 font-black uppercase tracking-widest text-xs">Semestral</span>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-2xl font-bold">R$</span>
                  <span className="text-6xl font-black">59,90</span>
                  <span className="text-gray-500 font-bold">/mês</span>
                </div>
                <p className="mt-4 text-gray-500 text-xs font-medium">Acesso total e irrestrito a todas as ferramentas científicas por 6 meses.</p>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Alunos Ilimitados',
                  'Avaliação Antropométrica',
                  'Avaliação Postural',
                  'Avaliação Cardiorrespiratória',
                  'Biofeedback Integrado',
                  'Cálculo de PR AUTOMÁTICO',
                  'Temporizador com comando de voz',
                  'Aba de Periodização'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                    <CheckCircle2 size={16} className="text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup"
                className="w-full inline-block text-center py-5 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-black uppercase tracking-widest text-xs"
              >
                Assinar Semestral
              </Link>
            </motion.div>

            {/* Anual - Featured */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="relative p-1 rounded-[48px] bg-gradient-to-b from-amber-500 to-amber-800 shadow-[0_0_80px_rgba(245,158,11,0.15)] group"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest z-20">
                Melhor Custo-Benefício
              </div>
              <div className="bg-neutral-950 rounded-[47px] p-10 h-full flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-50" />
                <div className="relative z-10">
                  <div className="mb-8">
                    <span className="text-amber-500 font-black uppercase tracking-widest text-xs">Anual</span>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-2xl font-bold">R$</span>
                      <span className="text-7xl font-black">39,90</span>
                      <span className="text-gray-500 font-bold">/mês</span>
                    </div>
                    <p className="mt-4 text-gray-300 text-xs font-medium">Não importa o tamanho da sua carteira, gerencie todos com ciência e sem limites.</p>
                  </div>
                  <ul className="space-y-4 mb-12 flex-1">
                    {[
                      'Alunos Ilimitados',
                      'Avaliação Antropométrica',
                      'Avaliação Postural',
                      'Avaliação Cardiorrespiratória',
                      'Biofeedback Integrado',
                      'Cálculo de PR AUTOMÁTICO',
                      'Temporizador com comando de voz',
                      'Aba de Periodização'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-white">
                        <CheckCircle2 size={18} className="text-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    to="/signup"
                    className="w-full inline-block text-center py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    Assinar Anual
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-8 md:py-32 px-6 bg-neutral-950 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-6 md:mb-16 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg md:text-4xl font-bold text-white mb-2 md:mb-4 tracking-tighter"
          >
            O que os profissionais da elite estão dizendo
          </motion.h2>
        </div>

        <div className="flex overflow-hidden relative">
          <div className="flex animate-marquee gap-16 whitespace-nowrap py-10 px-4">
            {[
              { text: "'Aposentei minhas planilhas. O cálculo automático de PR salvou horas do meu final de semana.'", author: "Carlos E., Personal Trainer" },
              { text: "'O biofeedback visual me permite ajustar o treino na hora. Meus alunos sentem que têm um serviço VIP.'", author: "Mariana S., Personal Trainer" },
              { text: "'A aba de periodização é um absurdo de boa. Posso ver o macrociclo inteiro em uma tela só.'", author: "Rafael M., Treinador de Atletas" },
              { text: "'O timer humanizado mudou a dinâmica da consultoria. O aluno treina focado e sem olhar pro celular.'", author: "Fernanda L., Personal Trainer" },
              { text: "'Relatório postural automático? Eu demorava 40 minutos pra fazer um, agora o NEXO faz em 2 segundos.'", author: "Diego T., Personal Trainer" },
              { text: "'Finalmente uma plataforma que usa ciência de verdade e não só promessas. O controle de volume semanal é perfeito.'", author: "Lucas P., Personal Trainer" },
              { text: "'Aumentei o valor da minha consultoria em 40% depois que passei a usar o NEXO. A percepção de valor é surreal.'", author: "Amanda C., Personal Trainer" },
              { text: "'O fato de não precisar refazer as contas de carga pra cada aluno me devolveu a paz de espírito.'", author: "Bruno V., Personal Trainer" },
              { text: "'Design limpo, rápido e focado no que importa: resultado. O melhor investimento do ano.'", author: "Thiago R., Treinador" },
              { text: "'Eu testei com 1 aluno no plano grátis. No dia seguinte, assinei o Anual para a carteira toda. É viciante.'", author: "Juliana K., Personal Trainer" },
            ].map((item, index) => (
              <div 
                key={index}
                className="w-[300px] md:w-[450px] lg:w-[600px] flex-shrink-0 bg-neutral-900 border border-neutral-800 rounded-2xl p-10 hover:border-amber-500/50 transition-all duration-300 group shadow-lg"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-gray-300 text-base md:text-lg lg:text-xl italic mb-8 whitespace-normal leading-relaxed">
                  {item.text}
                </p>
                <p className="text-amber-500 text-sm lg:text-base font-bold uppercase tracking-wider">
                  {item.author}
                </p>
              </div>
            ))}
            {/* Duplicated for infinite scroll */}
            {[
              { text: "'Aposentei minhas planilhas. O cálculo automático de PR salvou horas do meu final de semana.'", author: "Carlos E., Personal Trainer" },
              { text: "'O biofeedback visual me permite ajustar o treino na hora. Meus alunos sentem que têm um serviço VIP.'", author: "Mariana S., Personal Trainer" },
              { text: "'A aba de periodização é um absurdo de boa. Posso ver o macrociclo inteiro em uma tela só.'", author: "Rafael M., Treinador de Atletas" },
              { text: "'O timer humanizado mudou a dinâmica da consultoria. O aluno treina focado e sem olhar pro celular.'", author: "Fernanda L., Personal Trainer" },
              { text: "'Relatório postural automático? Eu demorava 40 minutos pra fazer um, agora o NEXO faz em 2 segundos.'", author: "Diego T., Personal Trainer" },
              { text: "'Finalmente uma plataforma que usa ciência de verdade e não só promessas. O controle de volume semanal é perfeito.'", author: "Lucas P., Personal Trainer" },
              { text: "'Aumentei o valor da minha consultoria em 40% depois que passei a usar o NEXO. A percepção de valor é surreal.'", author: "Amanda C., Personal Trainer" },
              { text: "'O fato de não precisar refazer as contas de carga pra cada aluno me devolveu a paz de espírito.'", author: "Bruno V., Personal Trainer" },
              { text: "'Design limpo, rápido e focado no que importa: resultado. O melhor investimento do ano.'", author: "Thiago R., Treinador" },
              { text: "'Eu testei com 1 aluno no plano grátis. No dia seguinte, assinei o Anual para a carteira toda. É viciante.'", author: "Juliana K., Personal Trainer" },
            ].map((item, index) => (
              <div 
                key={`dup-${index}`}
                className="w-[300px] md:w-[450px] lg:w-[600px] flex-shrink-0 bg-neutral-900 border border-neutral-800 rounded-2xl p-10 hover:border-amber-500/50 transition-all duration-300 group shadow-lg"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-gray-300 text-base md:text-lg lg:text-xl italic mb-8 whitespace-normal leading-relaxed">
                  {item.text}
                </p>
                <p className="text-amber-500 text-sm lg:text-base font-bold uppercase tracking-wider">
                  {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlays to fade edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      </section>

      <footer className="relative pt-12 md:pt-32 pb-10 px-6 bg-neutral-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 mb-16 md:mb-32">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-amber-500/40 blur-[40px] rounded-full animate-pulse" />
                <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full border-4 border-amber-500/30 p-2 md:p-3 bg-neutral-900 group">
                  <img 
                    src="https://i.postimg.cc/c4z9YZz9/Chat-GPT-Image-5-de-mar-de-2026-18-52-45.png" 
                    alt="Fundador NEXO" 
                    className="w-full h-full rounded-full object-cover shadow-2xl shadow-amber-500/20"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 text-amber-500 mb-3">
                  <TrendingUp size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">O Idealizador</span>
                </div>
                <h4 className="text-3xl font-black tracking-tight mb-4 text-white">Transformando a ciência do treino em tecnologia prática.</h4>
                <p className="text-gray-400 text-lg md:text-xl mt-4 leading-relaxed font-medium">
                  Mestre em Ciências do Movimento. Especialista em unir o rigor científico acadêmico com a realidade prática do treinamento de força. O NEXO nasceu da minha inquietação em ver profissionais de elite reféns de ferramentas amadoras. Construí este ecossistema para elevar o padrão da Educação Física e colocar a verdadeira ciência na palma da sua mão.
                </p>
                <div className="flex items-center gap-4 justify-center md:justify-start mt-8">
                  <span className="text-xl font-black text-amber-500">Leonardo Fernandes</span>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-6">
                <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Nexo System</h5>
                <ul className="space-y-3 text-sm font-medium text-gray-500">
                  <li><a href="#pricing" className="hover:text-amber-500 transition-colors">Planos Elite</a></li>
                  <li><a href="#" className="hover:text-amber-500 transition-colors">Ciência por trás</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Legal</h5>
                <ul className="space-y-3 text-sm font-medium text-gray-500">
                  <li><a href="#" className="hover:text-amber-500 transition-colors">Privacidade</a></li>
                  <li><a href="#" className="hover:text-amber-500 transition-colors">Termos de Uso</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5">
            <div className="flex items-center gap-3 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer">
              <Zap size={20} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-black tracking-[0.3em]">NEXO TECHNOLOGY &bull; 2026</span>
            </div>
            
            <div className="flex items-center gap-8 text-[9px] font-black tracking-[0.4em] text-white/20">
              <span className="hover:text-white transition-colors cursor-pointer">INSTAGRAM</span>
              <span className="hover:text-white transition-colors cursor-pointer">LINKEDIN</span>
              <span className="hover:text-white transition-colors cursor-pointer">YOUTUBE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
