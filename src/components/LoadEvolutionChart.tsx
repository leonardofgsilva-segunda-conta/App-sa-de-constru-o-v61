import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Loader2, 
  TrendingUp 
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '../lib/utils';
import { dataService, LoadRecord, WorkoutRow } from '../services/dataService';

interface LoadEvolutionChartProps {
  studentId: string;
  workouts: WorkoutRow[];
  theme?: 'dark' | 'light';
}

const MUSCLE_GROUPS = [
  'Peitorais',
  'Costas / dorsal',
  'Quadríceps',
  'Isquiotibiais',
  'Glúteos',
  'Bíceps',
  'Tríceps',
  'Ombros',
  'Core / abdômen',
  'Gastrocnêmios / sóleo',
  'Antebraço'
];

const CHART_COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#A855F7', '#EC4899', '#F97316', '#06B6D4', '#8B5CF6', '#D946EF'];

const getExerciseMuscleGroup = (name: string): string => {
  const n = name.toLowerCase().trim()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
  
  // 1. ISQUIOTIBIAIS (PRIORIDADE TOTAL)
  if (n.includes('flexora') || 
      n.includes('stiff') || 
      n.includes('terra romeno') || 
      n.includes('posterior') || 
      n.includes('isquiotibial') || 
      n.includes('isquiotibiais') || 
      n.includes('biceps femoral') || 
      n.includes('leg curl') || 
      n.includes('hamstring')) {
    return 'Isquiotibiais';
  }

  if (n.includes("supino") || n.includes("crucifixo") || n.includes("crossover") || n.includes("peck deck") || n.includes("voador") || n.includes("peito")) return "Peitorais";
  if (n.includes("puxada") || n.includes("remada") || n.includes("barra fixa") || n.includes("pulldown") || n.includes("serrote") || n.includes("costas") || n.includes("dorsal")) return "Costas / dorsal";
  if (n.includes("agachamento") || n.includes("leg press") || n.includes("extensora") || n.includes("hack") || n.includes("sissy") || n.includes("quadriceps")) return "Quadríceps";
  if (n.includes("glúteo") || n.includes("elevação pélvica") || n.includes("abdutora") || n.includes("quatro apoios") || n.includes("gluteo")) return "Glúteos";
  if (n.includes("rosca") || n.includes("biceps") || n.includes("braquial") || n.includes("bíceps")) return "Bíceps";
  if (n.includes("tríceps") || n.includes("pulley") || n.includes("testa") || n.includes("francês") || n.includes("coice") || n.includes("mergulho") || n.includes("triceps")) return "Tríceps";
  if (n.includes("trapézio") || n.includes("encolhimento") || n.includes("remada alta") || n.includes("ombro") || n.includes("deltoide")) return "Ombros";
  if (n.includes("abdominal") || n.includes("prancha") || n.includes("canivete") || n.includes("infra") || n.includes("supra") || n.includes("core") || n.includes("abdômen")) return "Core / abdômen";
  if (n.includes("panturrilha") || n.includes("gêmeos") || n.includes("sóleo") || n.includes("gastrocnêmio")) return "Gastrocnêmios / sóleo";
  if (n.includes("antebraço") || n.includes("punho")) return "Antebraço";
  return "Outros";
};

const LoadEvolutionChart: React.FC<LoadEvolutionChartProps> = ({ studentId, workouts, theme = 'dark' }) => {
  const [evolutionData, setEvolutionData] = useState<LoadRecord[]>([]);
  const [isEvolutionLoading, setIsEvolutionLoading] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('Peitorais');
  const [selectedPeriod, setSelectedPeriod] = useState('30 dias');

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setIsEvolutionLoading(true);
      try {
        const history = await dataService.getStudentLoadHistory(studentId);
        setEvolutionData(history);
      } catch (error) {
        console.error('Erro ao buscar evolução:', error);
      } finally {
        setIsEvolutionLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const chartData = useMemo(() => {
    if (!evolutionData.length) return { data: [], exercises: [] };

    const filteredByMuscle = evolutionData.filter(record => 
      getExerciseMuscleGroup(record.exercise_name) === selectedMuscleGroup
    );

    if (!filteredByMuscle.length) return { data: [], exercises: [] };

    const now = new Date();
    let startDate = new Date(0);
    
    if (selectedPeriod === '30 dias') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (selectedPeriod === '90 dias') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (selectedPeriod === '180 dias') startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    else if (selectedPeriod === '1 ano') startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    else if (selectedPeriod === 'Ciclo atual') {
        if (workouts.length > 0) {
            const current = workouts[0];
            if (current.start_date) startDate = new Date(current.start_date);
        }
    }

    const filteredByPeriod = filteredByMuscle.filter(record => {
        if (record.weight_value <= 0) return false;
        const d = record.date ? new Date(record.date) : new Date(record.created_at);
        return d >= startDate;
    });

    const dataMap: Record<string, Record<string, number>> = {};
    const exercisesInGroup = new Set<string>();

    filteredByPeriod.forEach(record => {
        const dateStr = (record.date || record.created_at).split('T')[0];
        const exName = record.exercise_name;
        exercisesInGroup.add(exName);

        if (!dataMap[dateStr]) dataMap[dateStr] = {};
        
        if (!dataMap[dateStr][exName] || record.weight_value > dataMap[dateStr][exName]) {
            dataMap[dateStr][exName] = record.weight_value;
        }
    });

    const result = Object.keys(dataMap)
      .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        date: date.split('-').reverse().slice(0, 2).join('/'),
        ...dataMap[date]
      }));

    return { 
        data: result, 
        exercises: Array.from(exercisesInGroup)
    };
  }, [evolutionData, selectedMuscleGroup, selectedPeriod, workouts]);

  const evolutionSummary = useMemo(() => {
    if (!chartData.data || chartData.data.length < 2) return null;
    
    let maxDiff = -1;
    let bestExercise = '';
    let totalDiff = 0;

    chartData.exercises.forEach(ex => {
        const values = chartData.data.map(d => d[ex]).filter(v => v !== undefined);
        if (values.length >= 2) {
            const first = values[0];
            const last = values[values.length - 1];
            const diff = last - first;
            if (diff > maxDiff) {
                maxDiff = diff;
                bestExercise = ex;
            }
            totalDiff += diff;
        }
    });

    if (!bestExercise) return null;

    return {
        totalDiff,
        bestExercise,
        maxDiff
    };
  }, [chartData]);

  return (
    <div className={cn(
      "w-full rounded-[32px] border p-5 sm:p-8 space-y-6 max-w-4xl mx-auto",
      theme === 'dark' ? "bg-white/2 border-white/5" : "bg-white border-gray-100 shadow-sm"
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shadow-xl shadow-amber-500/5">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-0.5">
            <h2 className={cn(
              "text-[18px] sm:text-[20px] font-black uppercase tracking-tight",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>Evolução de Carga</h2>
            <p className={cn(
              "text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.2em]",
              theme === 'dark' ? "text-white/30" : "text-gray-400"
            )}>Análise de Progressão</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['Ciclo atual', '30 dias', '90 dias', 'Tudo'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                selectedPeriod === period
                  ? theme === 'dark' ? "bg-white text-black border-white" : "bg-zinc-900 border-zinc-900 text-white"
                  : theme === 'dark' ? "bg-white/5 border-white/5 text-white/40 hover:bg-white/10" : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-[0.2em]",
          theme === 'dark' ? "text-white/30" : "text-gray-400"
        )}>Grupos Musculares</span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {MUSCLE_GROUPS.map(group => (
            <button
              key={group}
              onClick={() => setSelectedMuscleGroup(group)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                selectedMuscleGroup === group
                  ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : theme === 'dark' ? "bg-white/5 border-white/5 text-white/40" : "bg-gray-100 border-gray-200 text-gray-500"
              )}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {chartData.data.length > 0 && evolutionSummary && (
        <div className={cn(
          "p-5 rounded-[24px] border flex flex-col gap-1.5 relative overflow-hidden",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-zinc-50 border-zinc-200"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={48} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#C5A07D]">{selectedMuscleGroup}</span>
          <div className="flex items-baseline gap-2.5">
            <span className={cn(
              "text-[28px] font-black italic",
              evolutionSummary.totalDiff >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {evolutionSummary.totalDiff >= 0 ? `+${evolutionSummary.totalDiff}` : evolutionSummary.totalDiff}kg
            </span>
            <span className={cn(
              "text-[12px] font-bold uppercase",
              theme === 'dark' ? "text-white/20" : "text-gray-400"
            )}>no período</span>
          </div>
          <p className={cn(
            "text-[13px] sm:text-[14px] font-medium mt-1",
            theme === 'dark' ? "text-white/40" : "text-gray-500"
          )}>
            Maior evolução: <span className={cn("font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{evolutionSummary.bestExercise}</span> ({evolutionSummary.maxDiff}kg)
          </p>
        </div>
      )}

      <div className={cn(
        "p-4 sm:p-6 rounded-[28px] border min-h-[350px] sm:min-h-[420px] relative flex flex-col",
        theme === 'dark' ? "bg-black/20 border-white/5" : "bg-white border-gray-100"
      )}>
        {isEvolutionLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-amber-500" size={28} />
          </div>
        ) : chartData.data.length > 0 ? (
          <>
            <div 
              className={cn(
                "w-full relative overflow-visible",
                isDesktop ? "h-[340px] min-h-[340px] min-w-[320px]" : "flex-1 h-[260px] sm:h-[400px]"
              )}
            >
              <ResponsiveContainer width="100%" height="100%" key={`chart-${selectedMuscleGroup}-${selectedPeriod}-${isDesktop}`}>
                <RechartsLineChart 
                  data={chartData.data} 
                  margin={isDesktop ? { top: 20, right: 40, left: 20, bottom: 30 } : { top: 20, right: 30, left: 10, bottom: 25 }}
                  style={{ overflow: 'visible' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ 
                      fontSize: isDesktop ? 12 : 11, 
                      fontWeight: 900, 
                      fill: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' 
                    }}
                    dy={15}
                    interval={0}
                    minTickGap={20}
                  />
                  <YAxis 
                    width={isDesktop ? 60 : 50}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ 
                      fontSize: isDesktop ? 12 : 11, 
                      fontWeight: 900, 
                      fill: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' 
                    }}
                    tickFormatter={(value) => `${value}kg`}
                    dx={isDesktop ? -10 : -5}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#121212' : '#ffffff', 
                      border: '1px solid rgba(197, 160, 125, 0.4)', 
                      borderRadius: '20px', 
                      fontSize: '12px',
                      boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.4)',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }} 
                    cursor={{ stroke: '#C5A07D', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  {chartData.exercises.map((ex, index) => (
                    <Line 
                      key={ex}
                      type="monotone" 
                      dataKey={ex} 
                      stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                      strokeWidth={isDesktop ? 3 : 4.5}
                      dot={isDesktop ? { r: 5, strokeWidth: 2.5, fill: theme === 'dark' ? '#000' : '#fff', stroke: CHART_COLORS[index % CHART_COLORS.length] } : { r: 6, strokeWidth: 2.5, fill: theme === 'dark' ? '#000' : '#fff', stroke: CHART_COLORS[index % CHART_COLORS.length] }}
                      activeDot={isDesktop ? { r: 7, strokeWidth: 0, fill: CHART_COLORS[index % CHART_COLORS.length] } : { r: 8, strokeWidth: 0, fill: CHART_COLORS[index % CHART_COLORS.length] }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            <div className={cn(
              "mt-8 flex flex-wrap gap-x-8 gap-y-3 px-2 overflow-x-auto pb-2 scrollbar-hide",
              isDesktop ? "justify-start" : ""
            )}>
              <div className="flex flex-col gap-2 min-w-[140px]">
                {chartData.exercises.slice(0, 4).map((ex, idx) => (
                  <div key={ex} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                    />
                    <span className={cn(
                      "text-[12px] font-black uppercase tracking-wider truncate max-w-[200px]",
                      theme === 'dark' ? "text-white/60" : "text-gray-600"
                    )}>
                      {ex}
                    </span>
                  </div>
                ))}
              </div>

              {chartData.exercises.length > 4 && (
                <div className="flex flex-col gap-2 min-w-[140px] border-l-2 pl-8 border-white/5">
                  {chartData.exercises.slice(4, 8).map((ex, idx) => (
                    <div key={ex} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: CHART_COLORS[(idx + 4) % CHART_COLORS.length] }} 
                      />
                      <span className={cn(
                        "text-[12px] font-black uppercase tracking-wider truncate max-w-[200px]",
                        theme === 'dark' ? "text-white/60" : "text-gray-600"
                      )}>
                        {ex}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {chartData.exercises.length > 8 && (
                <div className="flex flex-col gap-2 min-w-[140px] border-l-2 pl-8 border-white/5">
                  {chartData.exercises.slice(8, 12).map((ex, idx) => (
                    <div key={ex} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: CHART_COLORS[(idx + 8) % CHART_COLORS.length] }} 
                      />
                      <span className={cn(
                        "text-[12px] font-black uppercase tracking-wider truncate max-w-[200px]",
                        theme === 'dark' ? "text-white/60" : "text-gray-600"
                      )}>
                        {ex}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/10">
              <BarChart size={24} />
            </div>
            <div className="space-y-1">
              <p className={cn(
                "text-[13px] font-black uppercase tracking-widest text-balance",
                theme === 'dark' ? "text-white/40" : "text-gray-400"
              )}>Sem dados de evolução</p>
              <p className={cn(
                "text-[11px] font-medium max-w-[200px] text-balance",
                theme === 'dark' ? "text-white/20" : "text-gray-300"
              )}>Sem dados de carga para este período.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadEvolutionChart;
