import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  User, 
  Calendar, 
  ChevronRight,
  ClipboardList,
  Target,
  Zap,
  Info,
  Scale,
  Ruler,
  Download
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import { Evaluation, Student } from '../services/dataService';

interface ReportCenterProps {
  student: Student | null;
  evaluation: Evaluation | null;
  history: Evaluation[];
  loading?: boolean;
}

const VO2Gauge: React.FC<{ vo2: number; classification: string }> = ({ vo2, classification }) => {
  const normalizedVO2 = Math.min(Math.max((vo2 - 20) / 50, 0), 1);
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full aspect-[2/1] relative overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full">
          <path 
            d="M 10,50 A 40,40 0 0 1 90,50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="10" 
            className="text-[#1A1A1A]/5"
          />
          <motion.path 
            d="M 10,50 A 40,40 0 0 1 90,50" 
            fill="none" 
            stroke="#C5A07D" 
            strokeWidth="10" 
            strokeDasharray="125.6"
            strokeDashoffset={125.6 * (1 - normalizedVO2)}
            initial={{ strokeDashoffset: 125.6 }}
            animate={{ strokeDashoffset: 125.6 * (1 - normalizedVO2) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <motion.span className="text-4xl font-black text-[#C5A07D] tracking-tighter">{vo2}</motion.span>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] mt-1">{classification}</p>
        </div>
      </div>
    </div>
  );
};

const BMIDiagram: React.FC<{ bmi: number }> = ({ bmi }) => {
  const getBMIPosition = (val: number) => {
    if (!val || isNaN(val) || val === Infinity) return '0%';
    
    // Mapping BMI to colored segments (total width 100%)
    // Segment 1 (Blue): < 18.5 (width 18.5%)
    // Segment 2 (Green): 18.5 - 25 (width 16.5%)
    // Segment 3 (Yellow): 25 - 30 (width 15.0%)
    // Segment 4 (Orange): 30 - 35 (width 25.0%)
    // Segment 5 (Red): > 35 (width 25.0%)

    if (val < 18.5) return `${(val / 18.5) * 18.5}%`;
    if (val < 25) return `${18.5 + ((val - 18.5) / 6.5) * 16.5}%`;
    if (val < 30) return `${35.0 + ((val - 25) / 5) * 15}%`;
    if (val < 35) return `${50.0 + ((val - 30) / 5) * 25}%`;
    return `${Math.min(75.0 + ((val - 35) / 10) * 25, 98)}%`;
  };

  const categories = [
    { label: 'Abaixo', color: 'bg-blue-600' },
    { label: 'Normal', color: 'bg-green-600' },
    { label: 'Sobrepeso', color: 'bg-yellow-500' },
    { label: 'Obeso I', color: 'bg-orange-600' },
    { label: 'Severo', color: 'bg-red-700' },
  ];

  const getBMICategoryIndex = (val: number) => {
    if (val < 18.5) return 0;
    if (val < 25) return 1;
    if (val < 30) return 2;
    if (val < 35) return 3;
    return 4;
  };

  const currentIndex = getBMICategoryIndex(bmi);

  return (
    <div className="w-full">
      <div className="relative h-4 w-full rounded-full flex overflow-hidden mb-6 shadow-md border border-[#1A1A1A]/10 bg-gray-200">
        <div className="h-full bg-blue-600 border-r border-white/20" style={{ width: '18.5%' }} />
        <div className="h-full bg-green-600 border-r border-white/20" style={{ width: '16.5%' }} />
        <div className="h-full bg-yellow-500 border-r border-white/20" style={{ width: '15%' }} />
        <div className="h-full bg-orange-600 border-r border-white/20" style={{ width: '25%' }} />
        <div className="h-full bg-red-700" style={{ width: '25%' }} />
        
        {/* Marker PIN */}
        <motion.div 
          initial={{ left: 0 }}
          animate={{ left: getBMIPosition(bmi) }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="absolute top-0 bottom-0 w-2 bg-[#C5A07D] shadow-[0_0_20px_rgba(197,160,125,1)] z-10 border-x border-white/60"
        />
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {categories.map((cat, i) => (
          <div key={i} className="text-center">
            <p className={cn(
              "text-[8px] font-black uppercase tracking-widest mb-1 transition-all leading-none",
              i === currentIndex ? "text-[#1A1A1A] scale-110" : "text-[#1A1A1A]/20"
            )}>
              {cat.label}
            </p>
            <div className={cn(
              "h-1.5 rounded-full w-full transition-all duration-500",
              cat.color,
              i === currentIndex ? "opacity-100 shadow-sm" : "opacity-30"
            )} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Bar with shadow for "3D" effect
const CustomBar3D = (props: any) => {
  const { fill, x, y, width, height } = props;
  if (!height || isNaN(height)) return null;
  return (
    <g>
      {/* Shadow Bottom-Right */}
      <rect x={x + 5} y={y + 5} width={width} height={height} fill="#000" fillOpacity={0.08} rx={2} />
      {/* Main bar with slight generic shading */}
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />
      {/* Top highlight for glossy look */}
      <rect x={x} y={y} width={width} height={height * 0.15} fill="#fff" fillOpacity={0.12} rx={2} />
      {/* Vertical inner highlight */}
      <rect x={x + 2} y={y + 2} width={width * 0.1} height={height - 4} fill="#fff" fillOpacity={0.15} rx={1} />
    </g>
  );
};

export const ReportCenter: React.FC<ReportCenterProps> = ({ student, evaluation, history, loading }) => {
  const studentAge = useMemo(() => {
    if (!student?.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(student.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [student?.birthDate]);

  const formattedBirthDate = useMemo(() => {
    if (!student?.birthDate) return null;
    return new Date(student.birthDate).toLocaleDateString('pt-BR');
  }, [student?.birthDate]);

  const chartData = useMemo(() => {
    return [...history].reverse().map(ev => ({
      date: new Date(ev.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weight: ev.weight,
      bodyFat: ev.body_fat || 0
    }));
  }, [history]);

  const compositionData = useMemo(() => {
    if (!evaluation) return [];
    
    // Use directly stored values or fallback to calculation
    const w = evaluation.weight || 0;
    const bf_val = evaluation.body_fat || 0;
    
    let fm = evaluation.fat_mass;
    let lm = evaluation.lean_mass;
    
    // Explicitly check for 0 or missing to force calculation
    if ((fm === undefined || fm === 0) && bf_val > 0) fm = w * (bf_val / 100);
    if ((lm === undefined || lm === 0) && fm > 0) lm = w - fm;
    
    // Final sanity defaults
    if (!fm) fm = 0;
    if (!lm) lm = w;

    const total = (lm + fm) || w || 1;
    const lmPercent = ((lm / total) * 100).toFixed(1);
    const fmPercent = ((fm / total) * 100).toFixed(1);

    return [
      { name: 'Massa Magra', value: Number(lm.toFixed(1)), percent: lmPercent, color: '#C5A07D' },
      { name: 'Massa Gorda', value: Number(fm.toFixed(1)), percent: fmPercent, color: '#1A1A1A' }
    ];
  }, [evaluation]);

  const bf = useMemo(() => {
    if (!evaluation) return 0;
    // Prioritize stored body_fat, then calculate from mass if 0
    if (evaluation.body_fat && evaluation.body_fat > 0) return evaluation.body_fat;
    if (evaluation.weight > 0 && evaluation.fat_mass > 0) {
      return (evaluation.fat_mass / evaluation.weight) * 100;
    }
    return evaluation.body_fat || 0;
  }, [evaluation]);

  const bmiVal = useMemo(() => {
    if (!evaluation || !evaluation.weight || !evaluation.height) return 0;
    const h = evaluation.height > 3 ? evaluation.height / 100 : evaluation.height;
    return evaluation.weight / (h * h);
  }, [evaluation]);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (!student) {
    return (
      <div className="py-12 sm:py-20 text-center space-y-4 sm:space-y-6 px-4">
        <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-primary">Report Center</h2>
        <p className="text-gray-500 dark:text-white/40 text-[10px] sm:text-xs max-w-xs sm:max-w-md mx-auto uppercase tracking-widest leading-relaxed">Selecione um aluno para gerar o Relatório de Performance Científica.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 sm:py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Consolidando Dados...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="py-12 sm:py-20 text-center space-y-4 sm:space-y-6 px-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl">
        <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-primary">Nenhuma avaliação encontrada</h2>
        <p className="text-gray-500 dark:text-white/40 text-[10px] sm:text-xs max-w-xs sm:max-w-md mx-auto uppercase tracking-widest leading-relaxed">Realize uma avaliação primeiro para ver os resultados.</p>
      </div>
    );
  }

  const bfStr = evaluation?.weight && evaluation.weight > 0 ? bf.toFixed(1) : '---';
  const bmiStr = bmiVal > 0 ? bmiVal.toFixed(1) : '---';

  return (
    <div className="space-y-12 pb-20">
      <style>{`
        @media print {
          @page { size: A4; margin: 0mm; }
          header, nav, .sidebar, .no-print, .bottom-nav, .search-bar, button, footer { display: none !important; }
          .page-break { break-after: page; page-break-after: always; padding-top: 2rem !important; }
          body { background: #ffffff !important; color: #1A1A1A !important; padding: 0 !important; margin: 0 !important; }
          .report-document {
             display: block !important;
             width: 100% !important;
             max-width: 100% !important;
             margin: 0 !important;
             padding: 40px !important;
             background: #ffffff !important;
             box-shadow: none !important;
             border: none !important;
          }
          .recharts-responsive-container { width: 100% !important; height: 300px !important; min-height: 300px !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Header and Actions */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print px-4 sm:px-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center border border-gray-100 dark:border-white/5 shadow-sm">
            <FileText size={20} className="text-primary sm:size-6" />
          </div>
          <div>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Central de Relatórios</span>
            <h1 className="editorial-title text-2xl sm:text-4xl md:text-5xl mt-0.5 sm:mt-1 text-gray-900 dark:text-white">NEXO REPORT</h1>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="w-full md:w-auto bg-primary text-black px-6 sm:px-8 py-3.5 sm:py-4 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:brightness-110 active:scale-95 transition-all outline-none rounded-xl"
          >
            <Download size={18} />
            Gerar PDF Profissional
          </button>
        </div>
      </section>

      {/* Actual Report Document */}
      <div className="report-document print-content bg-white dark:bg-zinc-900 text-[#1A1A1A] dark:text-white border border-gray-100 dark:border-white/5 shadow-2xl max-w-[1000px] mx-auto overflow-hidden rounded-[40px]">
        
        {/* PAGE 1: Intro and Physical Composition */}
        <section className="page-break min-h-screen p-6 sm:p-12 md:p-16 flex flex-col">
          {/* Header Sober/Professional */}
          <div className="border-b-[1px] border-primary pb-4 sm:pb-8 mb-8 sm:mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
            <div>
              <p className="text-primary font-manrope font-black tracking-[0.2em] sm:tracking-[0.4em] text-[7px] sm:text-[8px] uppercase mb-1 sm:mb-2">Relatório Científico Nexo — Performance de Elite</p>
              <h2 className="text-lg sm:text-xl md:text-2xl font-manrope font-normal text-gray-900 dark:text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">{student.name}</h2>
              {formattedBirthDate && (
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 dark:text-white/40 mt-1">
                  DN: {formattedBirthDate} • {studentAge} ANOS
                </p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-gray-400 dark:text-white/40 font-black tracking-widest text-[7px] sm:text-[8px] uppercase mb-0.5 sm:mb-1">Data de Referência</p>
              <p className="text-primary font-manrope font-bold text-sm sm:text-lg">{new Date(evaluation.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 flex-1">
            {/* Left Column: Anthropometric History */}
            <div className="lg:col-span-12 xl:col-span-8 bg-gray-50/50 dark:bg-black/20 p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between mb-6 sm:mb-10">
                <h3 className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Evolução Antropométrica</h3>
                <Activity size={16} className="text-gray-200 dark:text-white/10" />
              </div>
              <div className="w-full h-[250px] sm:h-[400px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A07D" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#C5A07D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={8} 
                      fontWeight="bold"
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={8} 
                      fontWeight="bold" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', fontSize: '8px', borderRadius: '4px' }}
                      itemStyle={{ color: '#C5A07D', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#C5A07D" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorGold)" 
                      dot={{ fill: '#C5A07D', r: 4, stroke: '#fff' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-8 mt-6 sm:mt-10 justify-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-4 sm:w-6 h-1 bg-[#C5A07D] rounded-full"></div>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60">Massa</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-4 sm:w-6 h-1 bg-amber-500 rounded-full"></div>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60">% Gordura</span>
                </div>
              </div>
            </div>

            {/* Right Column: Key Metrics */}
            <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6 sm:gap-8">
              <div className="bg-gray-900 dark:bg-black p-8 sm:p-10 shadow-lg relative overflow-hidden rounded-2xl sm:rounded-3xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Scale size={80} className="text-white transform rotate-12" />
                </div>
                <span className="text-white/60 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Peso Atual</span>
                <div className="flex items-baseline gap-2 mt-2 sm:mt-4 text-white">
                  <span className="text-5xl sm:text-7xl font-black tracking-tighter">{evaluation.weight}</span>
                  <span className="text-sm sm:text-xl font-bold text-primary">KG</span>
                </div>
              </div>

              <div className="bg-white dark:bg-black/20 p-8 sm:p-10 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden min-h-[120px] sm:min-h-[160px] flex flex-col justify-center rounded-2xl sm:rounded-3xl">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <span className="text-gray-900 dark:text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Gordura Relativa</span>
                  <div className="px-2 py-0.5 sm:py-1 bg-amber-500/10 rounded text-amber-500 text-[6px] sm:text-[7px] font-black tracking-widest uppercase shrink-0">Scientific</div>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tighter shrink-0">{bfStr}%</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-white/20 shrink-0">BF</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {/* 3D Composition Bar Chart */}
            <div className="bg-gray-50/50 dark:bg-black/20 p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-sm rounded-2xl sm:rounded-3xl">
              <h3 className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-10 text-center">Análise de Tecidos</h3>
              <div className="w-full h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compositionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      fontSize={8} 
                      fontWeight="bold" 
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} fontSize={8} stroke="#9ca3af" />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar 
                      dataKey="value" 
                      shape={<CustomBar3D />}
                    >
                      {compositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                {compositionData.map((item, i) => (
                  <div key={i} className="bg-white/50 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                    <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">{item.name}</p>
                    <div className="flex flex-col items-center">
                      <span className="text-lg sm:text-xl font-black" style={{ color: item.color }}>{item.value} <small className="text-[8px] sm:text-[10px] opacity-40">kg</small></span>
                      <span className="text-[8px] sm:text-[10px] font-bold text-gray-400">{item.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BMI Diagram Sync from Assessment */}
            <div className="bg-gray-50/50 dark:bg-black/20 p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-sm rounded-2xl sm:rounded-3xl">
              <h3 className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-10 text-center">IMC (Quetelet)</h3>
              <BMIDiagram bmi={bmiVal} />
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-400">Status Corporal</span>
                <div className="text-right">
                  <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400 block">Resultado</span>
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{bmiStr}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 2: Professional Technical Report */}
        <section className="page-break min-h-screen p-8 sm:p-16 md:p-24 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5 flex flex-col justify-start">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3 sm:gap-4 mb-10 sm:mb-20">
              <div className="w-8 sm:w-12 h-0.5 bg-primary" />
              <h2 className="text-lg sm:text-2xl font-manrope font-black tracking-[0.3em] sm:tracking-[0.5em] text-primary uppercase">Laudo de Avaliação Postural</h2>
            </div>
            
            <div className="space-y-8 sm:space-y-12">
              <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 dark:text-white/40">
                <ClipboardList size={16} className="text-primary" />
                <span>Diagnóstico de Performance Biomecânica</span>
              </div>

              <div 
                className="font-manrope text-sm sm:text-[15px] leading-[1.6] sm:leading-[1.8] text-gray-900 dark:text-white/80 text-justify space-y-6 sm:space-y-8 hyphens-auto"
                style={{ textAlignLast: 'left' }}
              >
                {evaluation.posture_data?.diagnosis ? (
                  evaluation.posture_data.diagnosis
                    .replace(/^LAUDO DE AVALIAÇÃO POSTURAL\s*/i, '')
                    .split('\n\n')
                    .map((paragraph: string, idx: number) => (
                      <p key={idx} className="first-letter:text-4xl sm:first-letter:text-5xl first-letter:font-black first-letter:text-primary first-letter:mr-2 sm:first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]">
                        {paragraph}
                      </p>
                    ))
                ) : (
                  <p className="italic text-gray-400 dark:text-white/20 text-center py-10 sm:py-20 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl">
                    Este relatório carece de diagnóstico técnico para a data especificada.
                  </p>
                )}
              </div>

              {/* Status Summary */}
              <div className="mt-10 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 bg-gray-50 dark:bg-black/40 p-8 sm:p-12 border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl">
                <div>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 block mb-2 sm:mb-4">Status de Estabilidade</span>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary shadow-[0_0_10px_rgba(197,160,125,0.4)]" />
                    <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">CADÊNCIA ESTÁVEL</span>
                  </div>
                </div>
                <div className="sm:border-l border-gray-200 dark:border-white/10 sm:pl-12">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 block mb-2 sm:mb-4">Integridade Cinética</span>
                  <p className="text-xs sm:text-sm font-bold text-primary uppercase">Otimizado para Treinamento</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 3: Cardio and Metria */}
        <section className="bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5 min-h-screen p-6 sm:p-12 md:p-20">
          <div className="border-b-[1px] border-primary pb-4 sm:pb-8 mb-8 sm:mb-16">
            <h2 className="text-lg sm:text-2xl font-manrope font-black tracking-[0.2em] sm:tracking-[0.4em] text-primary uppercase text-center">Eficiência Metabólica & Metria</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-12">
            <div className="md:col-span-12 lg:col-span-5 bg-gray-50 dark:bg-black/40 p-6 sm:p-12 border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl flex flex-col items-center">
              <h3 className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-8 sm:mb-12 text-center whitespace-nowrap">Potência Aeróbica (VO2 Máx)</h3>
              <div className="w-full max-w-[240px]">
                <VO2Gauge 
                  vo2={evaluation.cardio_data?.vo2_max || 0} 
                  classification={evaluation.cardio_data?.classification || 'MUITO FRACO'} 
                />
              </div>
              <div className="mt-8 sm:mt-16 w-full p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Zap size={14} className="text-primary" />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-white/60">Análise de Rendimento</span>
                </div>
                <p className="text-[10px] sm:text-xs leading-relaxed text-gray-600 dark:text-white/70 font-medium">
                  Seu índice metabólico é classificado como <strong className="text-primary">{evaluation.cardio_data?.classification}</strong>.
                </p>
              </div>
            </div>

            <div className="md:col-span-12 lg:col-span-7 bg-white dark:bg-black/20 p-6 sm:p-12 border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl">
              <h3 className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-10 text-center whitespace-nowrap">Antropometria Segmentar (cm)</h3>
              <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-[9px] sm:text-[11px] uppercase font-bold tracking-[0.1em]">
                    <thead>
                      <tr className="bg-gray-900 dark:bg-black text-white">
                        <th className="py-4 sm:py-5 px-4 sm:px-6 font-black tracking-[0.2em]">Segmento</th>
                        <th className="py-4 sm:py-5 px-4 sm:px-6 text-right">Metria</th>
                        <th className="py-4 sm:py-5 px-4 sm:px-6 text-right">Evol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {Object.entries(evaluation.perimeters || {}).map(([key, rawVal]) => {
                        const val = Array.isArray(rawVal) ? (rawVal[0] as number) : (rawVal as number);
                        const prevRawVal = history[1]?.perimeters?.[key as keyof typeof evaluation.perimeters];
                        const prevVal = Array.isArray(prevRawVal) ? (prevRawVal[0] as number) : (prevRawVal as number) || val;
                        const diffNum = ((val - prevVal) / (prevVal || 1) * 100);
                        const diff = diffNum.toFixed(1);
                        return (
                          <tr key={key} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                            <td className="py-4 sm:py-5 px-4 sm:px-6 text-gray-500 dark:text-white/60 font-black">{key.replace('Dir', ' D.').replace('Esq', ' E.')}</td>
                            <td className="py-4 sm:py-5 px-4 sm:px-6 text-right font-black text-gray-900 dark:text-white">{val} cm</td>
                            <td className={cn(
                              "py-4 sm:py-5 px-4 sm:px-6 text-right font-black",
                              diffNum > 0 ? 'text-amber-500' : diffNum < 0 ? 'text-red-500' : 'text-gray-300'
                            )}>
                              {diffNum > 0 ? '+' : ''}{diff}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-8 sm:mt-10 p-4 sm:p-5 bg-gray-50 dark:bg-white/5 border-l-4 border-primary text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-500 dark:text-white/40 leading-relaxed font-bold rounded-r-xl">
                As métricas seguem os protocolos ISAK.
              </p>
            </div>
          </div>

          {/* Footer Assinado Professional */}
          <div className="mt-16 sm:mt-24 pt-10 sm:pt-16 border-t border-gray-100 dark:border-white/5 flex flex-col items-center">
            <div className="text-center">
              <div className="w-32 sm:w-56 h-[1.5px] bg-primary/20 mx-auto mb-4 sm:mb-6" />
              <p className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-primary">NEXO SCIENCE PROTOCOL</p>
              <p className="text-[8px] sm:text-[9px] mt-3 sm:mt-4 text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold">Documento Validado Digitalmente</p>
              <div className="mt-6 sm:mt-8 opacity-10 grayscale brightness-0 dark:invert">
                <img src="https://picsum.photos/seed/nexo/160/40" alt="Seal" className="h-8 sm:h-10 mx-auto" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
