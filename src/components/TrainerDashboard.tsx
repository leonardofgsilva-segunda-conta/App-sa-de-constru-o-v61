import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services/geminiService';
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  BarChart3, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  TriangleAlert, 
  Check, 
  CheckCircle2, 
  ClipboardList, 
  Zap, 
  Sparkles,
  X,
  BrainCircuit,
  Loader2,
  Trophy,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { dataService, Student, TrainerProfile } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { CreditCard, ShieldCheck, Crown, Search } from 'lucide-react';
import { SPORT_CONFIGS } from '../constants/sportConfigs';

// --- Helper Components ---

const formatDuration = (seconds: number) => {
  if (!seconds || seconds === 0) return '---';
  
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes === 0) return '1 MIN'; // Mínimo de 1 minuto se houver tempo
  
  if (totalMinutes < 60) {
    return `${totalMinutes} MIN`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}H`;
  }
  
  return `${hours}H ${remainingMinutes}M`;
};

const getPSEColor = (value: number) => {
  if (value <= 3) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  if (value <= 6) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  if (value <= 8) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
  return 'text-red-500 bg-red-500/10 border-red-500/20';
};

export const Counter = ({ value, duration = 2000, prefix = "", suffix = "" }: { value: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    let totalMiliseconds = duration;
    let incrementTime = (totalMiliseconds / end) > 10 ? (totalMiliseconds / end) : 10;
    
    let timer = setInterval(() => {
      start += Math.ceil(end / (duration / 20));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-primary/30 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-xs font-bold text-gray-900 dark:text-white flex justify-between gap-8">
              <span className="opacity-60 uppercase tracking-tighter">{p.name}:</span>
              <span>{p.value.toLocaleString()} {p.unit || ''}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface TrainerDashboardProps {
  onSelectStudent: (id: string, tab: string, context?: any) => void;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onSelectStudent, setActiveTab, theme }) => {
  const [stats, setStats] = useState({ students: 0, todayWorkouts: 0, evaluations: 0, prescriptions: 0 });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<TrainerProfile | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [currentModality, setCurrentModality] = useState<string>('musculacao');
  const [isUpdatingModality, setIsUpdatingModality] = useState(false);
  const [modalitySearch, setModalitySearch] = useState('');
  const [showModalityList, setShowModalityList] = useState(false);

  const fetchRanking = async () => {
    const data = await dataService.getStudentFrequencyRanking();
    if (!data) return;
    setRanking(data);
  };

  const fetchReports = async (trainerId: string) => {
    try {
      console.log('[DEBUG] Buscando relatórios de treino...');
      
      const { data, error } = await supabase
        .from('workout_history')
        .select(`
          *,
          students!inner (
            full_name,
            name,
            goal,
            lesao,
            professor_id
          )
        `)
        .eq('students.professor_id', trainerId)
        .neq('status', 'concluido')
        .order('completed_at', { ascending: false });

      console.log('Relatórios do Banco (Join):', data, 'Erro:', error);

      if (error) {
        console.error("Erro na busca de relatórios:", error);
        setReports([]);
        return;
      }
      
      const transformedData = (data || []).map(r => {
        const studentPhoto = "";
        
        return {
          ...r,
          name: r.students?.full_name || r.students?.name || 'Aluno sem nome',
          img: studentPhoto,
          studentId: r.student_id,
        painLevel: r.pain_level || 0,
        location: r.pain_location || 'Geral',
        comment: r.notes || r.comment || '',
        goal: r.students?.goal || 'Sem objetivo',
        lesao: r.students?.lesao || 'Nenhuma registrada',
        completedAt: r.completed_at || r.created_at,
        pse: r.pse || r.rpe || 0,
        durationSeconds: r.duration_seconds || 0
        };
      });

      setReports(transformedData);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckReport = async (reportId: string) => {
    try {
      console.log('[DEBUG] Tentando arquivar relatório:', reportId);
      
      const profile = await dataService.getTrainerSubscription();
      if (!profile) {
        toast.error("Perfil de treinador não encontrado.");
        return;
      }

      // REGRA DE OURO: Adicionar filtro de professor_id para garantir isolamento
      const { data: studentReport } = await supabase
        .from('workout_history')
        .select('student_id, students!inner(professor_id)')
        .eq('id', reportId)
        .eq('students.professor_id', profile.id)
        .maybeSingle();

      if (!studentReport) {
        toast.error("Relatório não encontrado ou acesso negado.");
        return;
      }

      const { error } = await supabase
        .from('workout_history')
        .update({ status: 'concluido' })
        .eq('id', reportId);

      if (!error) {
        console.log('[DEBUG] Update realizado com sucesso no banco.');
        setReports(prev => prev.filter(r => r.id !== reportId));
        // Cleanup suggestion
        setSuggestions(prev => {
          const next = { ...prev };
          delete next[reportId];
          return next;
        });
        toast.success("Relatório arquivado com sucesso.");
      } else {
        console.error('Erro ao arquivar no banco:', error);
        toast.error("Erro ao arquivar relatório no banco.");
      }
    } catch (error) {
      console.error('[CRITICAL] Erro na função handleCheckReport:', error);
      toast.error("Erro inesperado ao arquivar.");
    }
  };

  const handleAISuggestion = async (report: any) => {
    if (suggestingId) return;
    setSuggestingId(report.id);
    try {
      const suggestion = await geminiService.suggestTrainingAdjustments(
        report.lesao,
        report.goal,
        { 
          painLevel: report.painLevel, 
          location: report.location, 
          notes: report.comment 
        }
      );
      setSuggestions(prev => ({ ...prev, [report.id]: suggestion }));
      toast.success("Sugestão AI gerada!");
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("Erro ao gerar sugestão AI.");
    } finally {
      setSuggestingId(null);
    }
  };

  const handleModalityChange = async (modality: string) => {
    setIsUpdatingModality(true);
    try {
      await dataService.updateTrainerProfile({ sport_modality: modality });
      setCurrentModality(modality);
      setShowModalityList(false);
      setModalitySearch('');
      toast.success("Modalidade atualizada!");
    } catch (error) {
      console.error("Error updating modality:", error);
      toast.error("Erro ao atualizar modalidade.");
    } finally {
      setIsUpdatingModality(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const profile = await dataService.ensureTrainerProfile();
        
        // Handle post-checkout sync
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const plan = urlParams.get('plan');

        if (status === 'success' && (plan === 'semestral' || plan === 'anual')) {
          await dataService.updateSubscriptionAfterPayment(plan as 'semestral' | 'anual');
          toast.success(`Plano ${plan.toUpperCase()} ativado com sucesso!`);
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          const updatedProfile = await dataService.getTrainerSubscription();
          setTeacher(updatedProfile);
          if (updatedProfile?.sport_modality) {
            setCurrentModality(updatedProfile.sport_modality);
          }
        } else {
          setTeacher(profile);
          if (profile?.sport_modality) {
            setCurrentModality(profile.sport_modality);
          }
        }

        if (profile) {
          const [dashboardStats, recent, upcomingDeadlines] = await Promise.all([
            dataService.getDashboardStats(),
            dataService.getRecentStudents(10),
            dataService.getUpcomingDeadlines()
          ]);
          setStats(dashboardStats);
          setDeadlines(upcomingDeadlines);
          await Promise.all([fetchReports(profile.id), fetchRanking()]);
          
          const enhancedRecent = recent.slice(0, 4).map(s => ({
            ...s,
            treinouHoje: Math.random() > 0.5 
          }));
          
          setRecentStudents(enhancedRecent);
        } else {
          toast.error("Perfil de treinador não encontrado.");
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();

    // Configuração Realtime para novos relatos de treino
    // Robustez: Remover canal antes de criar novo
    supabase.removeChannel(supabase.channel('workout_history_changes_dashboard'));

    const channel = supabase
      .channel('workout_history_changes_dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_history'
        },
        async (payload) => {
          console.log('[REALTIME] Novo treino detectado:', payload);
          // Recarregamos a lista para manter a ordenação e os dados do aluno via JOIN
          const profile = await dataService.getTrainerSubscription();
          if (profile) {
            await fetchReports(profile.id);
            toast.info("Novo relato de treino recebido!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Bom dia, Treinador!`;
    if (hour < 18) return `Boa tarde, Treinador!`;
    return `Boa noite, Treinador!`;
  };

  const performanceData = [
    { name: 'JAN', volume: 4000, intensidade: 65 },
    { name: 'FEV', volume: 5500, intensidade: 72 },
    { name: 'MAR', volume: 4800, intensidade: 68 },
    { name: 'ABR', volume: 7200, intensidade: 85 },
    { name: 'MAI', volume: 6800, intensidade: 78 },
    { name: 'JUN', volume: 9000, intensidade: 92 },
    { name: 'JUL*', volumeProj: 10200, isProj: true },
    { name: 'AGO*', volumeProj: 11500, isProj: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-4 sm:space-y-12 pb-32"
    >
      <AnimatePresence>
        {showAIAdvisor && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-surface-container-highest border border-gray-200 dark:border-primary/40 rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 max-w-2xl w-full relative shadow-2xl dark:shadow-[0_0_50px_rgba(197,160,125,0.2)] max-h-[90vh] overflow-y-auto custom-scrollbar">
               <button onClick={() => setShowAIAdvisor(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                 <X size={24} className="text-gray-400 dark:text-white/40" />
               </button>
               <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                 <div className="p-3 sm:p-4 bg-primary/20 rounded-xl sm:rounded-2xl">
                   <Sparkles className="text-primary" size={32} />
                 </div>
                 <div>
                   <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white italic">NEXO ADVISOR</h3>
                   <p className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">Análise Preditiva em Tempo Real</p>
                 </div>
               </div>
               <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-gray-600 dark:text-white/70 leading-relaxed font-manrope">
                 <p>Baseado no volume load acumulado dos últimos 30 dias, detectamos um aumento de <span className="text-primary font-black italic">14% na carga mecânica geral</span>.</p>
                 <div className="p-4 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-1.5 sm:p-2 bg-secondary/20 rounded-lg shrink-0">
                        <TrendingUp size={16} className="text-secondary" />
                      </div>
                      <p className="text-[11px] sm:text-xs"><strong className="text-gray-900 dark:text-white">Trend Positiva:</strong> A adesão ao protocolo de hipertrofia subiu para 92% na sua base ativa.</p>
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-1.5 sm:p-2 bg-red-500/20 rounded-lg shrink-0">
                        <AlertTriangle size={16} className="text-red-400" />
                      </div>
                      <p className="text-[11px] sm:text-xs"><strong className="text-gray-900 dark:text-white">Alerta de Fadiga:</strong> 3 alunos apresentam sinais de sobrecarga. Recomendo ajuste de volume excêntrico.</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAIAdvisor(false)} className="w-full py-4 sm:py-5 bg-primary text-black text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] rounded-xl sm:rounded-2xl shadow-xl hover:shadow-primary/30 transition-all">Sincronizar Estratégia</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 sm:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
             <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-ping" />
             <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary">{getGreeting()}</span>
          </div>
          <h1 className="text-primary italic font-black leading-tight tracking-tighter uppercase text-base sm:text-3xl md:text-4xl max-w-4xl">NEXO — CIÊNCIA EM MOVIMENTO, RESULTADO EM DADOS</h1>
        </motion.div>
      </div>

      {/* Sport Modality Selector */}
      <section className="relative z-20">
        <div 
          className={cn(
            "bg-white dark:bg-black/20 backdrop-blur-2xl border border-gray-100 dark:border-white/5 p-4 sm:p-7 rounded-[24px] sm:rounded-[40px] shadow-lg transition-all border-l-4",
            SPORT_CONFIGS[currentModality]?.primaryColor ? `border-l-[${SPORT_CONFIGS[currentModality].primaryColor}]` : "border-l-primary"
          )}
          style={{ borderLeftColor: SPORT_CONFIGS[currentModality]?.primaryColor || '#C5A07D' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div 
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10"
                style={{ borderColor: `${SPORT_CONFIGS[currentModality]?.primaryColor}30` || 'rgba(197, 160, 125, 0.2)' }}
              >
                <Dumbbell className="text-primary" size={28} style={{ color: SPORT_CONFIGS[currentModality]?.primaryColor || '#C5A07D' }} />
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/30 mb-0.5">Ecossistema NEXO Multi-Modalidade</p>
                <h2 className="text-base sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white italic">
                  De qual modalidade você é professor?
                </h2>
              </div>
            </div>

            <div className="relative w-full md:w-80">
              <button 
                onClick={() => setShowModalityList(!showModalityList)}
                className="w-full h-14 sm:h-16 flex items-center justify-between px-6 sm:px-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] hover:border-primary/50 transition-all text-gray-700 dark:text-white shadow-xl"
              >
                <span className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SPORT_CONFIGS[currentModality]?.primaryColor || '#C5A07D' }}></div>
                  {SPORT_CONFIGS[currentModality]?.label || 'Selecionar...'}
                </span>
                <ChevronDown size={16} className={cn("transition-transform duration-300", showModalityList && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showModalityList && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[100] p-3"
                  >
                    <div className="relative mb-3">
                       <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                       <input 
                         type="text"
                         autoFocus
                         value={modalitySearch}
                         onChange={(e) => setModalitySearch(e.target.value)}
                         placeholder="Buscar modalidade..."
                         className="w-full bg-black/40 border-none outline-none px-10 py-4 text-[10px] font-bold text-white rounded-2xl"
                       />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1.5 p-1">
                      {Object.values(SPORT_CONFIGS)
                        .filter(m => m.label.toLowerCase().includes(modalitySearch.toLowerCase()))
                        .map((mod) => (
                        <button
                          key={mod.value}
                          onClick={() => handleModalityChange(mod.value)}
                          disabled={isUpdatingModality}
                          className={cn(
                            "w-full px-5 py-4 text-left rounded-2xl transition-all flex items-center justify-between group relative overflow-hidden",
                            currentModality === mod.value 
                              ? "bg-white/10 text-white font-black" 
                              : "hover:bg-white/5 text-gray-400 dark:text-white/40"
                          )}
                        >
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 transition-all",
                            currentModality === mod.value ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )} style={{ backgroundColor: mod.primaryColor }}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none z-10">{mod.label}</span>
                          {currentModality === mod.value && <Check size={16} className="text-white z-10" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-4 no-scrollbar">
        {[
          { label: 'Novo Aluno', icon: Plus, tab: 'alunos' },
          { label: 'Prescrição', icon: ClipboardList, tab: 'prescricao' },
          { label: 'NEXO ADVISOR', icon: Sparkles, tab: null, action: () => setShowAIAdvisor(true) }
        ].map((action, i) => (
          <button 
            key={i}
            onClick={action.action || (() => setActiveTab(action.tab!))}
            className="flex-1 min-w-[90px] sm:min-w-[120px] sm:flex-none flex items-center justify-center sm:justify-start gap-1.5 sm:gap-3 bg-white dark:bg-black/30 backdrop-blur-md border border-gray-200 dark:border-white/10 px-2.5 sm:px-8 py-2.5 sm:py-5 rounded-lg sm:rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all text-[7px] sm:text-[10px] font-black uppercase tracking-widest group shadow-sm dark:shadow-2xl text-gray-700 dark:text-white"
          >
            <div className={cn(
              "p-1 sm:p-2 rounded-lg sm:rounded-xl group-hover:scale-110 transition-all shrink-0",
              action.label.includes('ADVISOR') ? "bg-primary/20 text-primary" : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 group-hover:text-primary"
            )}>
              <action.icon size={12} className="sm:size-[18px]" />
            </div>
            <span className="whitespace-nowrap scale-[0.9] sm:scale-100">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-6">
        {[
          { 
            label: 'Alunos Ativos', 
            value: stats.students, 
            trend: teacher?.plan === 'free' ? `${stats.students}/${teacher.student_limit}` : 'ILIMITADOS', 
            icon: Users, 
            trendColor: teacher?.plan === 'free' && stats.students >= (teacher.student_limit || 1) ? 'text-red-500' : 'text-secondary', 
            suffix: '' 
          },
          { 
            label: 'Plano Atual', 
            value: 0, 
            displayValue: teacher?.plan?.toUpperCase() || 'FREE',
            trend: teacher?.subscription_status?.toUpperCase() || 'ATIVO', 
            icon: teacher?.plan === 'free' ? ShieldCheck : Crown, 
            trendColor: 'text-primary', 
            suffix: '',
            isStatic: true
          },
          { 
            label: 'Acesso', 
            value: 0, 
            displayValue: 'TOTAL',
            trend: 'CONSULTA 24H', 
            icon: Zap, 
            trendColor: 'text-cyan-400', 
            suffix: '',
            isStatic: true,
            className: "col-span-2 md:col-span-1"
           },
        ].map((stat: any, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white dark:bg-black/20 backdrop-blur-2xl border border-gray-100 dark:border-white/5 border-t-primary/20 p-4 sm:p-10 rounded-[20px] sm:rounded-[40px] relative overflow-hidden group shadow-lg dark:shadow-2xl",
              stat.className
            )}
          >
            <div className="absolute -right-2 sm:-right-4 -top-2 sm:-top-4 text-primary opacity-5 transform rotate-12 group-hover:scale-110 transition-all duration-700">
              <stat.icon size={50} className="sm:size-[120px]" />
            </div>
            <div className="relative z-10">
              <span className="text-[6px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em] text-gray-400 dark:text-white/30 mb-1.5 sm:mb-6 block">{stat.label}</span>
              <div className="flex items-baseline gap-2">
                <h4 className="text-base sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-on-surface tracking-tighter text-center w-full uppercase italic">
                  {stat.isStatic ? (stat.displayValue || stat.value) : <Counter value={stat.value} suffix={stat.suffix} />}
                </h4>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 sm:mt-6">
                <span className={cn("text-[6px] sm:text-[9px] font-black uppercase tracking-widest", stat.trendColor)}>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-white dark:bg-black/30 backdrop-blur-3xl border border-gray-200 dark:border-white/5 rounded-[20px] sm:rounded-[48px] p-4 sm:p-10 relative overflow-hidden shadow-lg dark:shadow-none flex flex-col">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-10">
            <div>
              <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 block">Frequência Mensal</span>
              <h2 className="text-base sm:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white italic">RANKING DE ALUNOS</h2>
            </div>
            <div className="self-start sm:self-auto px-2 sm:px-4 py-1 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-[7px] sm:text-[9px] font-black text-primary uppercase tracking-[0.1em] sm:tracking-[0.2em]">Top 3 Premiados</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
             {ranking.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full opacity-20 py-8 sm:py-12">
                  <Trophy size={48} className="mb-4 text-gray-400 dark:text-white" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white">Nenhum treino registrado este mês</p>
               </div>
             ) : ranking.map((r, i) => {
               const maxCount = ranking[0]?.count || 1;
               const progress = (r.count / maxCount) * 100;
               
               return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "group relative p-3 sm:p-5 rounded-2xl sm:rounded-[32px] transition-all flex flex-col gap-2 sm:gap-4",
                    i === 0 ? "bg-primary/5 border border-primary/20" : "bg-gray-50 dark:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={cn(
                        "w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-lg font-black",
                        i === 0 ? "bg-primary text-black" : 
                        i === 1 ? "bg-gray-300 text-gray-700" :
                        i === 2 ? "bg-amber-700/50 text-amber-100" :
                        "bg-gray-100 dark:bg-white/10 text-gray-400"
                      )}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{r.name}</p>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 dark:text-on-surface uppercase tracking-widest leading-none">
                          {r.count} {r.count === 1 ? 'treino' : 'treinos'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 sm:h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                      className={cn(
                        "h-full rounded-full",
                        i === 0 ? "bg-primary shadow-[0_0_15px_rgba(197,160,125,0.4)]" : 
                        i === 1 ? "bg-gray-300" :
                        i === 2 ? "bg-amber-700/50" :
                        "bg-white/20"
                      )}
                    />
                  </div>
                </motion.div>
               );
             })}
          </div>
        </div>

        <div className="bg-white dark:bg-black/30 backdrop-blur-3xl border border-gray-200 dark:border-white/5 rounded-[20px] sm:rounded-[48px] p-5 lg:p-10 relative overflow-hidden shadow-lg dark:shadow-none min-h-[300px] lg:min-h-[400px]">
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div className="p-1.5 sm:p-3 bg-primary/10 rounded-lg sm:rounded-2xl">
              <Calendar className="text-primary size-3.5 sm:size-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white italic leading-tight">AGENDA</h2>
              <p className="text-[7px] sm:text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest">Próximos compromissos</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {deadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20 py-8 sm:py-12">
                 <Check size={32} className="mb-4 text-gray-400 dark:text-white sm:size-12" />
                 <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white">Tudo em dia</p>
              </div>
            ) : deadlines.map((d, i) => (
              <motion.div 
                key={d.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between"
                onClick={() => onSelectStudent(d.studentId, d.type === 'workout' ? 'prescricao' : 'avaliacao')}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "p-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-center",
                    d.type === 'workout' ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                  )}>
                    {d.type === 'workout' ? <Dumbbell size={16} className="sm:size-[18px]" /> : <ClipboardList size={16} className="sm:size-[18px]" />}
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{d.studentName}</p>
                    <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest mt-0.5 sm:mt-1">{d.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] sm:text-[10px] font-black font-mono text-primary italic">
                    {d.date === 'Sem Data' ? 'PENDENTE' : new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <p className="text-[7px] sm:text-[8px] font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest mt-0.5 sm:mt-1">Prazo</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Relatório de Treino dos Alunos */}
      <section className="pb-32 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-1 h-4 sm:h-8 bg-error rounded-full" />
            <h2 className="text-base sm:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-on-surface italic">Relatórios de Treino</h2>
          </div>
          <div className="flex items-center self-start sm:self-auto gap-2 px-2 sm:px-4 py-1 bg-error/10 border border-error/20 rounded-full">
            <TriangleAlert size={10} className="text-error" />
            <span className="text-[7px] sm:text-[9px] font-black text-error uppercase tracking-widest leading-none">Prioridade</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-black/10 h-48 sm:h-64 rounded-[32px] sm:rounded-[40px] border border-gray-300 dark:border-white/5 animate-pulse" />
              ))
            ) : reports.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center opacity-20">
                <Activity size={40} className="mb-4 text-gray-400 dark:text-white sm:size-12" />
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-center text-gray-400 dark:text-white">Nenhum relato pendente</p>
              </div>
            ) : (
              reports.map((risk) => {
                // Sinal Verde Absoluto: Limpo se não houver dor
                const isClean = (!risk.painLevel || risk.painLevel <= 0);
                if (isClean && risk.status !== 'concluido') {
                  console.log('[TRAINER CARD STATUS] sem dor, aplicando verde');
                }
                const statusColor = isClean ? "emerald-500" : "yellow-500";
                const bgColor = isClean ? "bg-emerald-500/10" : "bg-yellow-500/10";
                const borderColor = isClean ? "border-emerald-500/30" : "border-yellow-500/30";

                return (
                  <motion.div 
                    key={risk.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "bg-white dark:bg-zinc-900 backdrop-blur-2xl p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col items-center text-center gap-4 sm:gap-6 border transition-all duration-500 group relative shadow-lg dark:shadow-3xl overflow-hidden",
                      isClean 
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500" 
                        : "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
                      isClean ? "via-emerald-500/60" : "via-yellow-500/60"
                    )} />
                    
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckReport(risk.id);
                        }}
                        className={cn(
                          "p-1.5 sm:p-2 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/20 rounded-full border border-gray-200 dark:border-white/10 transition-all group/check shadow-lg",
                          isClean ? "hover:bg-emerald-500" : "hover:bg-yellow-500",
                          "hover:text-white dark:hover:text-black"
                        )}
                        title="Arquivar Relato"
                      >
                        <Check size={10} className="sm:size-14 group-hover/check:scale-125 transition-transform" />
                      </button>
                    </div>
                    
                    <div className="relative">
                      <div className={cn(
                        "w-16 h-16 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 transition-all p-1 bg-gray-100 dark:bg-black/50 font-manrope flex items-center justify-center",
                        isClean ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                      )}>
                      <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center">
                        {risk.img && risk.img !== "" ? (
                          <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={risk.img} alt={risk.name} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-surface-container flex items-center justify-center text-gray-900 dark:text-white/40 font-black text-xl sm:text-3xl font-manrope">
                            {risk.name?.charAt(0) || 'A'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isClean && (
                      <div className={cn(
                        "absolute -bottom-1 -right-1 p-1 sm:p-2 rounded-full border-2 border-white dark:border-black z-10",
                        "bg-yellow-500"
                      )}>
                        <TriangleAlert size={10} className="sm:size-14 text-white dark:text-black" />
                      </div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex flex-col items-center gap-0.5 mb-1 sm:mb-2 font-manrope">
                      <p className="text-[13px] sm:text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">{risk.name}</p>
                      
                      {/* Badge de Lesão/Objetivo */}
                      <div className="flex gap-2">
                        <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 rounded border border-gray-200 dark:border-white/10">
                          {risk.lesao?.toUpperCase() || 'NENHUMA LESÃO'}
                        </span>
                      </div>

                      <div className="flex gap-2 items-center mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} className="text-gray-400" />
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
                             {risk.completedAt ? new Date(risk.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                        </div>
                        <span className="w-1 h-1 bg-gray-400/20 rounded-full"></span>
                        <div className="flex items-center gap-1">
                          <Activity size={10} className="text-gray-400" />
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
                            {formatDuration(risk.durationSeconds || ((risk.durationMinutes || 0) * 60))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4 text-center font-manrope">
                      {/* Biofeedback Section */}
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="flex flex-wrap justify-center gap-2">
                          {/* PSE Indicator - Always Visible */}
                          <div className={cn(
                            "inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[7px] sm:text-[8px] font-black uppercase tracking-widest border",
                            getPSEColor(risk.pse || 0)
                          )}>
                            <Zap size={9} sm:size-10 />
                            PSE {risk.pse || 0}/10
                          </div>

                          {/* Pain Indicator - Only if pain exists AND NOT CLEAN */}
                          {!isClean && (risk.painLevel || 0) > 0 && (
                            <div className={cn(
                              "inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[7px] sm:text-[8px] font-black uppercase tracking-widest border border-red-500/30 bg-red-500/10 text-red-500"
                            )}>
                              <AlertTriangle size={9} sm:size-10 />
                              DOR {risk.painLevel}/10
                            </div>
                          )}
                        </div>
                        
                        {/* Comment section - Only if not clean */}
                        {!isClean && (
                          <div className="bg-white/50 dark:bg-black/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-white/5">
                            <p className="text-[9px] sm:text-[10px] font-medium text-gray-600 dark:text-white/60 italic leading-relaxed line-clamp-3">
                              {risk.comment ? `"${risk.comment}"` : "Sem observações."}
                            </p>
                          </div>
                        )}

                        {/* Botão de Sugestão IA - Sutil para Alerta */}
                        {!isClean && !suggestions[risk.id] && (
                          <button 
                            onClick={() => handleAISuggestion(risk)}
                            disabled={suggestingId === risk.id}
                            className="mt-2 w-full py-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-all group/ai"
                          >
                            {suggestingId === risk.id ? (
                              <Loader2 size={12} className="animate-spin text-primary" />
                            ) : (
                              <Sparkles size={12} className="text-primary group-hover/ai:scale-125 transition-transform" />
                            )}
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Analisar com NEXO</span>
                          </button>
                        )}

                        {/* AI Suggestion Section - Only if alert exists */}
                        {!isClean && suggestions[risk.id] && (
                          <div className="mt-2 space-y-2">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-left relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                  <Sparkles size={40} className="text-primary" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <BrainCircuit size={12} className="text-primary" />
                                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">AJUSTE RECOMENDADO</span>
                                </div>
                                <div className="markdown-body text-[10px] text-gray-700 dark:text-white/80 leading-relaxed font-manrope">
                                  <ReactMarkdown>{suggestions[risk.id]}</ReactMarkdown>
                                </div>
                                <button 
                                  onClick={() => setSuggestions(prev => {
                                    const next = { ...prev };
                                    delete next[risk.id];
                                    return next;
                                  })}
                                  className="mt-3 text-[7px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                                >
                                  Refazer Análise
                                </button>
                              </motion.div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelectStudent(risk.studentId, 'prescricao')}
                    className="pt-4 mt-auto border-t border-gray-100 dark:border-white/5 w-full text-[9px] font-black text-gray-400 dark:text-white/20 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    AJUSTAR PRESCRIÇÃO <ChevronRightIcon size={12} />
                  </button>
                </motion.div>
              );
            })
          )}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
};

const ChevronRightIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default TrainerDashboard;
