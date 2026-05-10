import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Search,
  ClipboardList,
  Dumbbell,
  User,
  Bike,
  Timer,
  MapPin,
  ChevronDown,
  X,
  Zap,
  BarChart2,
  Copy,
  Users,
  Check,
  Loader2,
  Trophy,
  Waves,
  Flame,
  Sword,
  Target,
  Music,
  Calendar,
  Layers,
  ZapOff,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Pencil,
  BarChart as BarChartIcon,
  ChevronRight,
  ChevronLeft,
  Scale,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import AnatomicalModel from './AnatomicalModel';
import LoadEvolutionChart from './LoadEvolutionChart';
import { cn } from '../lib/utils';
import { dataService, Student, Evaluation, PeriodizationData, MesoCycle, LoadRecord, WorkoutRow } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { geminiService } from '../services/geminiService';

// --- Constants & Data ---

const EXERCISE_MAP: Record<string, string> = {
  // Strict priority mapping
  'remada': 'Costas',
  'puxada': 'Costas',
  'pulldown': 'Costas',
  'dorsal': 'Costas',
  'supino': 'Peitorais',
  'crucifixo': 'Peitorais',
  'peitoral': 'Peitorais',
  'agachamento': 'Quadriceps',
  'leg': 'Quadriceps',
  'extensora': 'Quadriceps',
  'elevacao lateral': 'Ombros',
  'elevacao frontal': 'Ombros',
  'desenvolvimento': 'Ombros',
  
  // Secondary mapping
  'peck deck': 'Peitorais',
  'voador': 'Peitorais',
  'flexao': 'Peitorais',
  'hack': 'Quadriceps',
  'sissy': 'Quadriceps',
  'afundo': 'Quadriceps',
  'passada': 'Quadriceps',
  'serrote': 'Costas',
  'barra fixa': 'Costas',
  'chin up': 'Costas',
  'militar': 'Ombros',
  'arnold': 'Ombros',
  'face pull': 'Ombros',
  'rosca': 'Biceps',
  'martelo': 'Biceps',
  'scott': 'Biceps',
  'triceps': 'Triceps',
  'paralelas': 'Triceps',
  'mergulho': 'Triceps',
  'testa': 'Triceps',
  'frances': 'Triceps',
  'pulley': 'Triceps',
  'terra': 'Biceps Femoral',
  'stiff': 'Biceps Femoral',
  'flexora': 'Biceps Femoral',
  'good morning': 'Biceps Femoral',
  'deadlift': 'Biceps Femoral',
  'panturrilha': 'Gastrocnemios',
  'gemeos': 'Gastrocnemios',
  'encolhimento': 'Ombros',
  'abdominal': 'Core',
  'prancha': 'Core',
  'leg raise': 'Core',
  'gluteo': 'Gluteo',
  'elevacao pelvica': 'Gluteo',
  'abdutora': 'Gluteo',
  'elevacao': 'Ombros',
  'mobilidade': 'Mobilidade',
  'alongamento': 'Alongamento',
};

const JOINT_MUSCLE_MAP: Record<string, string[]> = {
  'Joelho': ['Quadriceps', 'Biceps Femoral', 'Gastrocnemios'],
  'Lombar': ['Core', 'Costas', 'Gluteo'],
  'Ombro': ['Ombros', 'Peitorais', 'Costas'],
  'Cotovelo': ['Triceps', 'Biceps', 'Ombros'],
  'Punho': ['Biceps', 'Triceps'],
  'Quadril': ['Gluteo', 'Quadriceps', 'Biceps Femoral'],
  'Tornozelo': ['Gastrocnemios'],
  'Cervical': ['Ombros', 'Core']
};

const guessMuscleGroup = (name: string): string | null => {
  const lowerName = name.trim().toLowerCase();
  if (!lowerName) return null;
  
  const stems = Object.entries(EXERCISE_MAP);
  for (const [key, muscleId] of stems) {
    if (lowerName.includes(key)) return muscleId;
  }
  return null;
};

const INITIAL_EXERCISE_LIBRARY: { name: string; muscle_id: string }[] = [];

const MUSCLE_GROUPS = [
  { id: 'Peitorais', name: 'Peitorais' },
  { id: 'Costas', name: 'Costas' },
  { id: 'Ombros', name: 'Ombros' },
  { id: 'Biceps', name: 'Bíceps' },
  { id: 'Triceps', name: 'Tríceps' },
  { id: 'Quadriceps', name: 'Quadríceps' },
  { id: 'Isquiotibiais', name: 'Isquiotibiais' },
  { id: 'Gluteo', name: 'Glúteo' },
  { id: 'Gastrocnemios', name: 'Gastrocnêmios' },
  { id: 'Core', name: 'Core' },
];

const MODALITIES = [
  { name: 'Musculação', icon: Dumbbell },
  { name: 'Natação', icon: Waves },
  { name: 'Corrida', icon: Zap },
  { name: 'Cardio', icon: Activity },
  { name: 'Crossfit', icon: Sword },
  { name: 'Tênis', icon: Target },
  { name: 'Vôlei', icon: Users },
];

const MODALITY_CONFIGS: Record<string, {
  color: string;
  fieldColor: string;
  fields: { key: keyof Exercise; label: string; type: 'number' | 'text' | 'select' }[];
}> = {
  'Musculação': {
    color: 'border-primary/20 dark:border-[#C5A07D]/10 hover:border-primary/50 dark:hover:border-[#C5A07D]/30',
    fieldColor: 'text-primary',
    fields: [
      { key: 'sets', label: 'Séries', type: 'number' },
      { key: 'reps', label: 'Reps', type: 'text' },
      { key: 'load', label: 'Carga', type: 'number' },
      { key: 'rest', label: 'Pausa', type: 'text' },
    ]
  },
  'Natação': {
    color: 'border-blue-500/20 hover:border-blue-500/50',
    fieldColor: 'text-blue-500',
    fields: [
      { key: 'sets', label: 'Séries', type: 'number' },
      { key: 'meters', label: 'Metros', type: 'number' },
      { key: 'tempo', label: 'Tempo', type: 'text' },
      { key: 'rest', label: 'Descanso', type: 'text' },
    ]
  },
  'Corrida': {
    color: 'border-orange-500/20 hover:border-orange-500/50',
    fieldColor: 'text-orange-500',
    fields: [
      { key: 'distancia', label: 'Distância', type: 'text' },
      { key: 'tempo', label: 'Tempo', type: 'text' },
      { key: 'ritmo', label: 'Ritmo', type: 'text' },
      { key: 'rest', label: 'Descanso', type: 'text' },
    ]
  },
  'Cardio': {
    color: 'border-cyan-500/20 hover:border-cyan-500/50',
    fieldColor: 'text-cyan-500',
    fields: [
      { key: 'tempo', label: 'Tempo', type: 'text' },
      { key: 'intensity', label: 'Intensidade', type: 'text' },
      { key: 'distancia', label: 'Distância', type: 'text' },
    ]
  },
  'Crossfit': {
    color: 'border-red-500/20 hover:border-red-500/50',
    fieldColor: 'text-red-500',
    fields: [
      { key: 'rounds', label: 'Rounds', type: 'number' },
      { key: 'reps', label: 'Reps', type: 'text' },
      { key: 'tempo', label: 'Tempo', type: 'text' },
    ]
  },
  'Tênis': {
    color: 'border-lime-500/20 hover:border-lime-500/50',
    fieldColor: 'text-lime-500',
    fields: [
      { key: 'duration', label: 'Duração', type: 'number' },
      { key: 'intensity', label: 'Intensidade', type: 'text' },
      { key: 'foco', label: 'Foco', type: 'text' },
    ]
  },
  'Vôlei': {
    color: 'border-yellow-500/20 hover:border-yellow-500/50',
    fieldColor: 'text-yellow-500',
    fields: [
      { key: 'duration', label: 'Duração', type: 'number' },
      { key: 'intensity', label: 'Intensidade', type: 'text' },
      { key: 'saltos', label: 'Saltos', type: 'number' },
    ]
  }
};

const WORKOUT_DIVISIONS = ['A', 'B', 'C', 'D', 'E'];

// --- Types ---

interface Exercise {
  id: string;
  name: string;
  type?: 'resistido' | 'cardio';
  muscleId: string;
  // Resistido fields / Generic fields for modalities
  sets?: number;
  reps?: string;
  load?: number;
  rest?: string;
  // Cardio fields / Additional modality fields
  intensity?: string;
  duration?: number; // in minutes
  objective?: string;
  // Custom Modality Fields
  meters?: number;
  distancia?: string;
  tempo?: string;
  ritmo?: string;
  rounds?: number;
  foco?: string;
  saltos?: number;
  // Shared fields
  notes?: string;
  weightHistory: number[];
  mesoId?: string;
  microIndex?: number;
  showNotes?: boolean;
}

const isAtRisk = (ex: Exercise, joint: string | null) => {
  if (!joint || ex.type === 'cardio') return false;
  const involvedMuscles = JOINT_MUSCLE_MAP[joint] || [];
  // Basic substring check for joint names as well
  if (ex.name.toLowerCase().includes(joint.toLowerCase())) return true;
  return involvedMuscles.includes(ex.muscleId);
};

interface ModalityBlock {
  id: string;
  modality: string;
  exercises: Exercise[];
}

interface WorkoutDivision {
  name: string;
  exercises?: Exercise[];
  blocks?: ModalityBlock[];
}

interface DailyLog {
  id: string;
  date: string;
  modality: string;
  value: number; 
  intensity: string;
  rpe: number;
  painPoints: string[];
}

interface MuscleData {
  volume: number;
  hasPain: boolean;
  isFatigued?: boolean;
}

const INITIAL_PERIODIZATION: PeriodizationData = {
  currentMesoId: null,
  currentMicroIndex: 0,
  mesocycles: [
    { id: '1', name: 'Adaptação', type: 'adaptacao', durationWeeks: 4 },
  ]
};

const PHASE_THEME = {
  recuperacao: { bg: "bg-[#22C55E]", border: "border-[#22C55E]/30", glow: "shadow-[#22C55E]/20" },
  adaptacao: { bg: "bg-[#EAB308]", border: "border-[#EAB308]/30", glow: "shadow-[#EAB308]/20" },
  hipertrofia: { bg: "bg-[#F97316]", border: "border-[#F97316]/30", glow: "shadow-[#F97316]/20" },
  forca_maxima: { bg: "bg-[#EF4444]", border: "border-[#EF4444]/30", glow: "shadow-[#EF4444]/20" },
  potencia: { bg: "bg-[#A855F7]", border: "border-[#A855F7]/30", glow: "shadow-[#A855F7]/20" },
  choque: { bg: "bg-[#881337]", border: "border-[#881337]/30", glow: "shadow-[#881337]/20" },
  manutencao: { bg: "bg-[#3B82F6]", border: "border-[#3B82F6]/30", glow: "shadow-[#3B82F6]/20" },
  especifico: { bg: "bg-[#06B6D4]", border: "border-[#06B6D4]/30", glow: "shadow-[#06B6D4]/20" },
};

const PeriodizationModule = ({ data, onUpdate }: { data: PeriodizationData, onUpdate: (data: PeriodizationData) => void }) => {
  const addCycle = () => {
    const newMeso: MesoCycle = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Novo Ciclo',
      type: 'adaptacao',
      durationWeeks: 4
    };
    onUpdate({
      ...data,
      mesocycles: [...data.mesocycles, newMeso]
    });
  };

  const removeCycle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...data,
      mesocycles: data.mesocycles.filter(m => m.id !== id),
      currentMesoId: data.currentMesoId === id ? null : data.currentMesoId
    });
  };

  const updateMeso = (id: string, updates: Partial<MesoCycle>) => {
    onUpdate({
      ...data,
      mesocycles: (data?.mesocycles || []).map(m => m.id === id ? { ...m, ...updates } : m)
    });
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence>
          {(data?.mesocycles || []).map((meso) => {
            const isCurrentMeso = data?.currentMesoId === meso.id;
            
            return (
              <motion.div
                key={meso.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "relative p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border-2 transition-all duration-500 group overflow-hidden bg-surface-container shadow-xl",
                  isCurrentMeso ? "border-primary shadow-primary/20" : cn("border-white/5", PHASE_THEME[meso.type].border, PHASE_THEME[meso.type].glow)
                )}
              >
                {/* Intensidade Line at Top */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 sm:h-2 transition-all duration-500",
                  isCurrentMeso ? "opacity-100" : "opacity-40",
                  PHASE_THEME[meso.type].bg
                )} />
                
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                   <select 
                    value={meso.type} 
                    onChange={e => updateMeso(meso.id, { type: e.target.value as any })}
                    className={cn(
                      "text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-none outline-none cursor-pointer text-white shadow-lg transition-all",
                      PHASE_THEME[meso.type].bg
                    )}
                  >
                    <option value="recuperacao">Recuperação</option>
                    <option value="adaptacao">Adaptação</option>
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="forca_maxima">Força Máxima</option>
                    <option value="potencia">Potência</option>
                    <option value="choque">Choque</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="especifico">Específico</option>
                  </select>
                  
                  <button 
                    onClick={(e) => removeCycle(meso.id, e)}
                    className="p-1.5 sm:p-2 hover:bg-error/20 rounded-xl transition-all text-on-surface-variant hover:text-error"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <input
                    value={meso.name}
                    onChange={e => updateMeso(meso.id, { name: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-lg sm:text-xl font-black uppercase tracking-tight text-on-surface placeholder:text-white/20"
                    placeholder="Nome do Ciclo"
                  />
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Duração</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={meso.durationWeeks}
                      onChange={e => updateMeso(meso.id, { durationWeeks: parseInt(e.target.value) || 1 })}
                      className="bg-black/40 border border-white/10 rounded-lg px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-black text-primary w-12 sm:w-16 text-center outline-none focus:border-primary/50"
                    />
                    <span className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant/40 uppercase">Semanas</span>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {Array.from({ length: meso.durationWeeks }).map((_, weekIdx) => {
                        const isSelectedWeek = isCurrentMeso && data.currentMicroIndex === weekIdx;
                        return (
                          <button
                            key={weekIdx}
                            onClick={() => onUpdate({ ...data, currentMesoId: meso.id, currentMicroIndex: weekIdx })}
                            className={cn(
                              "w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[9px] sm:text-[10px] font-black flex items-center justify-center transition-all border-2",
                              isSelectedWeek 
                                ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-105 sm:scale-110 z-10" 
                                : "bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20"
                            )}
                          >
                            S{weekIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        <button
          onClick={addCycle}
          className="h-full min-h-[180px] sm:min-h-[220px] rounded-[24px] sm:rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 sm:gap-4 group hover:border-primary/50 hover:bg-primary/5 transition-all text-on-surface-variant hover:text-primary p-6 sm:p-8"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-xl sm:rounded-[24px] flex items-center justify-center group-hover:bg-primary/10 transition-all">
            <Plus size={32} />
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-center">Adicionar Ciclo</span>
        </button>
      </div>

      <div className="pt-16 sm:pt-24 border-t border-white/5 flex flex-col items-center gap-4 sm:gap-6 opacity-40">
        <div className="w-12 sm:w-16 h-[1.5px] sm:h-[2px] bg-primary/40 rounded-full"></div>
        <div className="text-center space-y-1.5 sm:space-y-2">
          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-primary leading-tight">NEXO — CIÊNCIA INTEGRADA</p>
          <p className="text-[9px] sm:text-[11px] font-medium text-on-surface-variant italic tracking-wide">Planejamento Estratégico de Alta Performance</p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 pt-3 sm:pt-4">
            <div className="h-[1px] w-6 sm:w-8 bg-white/10"></div>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Selo de Excelência Científica</span>
            <div className="h-[1px] w-6 sm:w-8 bg-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RestTimer = ({ onComplete }: { onComplete?: () => void }) => {
  const [seconds, setSeconds] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [initialSeconds, setInitialSeconds] = useState(60);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      onComplete?.();
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, onComplete]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(initialSeconds);
    setIsActive(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 bg-surface-container-high p-4 sm:p-6 rounded-xl sm:rounded-2xl thin-border shadow-2xl">
      <div className="text-3xl sm:text-4xl font-black text-primary font-mono tabular-nums leading-none">
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
      </div>
      <div className="flex gap-2">
        <button onClick={toggle} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-on-primary text-[8px] sm:text-[10px] font-black uppercase rounded-lg">
          {isActive ? 'Pausar' : 'Iniciar'}
        </button>
        <button onClick={reset} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 text-on-surface text-[8px] sm:text-[10px] font-black uppercase rounded-lg">
          Reset
        </button>
      </div>
      <div className="flex gap-1.5 sm:gap-2 mt-1 sm:mt-2">
        {[30, 45, 60, 90].map(s => (
          <button 
            key={s} 
            onClick={() => { setSeconds(s); setInitialSeconds(s); setIsActive(false); }}
            className={cn("px-1.5 sm:px-2 py-1 text-[7px] sm:text-[8px] font-black rounded border transition-all", initialSeconds === s ? "border-primary text-primary" : "border-white/10 text-on-surface-variant")}
          >
            {s}s
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---

const Prescription: React.FC<{ 
  studentId?: string | null, 
  onSelectStudent?: (id: string) => void,
  highlightedJoint?: string | null
}> = ({ studentId, onSelectStudent, highlightedJoint }) => {
  const [activeDivision, setActiveDivision] = useState('A');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [rawWorkoutRows, setRawWorkoutRows] = useState<WorkoutRow[]>([]);
  const [workouts, setWorkouts] = useState<Record<string, WorkoutDivision>>({
    'A': { name: 'Treino A', exercises: [] }
  });
  const [editingDivision, setEditingDivision] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [initialVolumes, setInitialVolumes] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModality, setSelectedModality] = useState(MODALITIES[0]);
  const [library, setLibrary] = useState<{name: string, muscle_id: string}[]>([]);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [newLibraryExercise, setNewLibraryExercise] = useState({ name: '', muscle_id: 'peitorais' });
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const [periodization, setPeriodization] = useState<PeriodizationData>(INITIAL_PERIODIZATION);
  const [showModalitySelector, setShowModalitySelector] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ficha' | 'periodizacao' | 'historico'>('ficha');
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [historyViewDate, setHistoryViewDate] = useState(new Date());

  const historyStats = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthsFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const viewMonth = historyViewDate.getMonth();
    const viewYear = historyViewDate.getFullYear();
    
    const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
    const lastMonth = prevMonthDate.getMonth();
    const lastMonthYear = prevMonthDate.getFullYear();

    let currentMonthCount = 0;
    let lastMonthCount = 0;

    const last6Months: { name: string, month: number, year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - i, 1);
      last6Months.push({
        name: months[d.getMonth()],
        month: d.getMonth(),
        year: d.getFullYear()
      });
    }

    const chartData = last6Months.map(m => ({ 
      name: m.name, 
      year: m.year,
      count: 0 
    }));

    timelineItems.forEach(record => {
      const date = new Date(record.raw_date || record.date);
      if (isNaN(date.getTime())) return;
      
      const m = date.getMonth();
      const y = date.getFullYear();

      if (m === viewMonth && y === viewYear) currentMonthCount++;
      if (m === lastMonth && y === lastMonthYear) lastMonthCount++;

      const chartIdx = last6Months.findIndex(lm => lm.month === m && lm.year === y);
      if (chartIdx !== -1) {
        chartData[chartIdx].count++;
      }
    });

    const diff = currentMonthCount - lastMonthCount;
    const diffText = diff >= 0 ? `↑ +${diff}` : `↓ ${diff}`;

    return { 
      currentMonth: currentMonthCount, 
      lastMonth: lastMonthCount, 
      diff, 
      diffText,
      chartData,
      currentMonthName: monthsFull[viewMonth],
      currentYear: viewYear,
      lastMonthName: monthsFull[lastMonth]
    };
  }, [timelineItems, historyViewDate]);

  const handlePrevMonth = () => {
    setHistoryViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setHistoryViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const filteredDailyHistory = useMemo(() => {
    const selectedDateStr = historyViewDate.toISOString().split('T')[0];
    return timelineItems
      .filter(h => {
        const recordDate = new Date(h.raw_date || h.date);
        return recordDate.toISOString().split('T')[0] === selectedDateStr;
      })
      .sort((a, b) => {
        if (a.type === 'external' && b.type !== 'external') return -1;
        if (a.type !== 'external' && b.type === 'external') return 1;
        return new Date(b.raw_date || b.date).getTime() - new Date(a.raw_date || a.date).getTime();
      });
  }, [timelineItems, historyViewDate]);
  
  const fetchTimeline = async (studentId: string) => {
    setIsLoadingTimeline(true);
    try {
      const history = await dataService.getStudentCheckinHistory(studentId);
      
      // Filtramos duplicatas: se temos um registro em workout_history para o mesmo dia/aluno
      // que não seja externo, preferimos ele ao checkin genérico.
      const processedItems = history.reduce((acc: any[], current: any) => {
        if (current.type === 'internal' && current.label === 'Treino Prescrito') {
          const dateStr = new Date(current.date).toISOString().split('T')[0];
          const hasSpecificHistory = history.some((h: any) => 
            h.id !== current.id && 
            h.type === 'internal' && 
            h.label && h.label.startsWith('Treino ') && 
            h.label !== 'Treino Prescrito' &&
            new Date(h.date).toISOString().split('T')[0] === dateStr
          );
          if (hasSpecificHistory) return acc;
        }
        acc.push(current);
        return acc;
      }, []);

      const items = processedItems.map((h: any) => {
        const isExternal = h.type === 'external';
        const workoutType = h.workout_type || h.label?.split('Treino ')[1] || '';
        const mainLabel = isExternal ? h.modality.toUpperCase() : `TREINO ${workoutType}`.toUpperCase();
        
        const dateText = new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const durationText = h.duration ? dataService.formatTime(h.duration) : '';
        const metricText = (h.metric_value !== undefined && h.metric_value !== null) ? `${h.metric_value} ${h.metric_type || ''}` : '';
        
        let subtext = `${dateText}`;
        if (isExternal && metricText) {
          subtext += ` • ${metricText}`;
        } else if (!isExternal && durationText) {
          subtext += ` • ${durationText}`;
        }

        return {
          id: h.id,
          date: subtext, // "DATA • DURAÇÃO/MÉTRICA"
          fase: mainLabel, // "NATAÇÃO" ou "TREINO A"
          status: isExternal ? h.intensity?.toUpperCase() : null,
          evol: isExternal ? 'EXTERNO' : 'INTERNO',
          evolColor: isExternal ? 'text-amber-500' : 'text-primary',
          type: h.type,
          raw_date: new Date(h.date)
        };
      });

      setTimelineItems(items);
    } catch (error) {
      console.error("Erro ao buscar timeline:", error);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const [modalitySearch, setModalitySearch] = useState('');
  const [showModalityAutocomplete, setShowModalityAutocomplete] = useState(false);
  const [newExercise, setNewExercise] = useState<{
    name: string;
    muscleId: string;
    sets: number;
    reps: string;
    type: 'resistido' | 'cardio';
    intensity: 'leve' | 'moderada' | 'alta';
    duration: number;
    objective: string;
  }>({ 
    name: '', 
    muscleId: 'peitorais', 
    sets: 3, 
    reps: '12',
    type: 'resistido',
    intensity: 'moderada',
    duration: 20,
    objective: ''
  });
  const [newLog, setNewLog] = useState({ value: 0, intensity: 'Moderada', rpe: 7, painPoints: [] as string[] });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const generateAiSuggestion = async () => {
    if (!selectedStudent) return;

    const posturalDeviations = latestEvaluation?.posture_data ? [
      ...latestEvaluation.posture_data.anterior.deviations,
      ...latestEvaluation.posture_data.posterior.deviations,
      ...latestEvaluation.posture_data.lateralDir.deviations,
      ...latestEvaluation.posture_data.lateralEsq.deviations
    ].filter((v, i, a) => a.indexOf(v) === i) : [];

    const posturalDiagnosis = latestEvaluation?.posture_data?.diagnosis || 'Nenhuma observação técnica registrada.';

    if (!selectedStudent.lesao && posturalDeviations.length === 0) {
      toast.error('Nenhuma lesão ou desvio postural registrado para este aluno.');
      return;
    }

    setIsGeneratingAi(true);
    setAiSuggestion(null); 
    try {
      const prompt = `Você é o Diretor Técnico da NEXO — CIÊNCIA INTEGRADA, autoridade absoluta em Fisiologia do Exercício e Biomecânica de Elite. Sua função é auditar prescrições de treino garantindo segurança máxima e performance otimizada.

DADOS CRÍTICOS DO PACIENTE/ALUNO:
- NOME: ${selectedStudent.name}
- OBJETIVO: ${selectedStudent.goal}
- COLUNA 'LESÃO': "${selectedStudent.lesao || 'Nenhuma registrada'}"
- DESVIOS POSTURAIS (AVALIAÇÃO): "${posturalDeviations.join(', ') || 'Nenhum'}"
- DIAGNÓSTICO POSTURAL: "${posturalDiagnosis}"
- OBSERVAÇÕES ADICIONAIS: "${selectedStudent.observacoes || 'Nenhuma'}"

TREINO ATUAL QUE ESTÁ SENDO ANALISADO (${workouts[activeDivision]?.name}):
${(workouts[activeDivision]?.exercises || []).length > 0 
  ? (workouts[activeDivision]?.exercises || []).map((e, idx) => `${idx + 1}. ${e.name} (${e.muscleId}): ${e.sets}x${e.reps} - Carga: ${e.load || 0}kg`).join('\n')
  : 'Nenhum exercício adicionado ainda.'}

SUA MISSÃO - ESTRUTURA DA RESPOSTA:

1. 🚩 ALERTA DE SEGURANÇA (ESTRITO): 
Identifique se algum exercício acima oferece risco direto para a lesão específica. Explique o porquê com base na biomecânica.

2. 💎 SUGESTÕES DE ALTERAÇÃO (PRÁTICO):
Diga exatamente qual exercício deve ser trocado por qual e por quê.

3. ⚙️ PROTOCOLO DE PROTEÇÃO:
Sugira ajustes em amplitude, cadência ou volume para os exercícios que permanecem.

4. 🧠 FUNDAMENTAÇÃO NEXO:
Dê uma breve explicação científica de por que estas adaptações previnem a reincidência da lesão e aceleram o resultado.

IMPORTANTE: Use um tom extremamente técnico, autoritário e elegante. Formate com TÍTULOS EM NEGRITO e use CAPS LOCK nos cabeçalhos de seção. Use emojis técnicos (⚙️, 🧠, 🚩) de forma moderada.`;

      const text = await geminiService.askAI(prompt);

      setAiSuggestion(text || "Não foi possível gerar uma sugestão no momento.");
    } catch (error: any) {
      console.error('AI Error:', error);
      if (error.message.includes('API_KEY')) {
        setAiSuggestion(
          "🚩 SISTEMA DE IA DESATIVADO\n\n" +
          "A chave de API do Gemini não foi configurada no ambiente (GEMINI_API_KEY no servidor). " +
          "Por favor, entre em contato com o administrador do sistema.\n\n" +
          "⚙️ FUNCIONALIDADE TEMPORARIAMENTE INDISPONÍVEL"
        );
      } else {
        toast.error('Erro ao gerar análise do professor.');
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const [historyExercise, setHistoryExercise] = useState<Exercise | null>(null);
  const [loadHistory, setLoadHistory] = useState<LoadRecord[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ weight_value: number, reps: number }>({ weight_value: 0, reps: 0 });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [oneRMValue, setOneRMValue] = useState<number>(0);
  const [isSavingPR, setIsSavingPR] = useState(false);
  const [exercisePRs, setExercisePRs] = useState<any[]>([]);
  const [expandedPR, setExpandedPR] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudent) {
      dataService.getStudentPRs(selectedStudent.id).then(prs => {
        setExercisePRs(prs);
      });

      // Sincronização em tempo real dos Recordes (PR)
      // Robustez: Remover canal existente antes de criar novo
      supabase.removeChannel(supabase.channel(`user_records_sync_${selectedStudent.id}`));
      
      const channel = supabase
        .channel(`user_records_sync_${selectedStudent.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_records',
            filter: `student_id=eq.${selectedStudent.id}`
          },
          () => {
            dataService.getStudentPRs(selectedStudent.id).then(setExercisePRs);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setExercisePRs([]);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (historyExercise && selectedStudent) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          // Sync 1RM from the Single Source of Truth state
          const currentPR = exercisePRs.find(p => p.exercise_id === historyExercise.id);
          if (currentPR) {
            setOneRMValue(currentPR.one_rm);
          }

          console.log(`[SHARED LOAD HISTORY] usado na página do professor`);
          const allHistory = await dataService.getStudentLoadHistory(selectedStudent.id);
          
          // Filtragem local para manter a mesma lógica de "exercise_id OR exercise_name"
          const history = allHistory.filter(r => 
            (historyExercise.id && r.exercise_id === historyExercise.id) || 
            (r.exercise_name === historyExercise.name)
          );
          
          setLoadHistory(history);
          
          // Fallback to history if no PR in user_records yet
          if (!currentPR) {
            const latestPR = history.find(r => r.is_pr);
            if (latestPR) {
              setOneRMValue(latestPR.weight_value);
            } else {
              setOneRMValue(0);
            }
          }
        } catch (error) {
          toast.error("Erro ao carregar histórico");
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setLoadHistory([]);
      setEditingRecordId(null);
      setOneRMValue(0);
    }
  }, [historyExercise, selectedStudent]);

  const handleSavePR = async () => {
    if (!historyExercise || !selectedStudent || oneRMValue <= 0) {
      toast.error("Insira um valor de PR válido");
      return;
    }

    setIsSavingPR(true);
    try {
      // Single Source of Truth: user_records
      await dataService.saveExercisePR(selectedStudent.id, historyExercise.id, oneRMValue, historyExercise.name);
      
      // Sincronização: Garante que após o salvamento, a função de busca seja chamada novamente
      const freshPRs = await dataService.getStudentPRs(selectedStudent.id);
      setExercisePRs(freshPRs);
      
      // Also save to load_history for history tracking
      const newRecord = await dataService.saveLoadRecord({
        student_id: selectedStudent.id,
        exercise_id: historyExercise.id,
        exercise_name: historyExercise.name,
        weight_value: oneRMValue,
        reps: 0,
        is_pr: true,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh chart
      setLoadHistory(prev => [newRecord, ...prev]);
      
      toast.success("Recorde Sincronizado!", {
        style: { background: '#f59e0b', color: '#fff', border: 'none' }
      });
    } catch (error) {
      console.error('Save PR Error:', error);
      toast.error("Erro ao registrar no histórico.");
    } finally {
      setIsSavingPR(false);
    }
  };

  const handleUpdateRecord = async (recordId: string) => {
    try {
      await dataService.updateLoadRecord(recordId, editValues);
      setLoadHistory(prev => prev.map(r => r.id === recordId ? { ...r, ...editValues } : r));
      setEditingRecordId(null);
      toast.success("Carga atualizada");
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await dataService.deleteLoadRecord(recordId);
      setLoadHistory(prev => prev.filter(r => r.id !== recordId));
      toast.success("Registro excluído");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const startEditing = (record: LoadRecord) => {
    setEditingRecordId(record.id);
    setEditValues({ weight_value: record.weight_value, reps: record.reps });
  };
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [highlightedMuscleId, setHighlightedMuscleId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const { data: trainer } = await supabase.rpc('ensure_trainer_profile', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });
      const trainerId = Array.isArray(trainer) ? trainer[0]?.id : trainer?.id;

      dataService.getStudents('ativo').then(studentsData => {
        setStudents(studentsData);
        if (studentId) {
          const student = studentsData.find(s => s.id === studentId);
          if (student) {
            setSelectedStudent(student);
            setStudentSearch(student.name);
          } else {
            // If studentId was passed but not in the active list, attempt to fetch specific student (archived support)
            // REGRA DE OURO: Sempre filtrar por professor_id para isolamento total
            supabase.from('students')
              .select('*')
              .eq('id', studentId)
              .eq('professor_id', trainerId)
              .maybeSingle()
              .then(({data}) => {
                if (data) {
                  const mapped = {
                    id: data.id,
                    name: data.name,
                    goal: data.goal,
                    freq: data.frequency,
                    status: data.status,
                    img: data.image_url,
                    lesao: data.lesao,
                    observacoes: data.observacoes,
                    birthDate: data.birth_date
                  };
                  setSelectedStudent(mapped as Student);
                  setStudentSearch(mapped.name);
                }
              });
          }
        }
      });
    };
    initialize();
  }, [studentId]);

  // Handle manual selection also updating the parent state if provided
  const handleManualSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(student.name);
    setShowStudentResults(false);
    if (onSelectStudent) {
      onSelectStudent(student.id);
    }
  };

  // Fetch prescription when student is selected
  useEffect(() => {
    // 1. LIMPEZA DE CACHE: Reset imediato do estado ao trocar de aluno
    // Isso evita que o treino do aluno anterior "vaze" para o novo
    setWorkouts({ 'A': { name: 'Treino A', exercises: [] } });
    setRawWorkoutRows([]);
    setActiveDivision('A');
    setLogs([]);
    setLatestEvaluation(null);
    setPeriodization(INITIAL_PERIODIZATION);
    setSearchTerm('');
    setOneRMValue(0);
    setHistoryExercise(null); // Fecha modal de evolução ao trocar aluno
    setEditingRecordId(null);
    setIsLoading(false);
    setStartDate('');
    setEndDate('');
    setTimelineItems([]);

    if (selectedStudent) {
      setIsLoading(true);
      
      // Busca reativa no Supabase com filtro rigoroso por student_id
      const loadData = async () => {
        try {
          // Paralelizar buscas para performance
          const [evalData, prescriptionData, workoutRows] = await Promise.all([
            dataService.getLatestEvaluation(selectedStudent.id),
            dataService.getPrescription(selectedStudent.id),
            dataService.getWorkouts(selectedStudent.id)
          ]);

          setLatestEvaluation(evalData);
          setRawWorkoutRows(workoutRows || []);
          
          const migratedWorkouts: Record<string, WorkoutDivision> = {};
          
          // 1. Prioridade para a nova tabela granular 'workouts'
          if (workoutRows && workoutRows.length > 0) {
            workoutRows.forEach(row => {
              migratedWorkouts[row.workout_type] = row.workout_data as WorkoutDivision;
            });
            // Carrega datas de vigência do primeiro registro encontrado
            if (workoutRows[0].start_date) setStartDate(workoutRows[0].start_date);
            if (workoutRows[0].end_date) setEndDate(workoutRows[0].end_date);
          } 
          // 2. Fallback para dados legados na tabela 'prescriptions'
          else if (prescriptionData && (prescriptionData.exercises || prescriptionData.workout_data)) {
            const rawExercises = (prescriptionData.exercises || prescriptionData.workout_data) as any;
            Object.keys(rawExercises).forEach(key => {
              const val = rawExercises[key];
              if (Array.isArray(val)) {
                migratedWorkouts[key] = { name: `Treino ${key}`, exercises: val };
              } else if (val && typeof val === 'object' && val.exercises) {
                migratedWorkouts[key] = val as WorkoutDivision;
              }
            });
          }

          if (Object.keys(migratedWorkouts).length > 0) {
            // Normalização de blocos (Sistema de Blocos de Modalidade)
            Object.keys(migratedWorkouts).forEach(key => {
              const div = migratedWorkouts[key];
              if (!div.blocks || !Array.isArray(div.blocks)) {
                div.blocks = [{
                  id: Math.random().toString(36).substr(2, 9),
                  modality: 'Musculação',
                  exercises: div.exercises || []
                }];
              }
            });

            setWorkouts(migratedWorkouts);
            const firstKey = Object.keys(migratedWorkouts)[0];
            setActiveDivision(firstKey);
            
            // Set first block as active by default
            if (migratedWorkouts[firstKey]?.blocks?.[0]) {
              setActiveBlockId(migratedWorkouts[firstKey].blocks[0].id);
            }
            
            // Calculate initial volumes for overload comparison
            const initialVols: Record<string, number> = {};
            Object.entries(migratedWorkouts).forEach(([key, division]) => {
              const allExercises = division.blocks ? division.blocks.flatMap(b => b.exercises) : (division.exercises || []);
              initialVols[key] = allExercises.reduce((acc, ex) => {
                const reps = parseInt(String(ex.reps).split('-')[0]) || 0;
                return acc + (Number(ex.sets) * reps * Number(ex.load || 0));
              }, 0);
            });
            setInitialVolumes(initialVols);
          }
          
          if (prescriptionData) {
            setLogs(prescriptionData.logs || []);
            if (prescriptionData.periodization) {
              setPeriodization(prescriptionData.periodization);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados do aluno:", error);
          toast.error("Erro ao sincronizar dados");
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
      fetchTimeline(selectedStudent.id);
    }
  }, [selectedStudent]);

  const savePrescription = async () => {
    if (!selectedStudent) {
      toast.error('Selecione um aluno primeiro');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    try {
      // 1. Salva dados globais (logs, periodização) na tabela prescriptions
      await dataService.savePrescription(
        selectedStudent.id,
        {}, // Não enviamos mais os treinos aqui (agora são granulares)
        logs,
        activeDivision,
        selectedStudent.goal || `Treino de ${selectedStudent.name}`,
        periodization
      );

      // 2. Salva cada divisão individualmente na tabela 'workouts' (UPSERT por student_id + workout_type)
      const savePromises = Object.entries(workouts).map(([type, data]) => 
        dataService.saveWorkout(selectedStudent.id, type, data, startDate, endDate)
      );
      
      await Promise.all(savePromises);
      fetchTimeline(selectedStudent.id);
      
      toast.success("Plano de Treino Salvo", {
        description: `Todos os blocos (A, B, C...) de ${selectedStudent.name} foram sincronizados individualmente.`,
        icon: '✅'
      });
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      const msg = error?.message || 'Erro ao salvar o treino';
      setSaveError(msg);
      toast.error('Erro ao salvar o treino', {
        description: msg
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateExerciseMuscle = (exerciseId: string, exerciseName: string, nextMuscleId: string) => {
    // Update active workout
    setWorkouts(prev => ({
      ...prev,
      [activeDivision]: {
        ...prev[activeDivision],
        exercises: prev[activeDivision].exercises.map(e => e.id === exerciseId ? { ...e, muscleId: nextMuscleId } : e)
      }
    }));

    // Update library if exists
    setLibrary(prev => prev.map(item => 
      item.name.toLowerCase() === exerciseName.toLowerCase() 
        ? { ...item, muscleId: nextMuscleId } 
        : item
    ));
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 5);
  }, [studentSearch, students]);
  useEffect(() => {
    dataService.getExerciseLibrary().then(setLibrary);
  }, []);

  useEffect(() => {
    if (workouts[activeDivision]?.blocks?.length > 0) {
      const currentBlockInDiv = workouts[activeDivision].blocks.find(b => b.id === activeBlockId);
      if (!currentBlockInDiv) {
        setActiveBlockId(workouts[activeDivision].blocks[0].id);
      }
    }
  }, [activeDivision, workouts, activeBlockId]);

  const handleCreateAndAddExercise = async () => {
    if (!newLibraryExercise.name) {
      toast.error('Informe o nome do exercício');
      return;
    }

    // Check if duplicate
    if (library.find(l => l.name.toLowerCase() === newLibraryExercise.name.toLowerCase())) {
      toast.error('Este exercício já consta na biblioteca', {
        style: { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' }
      });
      return;
    }

    setIsAddingToLibrary(true);
    try {
      const added = await dataService.addExerciseToLibrary(newLibraryExercise);
      
      // Update library
      const updatedLibrary = [...library, added].sort((a,b) => a.name.localeCompare(b.name));
      setLibrary(updatedLibrary);
      
      // Double Action: Automatically add to current workout
      addExercise({ name: added.name, muscleId: added.muscle_id });
      
      setShowLibraryModal(false);
      setNewLibraryExercise({ name: '', muscle_id: 'peitorais' });
      toast.success('Exercício cadastrado e adicionado ao treino');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar exercício');
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return [];
    return library.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [searchTerm, library]);

  const exactMatch = useMemo(() => {
    return library.find(ex => ex.name.toLowerCase() === searchTerm.toLowerCase());
  }, [searchTerm, library]);

  useEffect(() => {
    // Guess muscle group as user types
    if (searchTerm && !exactMatch) {
      const guessed = guessMuscleGroup(searchTerm);
      if (guessed) {
        setNewExercise(prev => ({ ...prev, muscleId: guessed }));
      }
      setHighlightedMuscleId(guessed);
    } else if (exactMatch) {
      setNewExercise(prev => ({ ...prev, muscleId: exactMatch.muscle_id }));
      setHighlightedMuscleId(exactMatch.muscle_id);
    } else {
      setHighlightedMuscleId(null);
    }
  }, [searchTerm, exactMatch]);

  // Weekly Volume & Fatigue Logic
  const weeklyVolume = useMemo(() => {
    const volume: Record<string, MuscleData> = {};
    MUSCLE_GROUPS.forEach(m => {
      volume[m.id] = { volume: 0, hasPain: false, isFatigued: false };
    });

    // Central Fatigue check: average RPE of last 3 logs > 8
    const recentLogs = logs.slice(0, 3);
    const avgPSE = recentLogs.length > 0 
      ? recentLogs.reduce((acc, log) => acc + log.rpe, 0) / recentLogs.length 
      : 0;
    
    const isCentralFatigue = avgPSE > 8;

    // Sum sets from ALL saved workout divisions (A, B, C, D, Novo Treino, etc.)
    Object.values(workouts).forEach((division: WorkoutDivision) => {
      let filteredEx: any[] = [];
      if (division.blocks) {
        division.blocks.forEach(block => {
          const modality = (block.modality || '').toLowerCase();
          // Rule: Only count resistance training for muscle status
          if (modality.includes('musculação') || modality.includes('resistido') || modality.includes('strength') || modality === '') {
            filteredEx = [...filteredEx, ...(block.exercises || [])];
          }
        });
      } else {
        filteredEx = division.exercises || [];
      }

      if (filteredEx && Array.isArray(filteredEx)) {
        filteredEx.forEach(ex => {
          // 1. Obtém o muscleId ORIGINAL do banco de dados (prioridade)
          let mid = ex.muscleId;
          const lowerName = ex.name.toLowerCase();
          
          // 2. Normalização para IDs sem acento (uso interno) ou detecção por nome
          if (mid) {
            const normalized = mid.toLowerCase().trim()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
            
            if (normalized.includes('femoral') || normalized.includes('isquiotibial') || normalized.includes('isquiotibiais') || normalized.includes('posterior') || normalized.includes('flexora') || normalized.includes('stiff') || normalized.includes('terra romeno') || normalized.includes('leg curl') || normalized.includes('hamstring curl')) mid = 'Isquiotibiais';
            else if (normalized.includes('peito')) mid = 'Peitorais';
            else if (normalized.includes('costas') || normalized.includes('dorsal') || normalized.includes('latissimo') || normalized.includes('trapezio')) mid = 'Costas';
            else if (normalized.includes('ombro') || normalized.includes('deltoide')) mid = 'Ombros';
            else if (normalized.includes('biceps')) mid = 'Biceps';
            else if (normalized.includes('triceps')) mid = 'Triceps';
            else if (normalized.includes('quadriceps')) mid = 'Quadriceps';
            else if (normalized.includes('gastrocnemio') || normalized.includes('panturrilha')) mid = 'Gastrocnemios';
            else if (normalized.includes('gluteo')) mid = 'Gluteo';
            else if (normalized.includes('abs') || normalized.includes('core') || normalized.includes('abdomen')) mid = 'Core';
          } else {
            // Fallback por nome se mid for nulo - PRIORIDADE ISQUIOTIBIAIS
            if (lowerName.includes('flexora') || 
                lowerName.includes('stiff') || 
                lowerName.includes('terra romeno') || 
                lowerName.includes('posterior de coxa') || 
                lowerName.includes('posterior') ||
                lowerName.includes('isquiotibiais') || 
                lowerName.includes('biceps femoral') ||
                lowerName.includes('bíceps femoral') ||
                lowerName.includes('leg curl') || 
                lowerName.includes('hamstring curl')) {
              mid = 'Isquiotibiais';
            } else if (lowerName.includes('rosca') || 
                       lowerName.includes('bíceps braquial') ||
                       lowerName.includes('biceps braquial') ||
                       lowerName.includes('biceps') ||
                       lowerName.includes('bíceps')) {
              mid = 'Biceps';
            } else if (lowerName.includes('triceps') || lowerName.includes('tríceps') || lowerName.includes('extensora triceps')) {
              mid = 'Triceps';
            } else if (lowerName.includes('supino') || lowerName.includes('crucifixo') || lowerName.includes('peitoral')) {
              mid = 'Peitorais';
            } else if (lowerName.includes('agachamento') || lowerName.includes('leg press') || lowerName.includes('quadriceps')) {
              mid = 'Quadriceps';
            } else if (lowerName.includes('ombro') || lowerName.includes('ombros') || lowerName.includes('deltoide') || lowerName.includes('deltoides') || lowerName.includes('desenvolvimento') || lowerName.includes('elevação lateral') || lowerName.includes('elevacao lateral') || lowerName.includes('elevação frontal') || lowerName.includes('elevacao frontal') || lowerName.includes('manguito') || lowerName.includes('remada alta')) {
              mid = 'Ombros';
            } else if (lowerName.includes('gastrocnemio') || lowerName.includes('gastrocnêmio') || lowerName.includes('panturrilha') || lowerName.includes('panturrilha sentado') || lowerName.includes('gemeos') || lowerName.includes('gêmeos')) {
              mid = 'Gastrocnemios';
            }
          }

          if (mid && volume[mid]) {
            const sets = typeof ex.sets === 'string' ? parseInt(ex.sets) : Number(ex.sets);
            const validSets = isNaN(sets) ? 0 : sets;
            
            // Soma Motor Primário (100%)
            volume[mid].volume += validSets;

            // --- Lógica de Sinergia Obrigatória ---
            
            // Rule 1: Quadriceps Multi-joint -> 50% Gluteo
            const isQuadricepsMulti = (mid === 'Quadriceps') && (
              lowerName.includes('agachamento') || 
              lowerName.includes('leg press') || 
              lowerName.includes('avanco') || 
              lowerName.includes('avanço') || 
              lowerName.includes('afundo') || 
              lowerName.includes('bulgarian') || 
              lowerName.includes('bulgaro') ||
              lowerName.includes('búlgaro')
            );
            
            if (isQuadricepsMulti && volume['Gluteo']) {
              volume['Gluteo'].volume += validSets * 0.5;
            }

            // Rule 2: Isquiotibiais Multi-joint -> 50% Gluteo
            const isIsquiotibiaisMulti = (mid === 'Isquiotibiais') && (
              lowerName.includes('stiff') || 
              lowerName.includes('terra') || 
              lowerName.includes('deadlift') || 
              lowerName.includes('good morning')
            );

            if (isIsquiotibiaisMulti && volume['Gluteo']) {
              volume['Gluteo'].volume += validSets * 0.5;
            }

            if (isCentralFatigue) volume[mid].isFatigued = true;
          }
        });
      }
    });

    // Mark pain points from logs
    logs.forEach(log => {
      if (log.painPoints && Array.isArray(log.painPoints)) {
        log.painPoints.forEach(point => {
          let normPoint = point;
          const pLower = point.toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          if (pLower.includes('peito')) normPoint = 'Peitorais';
          else if (pLower.includes('costas') || pLower.includes('dorsal') || pLower.includes('trapezio')) normPoint = 'Costas';
          else if (pLower.includes('quadriceps')) normPoint = 'Quadriceps';
          else if (pLower.includes('femoral') || pLower.includes('isquiotibial') || pLower.includes('posterior')) normPoint = 'Biceps Femoral';
          else if (pLower.includes('gastrocnemio') || pLower.includes('panturrilha')) normPoint = 'Gastrocnemios';
          else if (pLower.includes('gluteo')) normPoint = 'Gluteo';
          else if (pLower.includes('ombro') || pLower.includes('deltoide')) normPoint = 'Ombros';
          else if (pLower.includes('biceps')) normPoint = 'Biceps';
          else if (pLower.includes('triceps')) normPoint = 'Triceps';
          else if (pLower.includes('abs') || pLower.includes('core')) normPoint = 'Core';

          if (volume[normPoint]) {
            volume[normPoint].hasPain = true;
          }
        });
      }
    });

    return volume;
  }, [workouts, logs]);

  const sessionVolumeData = useMemo(() => {
    const division = workouts[activeDivision];
    const currentExercises = division?.blocks ? division.blocks.flatMap(b => b.exercises) : (division?.exercises || []);
    const muscleVolumes: Record<string, number> = {};
    let totalVolume = 0;

    currentExercises.forEach(ex => {
      // Parse reps (e.g., "12-15" or "10")
      const repsStr = String(ex.reps).split('-')[0] || '10';
      const reps = parseInt(repsStr) || 10;
      const sets = Number(ex.sets) || 0;
      const load = Number(ex.load) || 0;
      const exerciseVolume = sets * reps * load;

      totalVolume += exerciseVolume;

      // Normalização Robusta para IDs
      let mid = ex.muscleId || '';
      const normalized = mid.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Mapeamento de normalização (Sincronizado com weeklyVolume)
      if (normalized.includes('peito')) mid = 'Peitorais';
      else if (normalized.includes('costas') || normalized.includes('dorsal') || normalized.includes('latissimo') || normalized.includes('trapezio')) mid = 'Costas';
      else if (normalized.includes('ombro') || normalized.includes('deltoide')) mid = 'Ombros';
      else if (normalized.includes('biceps')) mid = 'Biceps';
      else if (normalized.includes('triceps')) mid = 'Triceps';
      else if (normalized.includes('quadriceps')) mid = 'Quadriceps';
      else if (normalized.includes('femoral') || normalized.includes('isquiotibial') || normalized.includes('posterior')) mid = 'Biceps Femoral';
      else if (normalized.includes('gastrocnemio') || normalized.includes('panturrilha')) mid = 'Gastrocnemios';
      else if (normalized.includes('gluteo')) mid = 'Gluteo';
      else if (normalized.includes('abs') || normalized.includes('core') || normalized.includes('abdomen')) mid = 'Core';
      else if (normalized.includes('braco') || normalized.includes('braço')) {
        const lowerName = ex.name.toLowerCase();
        if (lowerName.includes('biceps') || lowerName.includes('rosca')) mid = 'Biceps';
        else if (lowerName.includes('triceps') || lowerName.includes('pulley') || lowerName.includes('frances')) mid = 'Triceps';
        else mid = 'Biceps';
      }

      const muscleName = MUSCLE_GROUPS.find(m => m.id === mid)?.name || 'Outros';
      muscleVolumes[muscleName] = (muscleVolumes[muscleName] || 0) + exerciseVolume;
    });

    const chartData = Object.entries(muscleVolumes).map(([name, volume]) => ({
      name,
      volume
    })).sort((a, b) => b.volume - a.volume);

    return { totalVolume, chartData };
  }, [workouts, activeDivision]);

  const overloadStats = useMemo(() => {
    const current = sessionVolumeData.totalVolume;
    const previous = initialVolumes[activeDivision];
    
    // Explicitly check for First Session (no previous records for this division)
    if (previous === undefined || previous === 0) {
      return { diff: 0, percent: 0, status: 'first' };
    }
    
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return { diff: 0, percent: 0, status: 'neutral' };
    
    const percent = (diff / previous) * 100;
    
    return {
      diff,
      percent,
      status: diff > 0 ? 'increase' : 'decrease'
    };
  }, [sessionVolumeData.totalVolume, initialVolumes, activeDivision]);

  const overloadsAndFatigue = useMemo(() => {
    const ov = (Object.entries(weeklyVolume) as [string, MuscleData][])
      .filter(([_, data]) => data.volume >= 26)
      .map(([id, _]) => ({ type: 'OVERLOAD', name: MUSCLE_GROUPS.find(m => m.id === id)?.name }));
    
    // Check central fatigue warning
    const recentLogs = logs.slice(0, 3);
    const avgPSE = recentLogs.length > 0 
      ? recentLogs.reduce((acc, log) => acc + log.rpe, 0) / recentLogs.length 
      : 0;
    
    if (avgPSE > 8) {
      ov.push({ type: 'FATIGUE', name: 'Fadiga Central' });
    }

    return ov;
  }, [weeklyVolume, logs]);

  const hasOverload = useMemo(() => overloadsAndFatigue.some(i => i.type === 'OVERLOAD'), [overloadsAndFatigue]);

  const filteredModalities = useMemo(() => {
    return MODALITIES.filter(m => m.name.toLowerCase().includes(modalitySearch.toLowerCase()));
  }, [modalitySearch]);

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setWorkouts(prev => ({
      ...prev,
      [activeDivision]: {
        ...prev[activeDivision],
        blocks: prev[activeDivision].blocks?.map(block => ({
          ...block,
          exercises: block.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e)
        }))
      }
    }));
  };

  const addExercise = (exData: { name: string; muscleId: string; type?: 'resistido' | 'cardio' }) => {
    if (!activeDivision || !activeBlockId) return;

    const block = workouts[activeDivision]?.blocks?.find(b => b.id === activeBlockId);
    if (!block) return;

    const config = MODALITY_CONFIGS[block.modality] || MODALITY_CONFIGS['Musculação'];
    
    // Lógica de valores padrão baseada na modalidade
    const exerciseFields: any = {};
    if (block.modality === 'Musculação') {
      exerciseFields.sets = newExercise.sets;
      exerciseFields.reps = newExercise.reps;
      exerciseFields.load = 0;
      exerciseFields.rest = '60s';
    } else {
      config.fields.forEach(f => {
        if (f.key === 'sets') exerciseFields.sets = 3;
        else if (f.key === 'reps') exerciseFields.reps = '12';
        else if (f.key === 'rest') exerciseFields.rest = '60s';
        else exerciseFields[f.key] = f.type === 'number' ? 0 : '';
      });
    }

    const exercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: exData.name,
      muscle_id: exData.muscleId || newExercise.muscleId,
      ...exerciseFields,
      mesoId: periodization.currentMesoId,
      microIndex: periodization.currentMicroIndex
    };
    
    setWorkouts(prev => ({
      ...prev,
      [activeDivision]: {
        ...prev[activeDivision],
        blocks: prev[activeDivision].blocks?.map(b => 
          b.id === activeBlockId 
            ? { ...b, exercises: [...b.exercises, exercise] }
            : b
        )
      }
    }));
    
    setSearchTerm('');
    setShowAutocomplete(false);
    setHighlightedMuscleId(null);
  };

  const removeExercise = (id: string) => {
    setWorkouts(prev => ({
      ...prev,
      [activeDivision]: {
        ...prev[activeDivision],
        blocks: prev[activeDivision].blocks?.map(block => ({
          ...block,
          exercises: block.exercises.filter(ex => ex.id !== id)
        }))
      }
    }));
  };

  const addModalityBlock = (modality: string) => {
    const newBlock: ModalityBlock = {
      id: Math.random().toString(36).substr(2, 9),
      modality,
      exercises: []
    };
    
    setWorkouts(prev => ({
      ...prev,
      [activeDivision]: {
        ...prev[activeDivision],
        blocks: [...(prev[activeDivision].blocks || []), newBlock]
      }
    }));
    
    setActiveBlockId(newBlock.id);
    setShowModalitySelector(false);
  };

  const removeBlock = (blockId: string) => {
    if ((workouts[activeDivision]?.blocks?.length || 0) <= 1) {
      toast.error('O treino deve ter pelo menos um bloco.');
      return;
    }
    
    setWorkouts(prev => {
      const newBlocks = prev[activeDivision].blocks?.filter(b => b.id !== blockId) || [];
      return {
        ...prev,
        [activeDivision]: {
          ...prev[activeDivision],
          blocks: newBlocks
        }
      };
    });

    if (activeBlockId === blockId) {
      const remainingBlocks = workouts[activeDivision]?.blocks?.filter(b => b.id !== blockId) || [];
      if (remainingBlocks.length > 0) {
        setActiveBlockId(remainingBlocks[0].id);
      }
    }
  };

  const addDivision = async () => {
    // 1. Lógica de Próxima Letra (A, B, C...)
    const WORKOUT_ORDER = 'ABCDEFGHIJKLMN'.split('');
    const currentKeys = Object.keys(workouts);
    const nextKey = WORKOUT_ORDER.find(key => !currentKeys.includes(key)) || 
                    String.fromCharCode('A'.charCodeAt(0) + currentKeys.length);

    // 2. Prevenção de Duplicatas
    if (workouts[nextKey]) {
      toast.error('Ocorreu um erro na sequência de divisões.');
      return;
    }

    const blockId = Math.random().toString(36).substr(2, 9);
    const newDivision: WorkoutDivision = { 
      name: `Treino ${nextKey}`, 
      exercises: [],
      blocks: [{
        id: blockId,
        modality: 'Musculação',
        exercises: []
      }]
    };

    // Atualização de Estado Local
    setWorkouts(prev => ({
      ...prev,
      [nextKey]: newDivision
    }));
    
    // Troca Automática de Aba
    setActiveDivision(nextKey);
    setActiveBlockId(blockId);

    // 3. Criação e Persistência Imediata no Supabase
    if (selectedStudent) {
      try {
        await dataService.saveWorkout(
          selectedStudent.id, 
          nextKey, 
          newDivision, 
          startDate, 
          endDate
        );
        toast.success(`Treino ${nextKey} criado e salvo com sucesso!`);
      } catch (error) {
        console.error('Erro ao salvar nova divisão:', error);
        toast.error('Treino criado localmente, mas houve um erro ao salvar no servidor.');
      }
    }
  };

  const removeDivision = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (Object.keys(workouts).length <= 1) {
      toast.error('É necessário ter pelo menos uma divisão de treino.');
      return;
    }
    
    // Aesthetic confirmation logic
    if (confirmingDelete !== key) {
      setConfirmingDelete(key);
      const timer = setTimeout(() => setConfirmingDelete(null), 3000);
      return;
    }
    
    try {
      if (selectedStudent) {
        // Delete from Supabase workflows table filtering by student_id and workout_type
        await dataService.deleteWorkout(selectedStudent.id, key);
      }
      
      const newWorkouts = { ...workouts };
      delete newWorkouts[key];
      setWorkouts(newWorkouts);
      
      if (activeDivision === key) {
        setActiveDivision(Object.keys(newWorkouts)[0]);
      }
      
      setConfirmingDelete(null);
      toast.success("Divisão removida permanentemente");
    } catch (error) {
      console.error('Delete Workout Error:', error);
      toast.error("Erro ao remover divisão do sistema.");
    }
  };

  const startEditingName = (key: string, currentName: string) => {
    setEditingDivision(key);
    setEditNameValue(currentName);
  };

  const saveDivisionName = () => {
    if (editingDivision && editNameValue.trim()) {
      setWorkouts(prev => ({
        ...prev,
        [editingDivision]: { ...prev[editingDivision], name: editNameValue.trim() }
      }));
    }
    setEditingDivision(null);
  };

  const cloneWorkout = async (targetStudentId: string) => {
    if (!selectedStudent || !Object.keys(workouts).length) {
      toast.error('Nenhum treino disponível para clonar');
      return;
    }

    try {
      // 1. Verificar se aluno destino já tem treino
      const targetStudentWorkouts = await dataService.getWorkouts(targetStudentId);
      const targetStudent = students.find(s => s.id === targetStudentId);

      if (targetStudentWorkouts && targetStudentWorkouts.length > 0) {
        const confirmResult = window.confirm(
          `O aluno ${targetStudent?.name || ''} já possui treino cadastrado. Deseja substituir?`
        );
        if (!confirmResult) return;
      }

      // 2. Clonar treinos (A, B, C...)
      const clonePromises = Object.entries(workouts).map(([type, data]) => 
        dataService.saveWorkout(targetStudentId, type, data, startDate, endDate)
      );

      await Promise.all(clonePromises);

      toast.success("Treino clonado com sucesso", {
        description: `O treino de ${selectedStudent.name} foi copiado para ${targetStudent?.name}.`
      });
      setShowCloneModal(false);
    } catch (error) {
      console.error('Error cloning workout:', error);
      toast.error("Erro ao clonar treino");
    }
  };

  const posturalAlerts = useMemo(() => {
    if (!latestEvaluation?.posture_data) return [];
    const alerts: string[] = [];
    const p = latestEvaluation.posture_data;
    const allDeviations = [
      ...(p.anterior?.deviations || []),
      ...(p.posterior?.deviations || []),
      ...(p.lateralDir?.deviations || []),
      ...(p.lateralEsq?.deviations || [])
    ];
    
    if (allDeviations.includes('Escoliose')) alerts.push('Escoliose Detectada');
    if (allDeviations.includes('Valgo')) alerts.push('Valgo de Joelho Detectado');
    if (allDeviations.includes('Valgo de Joelho')) alerts.push('Valgo de Joelho Detectado');
    
    return Array.from(new Set(alerts));
  }, [latestEvaluation]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 sm:space-y-16 pb-32 text-gray-900 dark:text-on-surface"
    >
      <Toaster position="top-right" richColors theme="dark" />
      {/* Header & Division Selector */}
      <section className="flex flex-col gap-6 sm:gap-12">
        <div className="bg-white dark:bg-surface-container-low/50 backdrop-blur-xl p-5 sm:p-8 lg:p-12 rounded-[32px] sm:rounded-[40px] border border-gray-200 dark:thin-border relative shadow-sm dark:shadow-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full -ml-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex flex-col gap-6 sm:gap-10">
            {/* Top row with Title and Main Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 sm:mb-16">
              <div className="flex items-center gap-3 sm:gap-8">
                <div className="w-12 h-12 sm:w-24 sm:h-24 bg-primary rounded-2xl sm:rounded-[32px] flex items-center justify-center shadow-xl shadow-primary/40 group overflow-hidden relative rotate-3 shrink-0">
                  <div className="absolute inset-0 bg-white/20 group-hover:scale-110 transition-transform" />
                  <ClipboardList className="text-black group-hover:scale-110 transition-transform size-6 sm:size-12" />
                </div>
                <div className="space-y-0.5 sm:space-y-2">
                  <h1 className="text-xl sm:text-5xl font-black uppercase tracking-tight leading-none italic text-gray-900 dark:text-white">Prescrição</h1>
                  <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-gray-400 dark:text-primary/60">Anatomia do Treino v2.0</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:self-end">
                <button 
                  onClick={generateAiSuggestion}
                  disabled={isGeneratingAi || (!selectedStudent?.lesao && posturalAlerts.length === 0)}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 bg-primary/10 text-primary border border-primary/20 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-all text-[8px] sm:text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                >
                  {isGeneratingAi ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  <span className="whitespace-nowrap">Análise Biomecânica</span>
                </button>

                <button 
                  onClick={() => setShowCloneModal(true)} 
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-white/5 rounded-xl sm:rounded-2xl text-gray-400 dark:text-on-surface-variant hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 flex items-center gap-2 group"
                >
                  <Copy size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-widest whitespace-nowrap">Clonar Treino</span>
                </button>
                
                <button 
                  onClick={savePrescription}
                  disabled={!selectedStudent || isSaving}
                  className="flex-1 sm:flex-none px-6 sm:px-10 py-3.5 sm:py-5 bg-primary text-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-primary-hover active:scale-95 transition-all text-xs sm:text-[13px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} 
                  <span className="whitespace-nowrap">{isSaving ? 'Sincronizando...' : 'Salvar Treino'}</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Student Selection and Config Container */}
            <div className="flex flex-col gap-4 sm:gap-8 bg-gray-50 dark:bg-black/20 p-4 sm:p-6 lg:p-10 rounded-[24px] sm:rounded-[40px] border border-gray-100 dark:border-white/5 shadow-inner max-w-full">
              
              {/* Linha 1: Barra de Busca (Ocupando largura total) */}
              <div className="w-full">
                <div className="relative group w-full">
                  <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-on-surface-variant/40 group-focus-within:text-primary transition-colors size-4 sm:size-6" />
                  <input 
                    value={studentSearch}
                    onChange={e => {
                      setStudentSearch(e.target.value);
                      setShowStudentResults(true);
                    }}
                    onFocus={() => setShowStudentResults(true)}
                    placeholder="Pesquisar Aluno..." 
                    className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/5 px-10 sm:px-16 py-3 sm:py-6 rounded-xl sm:rounded-[28px] text-[9px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-400 dark:placeholder:text-white/10 text-gray-900 dark:text-on-surface shadow-xl"
                  />
                  <AnimatePresence>
                    {showStudentResults && studentSearch && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 10 }} 
                        className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-primary/30 rounded-2xl sm:rounded-3xl shadow-2xl z-[9999] overflow-hidden max-h-[250px] sm:max-h-[350px] overflow-y-auto custom-scrollbar backdrop-blur-3xl"
                      >
                        {filteredStudents.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => handleManualSelectStudent(s)}
                            className="w-full flex items-center gap-4 sm:gap-6 p-4 sm:p-6 hover:bg-primary/10 transition-all border-b border-gray-100 dark:border-white/5 last:border-0"
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 flex items-center justify-center shrink-0">
                              {s.img ? (
                                <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white/90">{s.name}</p>
                              <p className="text-[8px] sm:text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1 sm:mt-1.5">{s.goal}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Linha 2: Aluno Selecionado e Datas */}
              {selectedStudent && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 pt-4 sm:pt-6 border-t border-gray-100 dark:border-white/5">
                  
                  {/* Card do Aluno Selecionado (Mais largo/horizontal) */}
                  <div className="w-full lg:flex-1 min-w-0">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-primary/5 rounded-[24px] sm:rounded-[32px] border border-primary/10 w-full hover:bg-primary/10 transition-colors"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-black/40 ring-2 ring-primary/20 flex items-center justify-center shadow-xl shrink-0">
                        {selectedStudent.img ? (
                          <img src={selectedStudent.img} className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-primary/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-base sm:text-xl font-black uppercase text-primary tracking-tight leading-tight truncate">{selectedStudent.name}</p>
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/10 rounded-full text-[7px] sm:text-[9px] font-black text-primary uppercase tracking-[0.1em] sm:tracking-[0.2em] border border-primary/20 whitespace-nowrap">Aluno Ativo</span>
                        </div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1.5 sm:mt-2.5 truncate">{selectedStudent.goal}</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bloco de Datas (Mais compactas e alinhadas à direita em desktop) */}
                  <div className="flex flex-row flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 lg:gap-8 lg:border-l lg:border-gray-100 lg:dark:border-white/5 lg:pl-10 shrink-0">
                    <div className="flex flex-1 sm:flex-none flex-col gap-1.5 sm:gap-2.5">
                      <label className="text-[8px] sm:text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] sm:tracking-[0.3em] pl-1">Início</label>
                      <div className="relative group">
                        <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors size-3.5 sm:size-4" />
                        <input 
                          type="date" 
                          value={startDate} 
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full sm:w-40 md:w-48 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-[9px] sm:text-[11px] font-black text-primary uppercase outline-none focus:border-primary/40 transition-all cursor-pointer appearance-none shadow-md"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-1 sm:flex-none flex-col gap-1.5 sm:gap-2.5">
                      <label className="text-[8px] sm:text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] sm:tracking-[0.3em] pl-1">Troca</label>
                      <div className="relative group">
                        <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors size-3.5 sm:size-4" />
                        <input 
                          type="date" 
                          value={endDate} 
                          onChange={e => setEndDate(e.target.value)}
                          className="w-full sm:w-40 md:w-48 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-[9px] sm:text-[11px] font-black text-primary uppercase outline-none focus:border-primary/40 transition-all cursor-pointer appearance-none shadow-md"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alerts Row (Injury and Posture) */}
              {(selectedStudent?.lesao || posturalAlerts.length > 0) && (
                <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
                  {selectedStudent?.lesao && (
                    <motion.div 
                      key="injury-alert"
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="px-6 py-4 bg-error/5 border border-error/20 rounded-[28px] flex items-center gap-5 w-fit"
                    >
                      <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-error" />
                      </div>
                      <div className="flex flex-col min-w-[180px]">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-error/60 leading-none mb-1.5">Restrição Ativa</span>
                        <input 
                          value={selectedStudent.lesao}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            setSelectedStudent(prev => prev ? { ...prev, lesao: newVal } : null);
                          }}
                          placeholder="Adicionar Lesão..."
                          className="text-xs font-black uppercase tracking-tight bg-transparent border-none outline-none w-full text-error"
                        />
                      </div>
                    </motion.div>
                  )}

                  {posturalAlerts.map(alert => (
                    <motion.div 
                      key={`alert-${alert}`}
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="px-6 py-4 bg-primary/10 border border-primary/20 rounded-[28px] flex items-center gap-5 w-fit"
                    >
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 leading-none mb-1.5">Alerta Postural</span>
                        <span className="text-xs font-black uppercase tracking-tight text-primary">{alert}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedStudent && (
        <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-4 p-1 bg-gray-100 dark:bg-black/40 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:w-fit">
          {[
            { id: 'ficha', label: 'Treino', fullLabel: 'Ficha de Treino', icon: ClipboardList },
            { id: 'periodizacao', label: 'Ciclo', fullLabel: 'Periodização', icon: Calendar },
            { id: 'historico', label: 'Logs', fullLabel: 'Histórico', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.2em] transition-all relative overflow-hidden whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-primary text-black shadow-lg shadow-primary/20" 
                  : "text-gray-500 dark:text-on-surface-variant hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <tab.icon size={14} className="sm:size-4" />
              <span className="sm:hidden">{tab.label}</span>
              <span className="hidden sm:inline">{tab.fullLabel}</span>
            </button>
          ))}
        </div>
      )}

        {selectedStudent && activeTab === 'ficha' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {selectedStudent.lesao && !aiSuggestion && !isGeneratingAi && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/5 border border-primary/20 p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Zap className="text-primary" size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-on-surface">Integração NEXO — Segurança em Primeiro Lugar</h4>
                    <p className="text-xs text-gray-400 dark:text-on-surface-variant uppercase tracking-widest mt-1">
                      Detectada: <span className="text-primary font-bold">"{selectedStudent.lesao}"</span> (Coluna Lesão)
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-on-surface-variant/60 mt-2 max-w-md">
                      Deseja que a inteligência analise o impacto desta lesão no planejamento atual e sugira adaptações biomecânicas?
                    </p>
                  </div>
                </div>
                <button 
                  onClick={generateAiSuggestion}
                  className="bg-primary hover:bg-primary-hover text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-3 shrink-0"
                >
                  <Zap size={16} fill="currentColor" />
                  Gerar Análise Profissional
                </button>
              </motion.div>
            )}

            {aiSuggestion && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-white dark:bg-black/60 shadow-xl dark:shadow-none backdrop-blur-xl border border-gray-100 dark:border-primary/30 rounded-[32px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <button 
                  onClick={() => setAiSuggestion(null)}
                  className="absolute top-6 right-6 text-gray-400 dark:text-on-surface-variant hover:text-gray-900 dark:hover:text-on-surface transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="text-primary" size={24} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary">Análise do Professor</h4>
                      <p className="text-[10px] text-gray-400 dark:text-on-surface-variant uppercase tracking-widest mt-1">Baseado na lesão: {selectedStudent?.lesao}</p>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-on-surface/90 leading-relaxed font-manrope whitespace-pre-wrap selection:bg-primary/30">
                      {aiSuggestion}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <section className="space-y-6 sm:space-y-8">
              <div className="flex flex-col gap-3 sm:gap-4">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 dark:text-on-surface-variant">Divisão de Treino</span>
                <div className="flex bg-gray-100 dark:bg-black/50 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/5 overflow-x-auto no-scrollbar items-center gap-2 sm:gap-3">
                  {(Object.entries(workouts) as [string, WorkoutDivision][]).map(([key, division]) => (
                      <div 
                        key={key}
                        onClick={() => setActiveDivision(key)}
                        className={cn(
                          "group relative flex items-center justify-between gap-3 pl-4 sm:pl-6 pr-4 sm:pr-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap border-2 min-w-[110px] sm:min-w-[160px]",
                          activeDivision === key 
                            ? "bg-primary/5 border-primary text-primary shadow-lg" 
                            : "bg-white dark:bg-surface-container-high/50 border-gray-100 dark:border-white/5 text-gray-400 dark:text-on-surface-variant hover:border-primary/50"
                        )}
                      >
                        <div className="flex-1 flex justify-center ml-1 sm:ml-2">
                        {editingDivision === key ? (
                          <input
                            autoFocus
                            value={editNameValue}
                            onChange={e => setEditNameValue(e.target.value)}
                            onBlur={saveDivisionName}
                            onKeyDown={e => e.key === 'Enter' && saveDivisionName()}
                            className="bg-transparent border-none outline-none text-primary w-full text-center"
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span 
                            onClick={() => activeDivision === key && startEditingName(key, division.name)}
                            className={cn(
                              "select-none tracking-wider transition-all duration-300",
                              confirmingDelete === key ? "text-error animate-pulse" : ""
                            )}
                          >
                            {confirmingDelete === key ? 'EXCLUIR?' : division.name.toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {Object.keys(workouts).length > 1 && (
                        <button
                          onClick={(e) => removeDivision(key, e)}
                          onMouseLeave={() => setConfirmingDelete(null)}
                          className={cn(
                            "absolute right-2 sm:right-3 p-1.5 rounded-lg transition-all z-10 shrink-0",
                            confirmingDelete === key 
                              ? "text-error scale-110 bg-error/10" 
                              : "text-gray-400 dark:text-on-surface-variant/40 hover:text-error hover:bg-error/10",
                            activeDivision === key ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={addDivision}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black bg-white dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 dark:text-on-surface-variant hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50 hover:text-primary transition-all uppercase whitespace-nowrap tracking-widest"
                  >
                    Novo Treino
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              {isLoading ? (
                <div className="lg:col-span-2 w-full flex flex-col items-center justify-center py-32 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
                  <p className="text-sm font-black uppercase tracking-widest text-gray-400">Sincronizando ecossistema...</p>
                </div>
              ) : (
                <>
                  {/* Left Column: List of Exercises */}
                  <div className="space-y-12">
                    <div className="bg-white dark:bg-surface-container-low border border-gray-100 dark:border-white/5 dark:thin-border p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] space-y-6 sm:space-y-8 relative overflow-hidden shadow-sm dark:shadow-none">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                            <Dumbbell className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                            Montagem {workouts[activeDivision]?.name}
                          </h3>
                        </div>
                        <button 
                          onClick={() => setShowModalitySelector(true)}
                          className="px-4 py-2 bg-primary text-black rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                          + Novo Bloco
                        </button>
                      </div>

                        <div className="space-y-4 sm:space-y-6">
                          <div className="relative">
                            <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-on-surface-variant mb-1.5 sm:mb-2 block">Buscar Exercício</label>
                            <div className="relative">
                              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-on-surface-variant size-4 sm:size-5" />
                              <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => {
                                  setSearchTerm(e.target.value);
                                  setShowAutocomplete(true);
                                }}
                                onFocus={() => setShowAutocomplete(true)}
                                placeholder="Ex: Supino..."
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-white focus:border-primary outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-white/20"
                              />
                            </div>
                            <AnimatePresence>
                              {showAutocomplete && (searchTerm.length > 0) && filteredExercises.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 w-full mt-2 bg-surface-container-high border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden z-50 shadow-2xl max-h-[300px] overflow-y-auto">
                                  {filteredExercises.map(ex => (
                                    <button key={ex.name} onClick={() => addExercise({ name: ex.name, muscleId: ex.muscle_id })} className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 hover:bg-primary/10 transition-colors flex items-center justify-between group">
                                      <span className="text-xs sm:text-sm font-bold uppercase tracking-tight">{ex.name}</span>
                                      <span className="text-[8px] sm:text-[10px] font-black text-primary/40 group-hover:text-primary uppercase tracking-widest">{MUSCLE_GROUPS.find(m => m.id === ex.muscle_id)?.name}</span>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          <div className="p-4 sm:p-6 bg-primary/5 border border-primary/20 rounded-[24px] space-y-4 sm:space-y-6">
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase text-primary tracking-widest">NEXO Library</p>
                                <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant">Gerencie sua base de exercícios</p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full">
                              <div className="flex items-center gap-3 sm:gap-4 w-full">
                                <div className="px-3 py-1 bg-primary/10 rounded-lg shrink-0"><Layers className="text-primary" size={16} /></div>
                                <div className="flex-1 space-y-2 sm:space-y-3">
                                  <button 
                                    onClick={() => setShowLibraryModal(true)} 
                                    className="w-full py-3 sm:py-4 bg-[#C5A07D] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] rounded-xl sm:rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-[#C5A07D]/20 leading-tight"
                                  >
                                    <span>Cadastrar Novo Exercício</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
                              <button 
                                onClick={() => setNewExercise(prev => ({ ...prev, type: 'resistido' }))}
                                className={cn(
                                  "flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                                  newExercise.type === 'resistido' ? "bg-primary text-black" : "text-white/40 hover:text-white"
                                )}
                              >
                                Resistido
                              </button>
                              <button 
                                onClick={() => setNewExercise(prev => ({ ...prev, type: 'cardio' }))}
                                className={cn(
                                  "flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                                  newExercise.type === 'cardio' ? "bg-cyan-500 text-black" : "text-white/40 hover:text-white"
                                )}
                              >
                                Cardio
                              </button>
                            </div>

                            {newExercise.type === 'resistido' ? (
                              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5 sm:space-y-2">
                                  <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Séries</label>
                                  <input type="number" value={newExercise.sets} onChange={e => setNewExercise({...newExercise, sets: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:border-primary/50 transition-all text-white" />
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                  <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Reps</label>
                                  <input type="text" value={newExercise.reps} onChange={e => setNewExercise({...newExercise, reps: e.target.value})} className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:border-primary/50 transition-all text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                  <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tempo (Min)</label>
                                    <input type="number" value={newExercise.duration} onChange={e => setNewExercise({...newExercise, duration: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:border-cyan-500/50 transition-all text-white" />
                                  </div>
                                  <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Objetivo</label>
                                    <input type="text" value={newExercise.objective} placeholder="Ex: Zona 2" onChange={e => setNewExercise({...newExercise, objective: e.target.value})} className="w-full bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:border-cyan-500/50 transition-all text-white" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Intensidade</label>
                                  <div className="flex gap-2">
                                    {['leve', 'moderada', 'alta'].map((int) => (
                                      <button 
                                        key={int}
                                        onClick={() => setNewExercise(prev => ({ ...prev, intensity: int as any }))}
                                        className={cn(
                                          "flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all",
                                          newExercise.intensity === int 
                                            ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                                            : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                                        )}
                                      >
                                        {int}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="space-y-12 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar pb-12">
                        {(workouts[activeDivision]?.blocks || []).map((block, blockIndex) => {
                          const config = MODALITY_CONFIGS[block.modality] || MODALITY_CONFIGS['Musculação'];
                          const isActive = block.id === activeBlockId;
                          
                          return (
                            <div key={block.id} className="space-y-6">
                              <div 
                                onClick={() => setActiveBlockId(block.id)}
                                className={cn(
                                  "flex items-center justify-between px-6 py-4 rounded-[24px] cursor-pointer transition-all border-2",
                                  isActive 
                                    ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" 
                                    : "bg-gray-50 dark:bg-black/20 border-transparent hover:border-primary/30"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn("p-2.5 rounded-xl", config.fieldColor.replace('text-', 'bg-') + '/10')}>
                                    {(() => {
                                      const Icon = MODALITIES.find(m => m.name === block.modality)?.icon || Dumbbell;
                                      return <Icon className={config.fieldColor} size={20} />;
                                    })()}
                                  </div>
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">
                                      Bloco {blockIndex + 1} — {block.modality}
                                    </h4>
                                    {isActive && <span className="text-[8px] font-black uppercase text-primary tracking-widest mt-1 block">Bloco Ativo</span>}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeBlock(block.id);
                                  }}
                                  className="p-2 text-gray-500 hover:text-error transition-colors bg-white/5 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="space-y-4">
                                {block.exercises
                                  .filter(ex => !ex.mesoId || (ex.mesoId === periodization.currentMesoId && ex.microIndex === periodization.currentMicroIndex))
                                  .map(ex => {
                                    const atRisk = isAtRisk(ex, highlightedJoint);
                                    return (
                                      <motion.div 
                                        layout 
                                        key={ex.id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                          "p-4 sm:p-6 border rounded-[24px] sm:rounded-[32px] shadow-2xl transition-all group relative space-y-4 sm:space-y-6",
                                          atRisk && block.modality === 'Musculação'
                                            ? "bg-error/10 border-error/40 ring-1 ring-error/20" 
                                            : `bg-white dark:bg-[#0F0F0F] border-gray-100 ${config.color}`
                                        )}
                                      >
                                        {atRisk && block.modality === 'Musculação' && (
                                          <div className="absolute -top-2 right-4 sm:-top-3 sm:right-8 px-2 sm:px-3 py-0.5 sm:py-1 bg-error rounded-full flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-error/20 animate-pulse z-10">
                                            <AlertTriangle size={10} className="text-white" />
                                            <span className="text-[6px] sm:text-[8px] font-black uppercase text-white tracking-widest">Ajuste: {highlightedJoint?.toUpperCase()}</span>
                                          </div>
                                        )}

                                        {/* Linha 1: Nome do Exercício */}
                                        <div className="w-full flex justify-between items-start gap-4">
                                          <input 
                                            value={ex.name}
                                            onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                                            className={cn(
                                              "bg-transparent border-none outline-none font-black uppercase tracking-tight text-base sm:text-lg w-full placeholder:text-white/10 truncate",
                                              config.fieldColor
                                            )}
                                            placeholder="Nome do Exercício"
                                          />
                                        </div>

                                        {/* Dynamic Fields Section */}
                                        <div className={cn("grid gap-1.5 sm:gap-2 w-full", `grid-cols-${config.fields.length}`)}>
                                          {config.fields.map(field => (
                                            <div key={field.key} className="flex flex-col items-center gap-1 sm:gap-2">
                                              <span className={cn("text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-center truncate w-full", config.fieldColor)}>{field.label}</span>
                                              <div className={cn("w-full h-10 sm:h-14 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-inner", `focus-within:${config.color}`)}>
                                                <input 
                                                  type={field.type}
                                                  value={(ex[field.key] as any) || ''}
                                                  onChange={(e) => updateExercise(ex.id, { [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
                                                  className="bg-transparent border-none outline-none text-sm sm:text-xl font-black text-gray-900 dark:text-[#F5F5F0] text-center w-full appearance-none m-0 p-0"
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* PR Table Section (Only for Musculação) */}
                                        {block.modality === 'Musculação' && (
                                          <div className="rounded-lg sm:rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 overflow-hidden text-ellipsis">
                                            <button 
                                              onClick={() => setExpandedPR(expandedPR === ex.id ? null : ex.id)}
                                              className="w-full p-2.5 sm:p-3 flex items-center justify-between group"
                                            >
                                              <div className="flex items-center gap-1.5 ">
                                                <Zap className="text-amber-500 shrink-0 size-3 sm:size-3.5" />
                                                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40 truncate">Cargas (PR)</span>
                                              </div>
                                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                                {exercisePRs.find(p => p.exercise_id === ex.id) && (
                                                  <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-black/20">
                                                    <Trophy size={10} className="text-primary" />
                                                    <span className="text-[7px] sm:text-[9px] font-black text-primary uppercase tracking-tighter">
                                                      {exercisePRs.find(p => p.exercise_id === ex.id).one_rm}KG
                                                    </span>
                                                  </div>
                                                )}
                                                <ChevronDown 
                                                  size={16} 
                                                  className={cn(
                                                    "text-gray-300 dark:text-white/20 transition-transform",
                                                    expandedPR === ex.id && "rotate-180"
                                                  )} 
                                                />
                                              </div>
                                            </button>

                                            <AnimatePresence>
                                              {expandedPR === ex.id && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: 'auto', opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 space-y-2.5 sm:space-y-3"
                                                >
                                                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                                                    {(() => {
                                                      const prData = exercisePRs.find(p => p.exercise_id === ex.id);
                                                      const prValue = prData?.one_rm || 0;
                                                      
                                                      if (prValue <= 0) {
                                                        return (
                                                          <div className="col-span-3 py-6 sm:py-8 text-center">
                                                            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#C5A07D] animate-pulse">
                                                              Defina o PR para ver %
                                                            </p>
                                                          </div>
                                                        );
                                                      }

                                                          return [50, 60, 70, 80, 90, 100].map(pct => {
                                                            const calculated = (prValue * (pct / 100)).toFixed(1);
                                                            let colorClass = "text-amber-500";
                                                            if (pct >= 90) colorClass = "text-red-500";
                                                            else if (pct >= 70) colorClass = "text-amber-500";

                                                            return (
                                                              <div key={pct} className="bg-white/5 p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-white/5 text-center">
                                                                <p className="text-[6px] sm:text-[7px] font-black text-gray-400 dark:text-white/20 uppercase tracking-widest leading-none mb-0.5">{pct}%</p>
                                                                <p className={cn("text-[9px] sm:text-[10px] font-black", colorClass)}>{calculated}kg</p>
                                                              </div>
                                                            );
                                                          });
                                                    })()}
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        )}

                                        {/* Proibido mexer na lixeira e observações já existentes - Mantendo a mesma estrutura visual */}
                                        <div className="flex justify-center items-center pt-3 mt-3 border-t border-gray-100 dark:border-white/5 w-full">
                                          <div className="flex gap-6 items-center bg-gray-50 dark:bg-white/5 p-2 px-6 rounded-2xl border border-gray-200 dark:border-white/5">
                                            {block.modality === 'Musculação' && (
                                              <button onClick={() => setHistoryExercise(ex)} className="p-2.5 text-gray-400 dark:text-white/20 hover:text-primary transition-all hover:bg-primary/10 rounded-lg group/icon relative">
                                                <BarChart2 size={18} />
                                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[8px] font-bold rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap">STATUS</span>
                                              </button>
                                            )}
                                            <button onClick={() => removeExercise(ex.id)} className="p-2.5 text-gray-400 dark:text-white/20 hover:text-error hover:bg-error/10 transition-all rounded-lg group/trash relative">
                                              <Trash2 size={18} />
                                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[8px] font-bold rounded opacity-0 group-hover/trash:opacity-100 transition-opacity whitespace-nowrap">REMOVER</span>
                                            </button>
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-4 mt-2">
                                          <AnimatePresence>
                                            {(!ex.showNotes && !ex.notes) && (
                                              <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex justify-center"
                                              >
                                                <button 
                                                  onClick={() => updateExercise(ex.id, { showNotes: true })}
                                                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-[#C5A07D]/10 text-[#C5A07D] hover:bg-[#C5A07D]/20 transition-all w-fit shadow-lg shadow-black/20"
                                                >
                                                  <MessageSquare size={14} />
                                                  Injetar Observação Técnica
                                                </button>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>

                                          <AnimatePresence>
                                            {(ex.showNotes || ex.notes) && (
                                              <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="relative group/notes">
                                                  <textarea
                                                    value={ex.notes || ''}
                                                    onChange={(e) => updateExercise(ex.id, { notes: e.target.value })}
                                                    className="w-full bg-gray-50 dark:bg-black/60 border border-gray-100 dark:border-primary/20 rounded-[24px] p-6 text-[11px] font-medium text-gray-900 dark:text-[#F5F5F0] outline-none focus:border-primary/50 dark:focus:border-primary/50 transition-all min-h-[120px] resize-none shadow-inner placeholder:text-gray-400 dark:placeholder:text-white/10"
                                                    placeholder="Instruções técnicas, cadência ou notas específicas..."
                                                  />
                                                  <button 
                                                    onClick={() => updateExercise(ex.id, { notes: '', showNotes: false })}
                                                    className="absolute top-4 right-4 p-2.5 bg-gray-200 dark:bg-black/40 rounded-xl text-gray-500 dark:text-white/20 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover/notes:opacity-100 shadow-lg"
                                                  >
                                                    <X size={14} />
                                                  </button>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-12">
                    <div className="flex flex-col items-center gap-8 w-full">
                      {hasOverload && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full bg-orange-500/20 border border-orange-500/50 p-6 rounded-2xl text-center">
                          <p className="text-orange-500 font-black text-xl uppercase tracking-tighter animate-pulse flex items-center justify-center">⚠️ ALERTA DA EQUIPE NEXO: SOBRECARGA DETECTADA</p>
                        </motion.div>
                      )}
                      <div className="w-full"><AnatomicalModel muscleData={weeklyVolume} highlightedId={highlightedMuscleId} limit={26} /></div>
                      <div className="w-full bg-white dark:bg-surface-container-low border border-gray-100 dark:border-white/5 dark:thin-border p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] space-y-4 sm:space-y-6 shadow-sm dark:shadow-none">
                        <h4 className="text-[11px] sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">Status Muscular Semanal</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 sm:gap-y-4">
                          {MUSCLE_GROUPS.map(m => {
                            const data = weeklyVolume[m.id];
                            const percentage = Math.min((data.volume / 26) * 100, 100);
                            return (
                              <div key={m.id} className="space-y-1.5 sm:space-y-2">
                                <div className="flex justify-between text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                                  <span className="text-gray-900 dark:text-on-surface">{m.name}</span>
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    {data.isFatigued && <span className="text-yellow-500 text-[6px] sm:text-[8px] font-black uppercase underline decoration-gray-400">Fadiga</span>}
                                    <span className={cn(data.volume >= 26 ? "text-red-500 font-bold" : "text-gray-400 dark:text-on-surface-variant")}>{data.volume.toFixed(1)}/26</span>
                                  </div>
                                </div>
                                <div className="h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                  <motion.div animate={{ width: `${percentage}%` }} className={cn("h-full", data.volume >= 26 ? "bg-red-500 animate-pulse" : data.isFatigued ? "bg-yellow-500" : "bg-primary")} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Gráfico de Evolução de Carga */}
            {selectedStudent && (
              <div className="mt-10 sm:mt-20 px-0">
                <LoadEvolutionChart 
                  studentId={selectedStudent.id} 
                  workouts={rawWorkoutRows}
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                />
              </div>
            )}

            {/* Nova Seção de Volume Load - Full Width */}
            {!isLoading && (
              <section className="mt-10 sm:mt-20 w-full bg-white dark:bg-[#0F0F0F]/50 border border-gray-100 dark:border-white/5 dark:thin-border p-6 sm:p-12 rounded-[32px] sm:rounded-[56px] space-y-8 sm:space-y-16 relative overflow-hidden backdrop-blur-2xl shadow-sm dark:shadow-none">
                <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-primary/5 blur-[80px] sm:blur-[140px] rounded-full pointer-events-none -mr-48 sm:-mr-96 -mt-48 sm:-mt-96"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-4 sm:gap-6">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/10 shrink-0">
                         <BarChartIcon className="text-primary size-6 sm:size-8" />
                      </div>
                      <span className="leading-tight">Monitoramento de Carga</span>
                    </h3>
                    <p className="text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-[0.3em] sm:tracking-[0.5em] sm:ml-20 flex items-center gap-3 sm:gap-4 leading-none">
                      Volume Load & Tonelagem
                      <span className="hidden sm:block w-12 h-[1px] bg-primary/30"></span>
                    </p>
                  </div>
                </div>

                <div className="space-y-10 sm:space-y-20">
                  <div className="w-full h-[300px] sm:h-[380px] overflow-hidden" key={selectedStudent?.id}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                      <BarChart 
                        layout="vertical"
                        data={sessionVolumeData.chartData} 
                        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                      >
                        <defs>
                          <filter id="footerBarShadow">
                            <feDropShadow dx="2" dy="0" stdDeviation="4" floodColor="#C5A07D" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke={document.documentElement.classList.contains('dark') ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)"} horizontal={true} vertical={false} />
                        <XAxis 
                          type="number"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)', fontSize: 8, fontWeight: '700' }}
                          unit="kg"
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)', fontSize: 10, fontStyle: 'italic', fontWeight: '900' }}
                          width={100}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(197, 160, 125, 0.03)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-primary/40 p-3 sm:p-5 rounded-2xl sm:rounded-[28px] shadow-2xl backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/5">
                                  <div className="flex items-baseline gap-2 mb-0.5 sm:mb-1">
                                    <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest">{payload[0].payload.name}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                                      {Number(payload[0].value).toLocaleString('pt-BR')}
                                    </span>
                                    <span className="text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-white/30 uppercase">kg</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="volume" 
                          radius={[0, 4, 4, 0]}
                          barSize={window.innerWidth < 640 ? 16 : 24}
                          style={{ filter: 'url(#footerBarShadow)' }}
                        >
                          {sessionVolumeData.chartData.map((entry, index) => {
                            const colorMap: Record<string, string> = {
                              'Quadríceps': '#8B5CF6',
                              'Glúteo': '#D946EF',
                              'Peitorais': '#C5A07D',
                              'Costas': '#3B82F6',
                              'Bíceps Femoral': '#F97316',
                              'Tríceps': '#22D3EE',
                              'Bíceps': '#4ADE80',
                              'Core': '#FACC15',
                              'Gastrocnêmios': '#FB7185'
                            };
                            return <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#94A3B8'} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 pt-10 sm:pt-16 border-t border-gray-100 dark:border-white/5 relative">
                    <div className="absolute top-0 left-0 w-24 sm:w-32 h-[1px] bg-primary"></div>
                    <div className="flex items-center gap-4 sm:gap-6 w-full">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl dark:shadow-black/40 ring-1 ring-primary/20 shrink-0">
                        <Scale className="text-primary size-6 sm:size-8" />
                      </div>
                      <div className="flex-1 w-full">
                        <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-gray-400 dark:text-white/20 mb-1">Carga Acumulada Sessão</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-12 w-full">
                          <div className="flex items-baseline gap-2 sm:gap-4">
                            <h5 className="text-5xl sm:text-8xl font-black text-primary tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(197,160,125,0.25)] sm:drop-shadow-[0_0_40px_rgba(197,160,125,0.35)]">
                              {sessionVolumeData.totalVolume.toLocaleString('pt-BR')}
                            </h5>
                            <span className="text-sm sm:text-xl font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.15em] sm:tracking-[0.2em] italic">kg</span>
                          </div>

                          {overloadStats.status !== 'neutral' && overloadStats.status !== 'first' && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 border backdrop-blur-xl",
                                overloadStats.status === 'increase' 
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.08)]" 
                                  : "bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.08)]"
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0",
                                overloadStats.status === 'increase' ? "bg-amber-500/20" : "bg-blue-500/20"
                              )}>
                                {overloadStats.status === 'increase' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs sm:text-[14px] font-black tabular-nums leading-none mb-0.5 sm:mb-1">
                                  {overloadStats.status === 'increase' ? '+' : ''}
                                  {`${overloadStats.percent.toFixed(1)}%`}
                                </span>
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-60 leading-none">
                                  {overloadStats.status === 'increase' ? 'Sobrecarga' : 'Deload'}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {selectedStudent && activeTab === 'periodizacao' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <PeriodizationModule data={periodization} onUpdate={setPeriodization} />
          </motion.div>
        )}

        {selectedStudent && activeTab === 'historico' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-12 py-6 sm:py-10"
          >
            <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#C5A07D]/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-[#C5A07D]/20 shadow-2xl shrink-0">
                <Clock className="text-[#C5A07D] size-6 sm:size-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-[#F5F5F0] leading-none">HISTÓRICO DE TREINO</h2>
                <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-white/30 italic">Registro completo de atividades</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] space-y-0.5 sm:space-y-1">
                  <p className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">{historyStats.currentMonthName}</p>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <p className="text-2xl sm:text-3xl font-black text-white leading-none">{historyStats.currentMonth}</p>
                    <p className="text-sm sm:text-3xl font-black text-white leading-none">Treinos</p>
                  </div>
                  <p className={cn(
                    "text-[10px] sm:text-[10px] font-black uppercase",
                    historyStats.diff >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>{historyStats.diffText} este mês</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] space-y-0.5 sm:space-y-1">
                  <p className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">{historyStats.lastMonthName}</p>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <p className="text-2xl sm:text-3xl font-black text-white leading-none">{historyStats.lastMonth}</p>
                    <p className="text-sm sm:text-3xl font-black text-white leading-none">Treinos</p>
                  </div>
                  <p className="text-[10px] sm:text-[10px] font-black uppercase text-white/20">Mês anterior</p>
                </div>
              </div>

              {/* Gráfico e Calendário Lado a Lado no Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
                {/* Gráfico de Frequência */}
                <div className="bg-white/[0.02] border border-white/5 p-5 lg:p-8 rounded-[32px] space-y-5 lg:space-y-8 lg:h-full flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2">
                    <BarChartIcon size={16} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Frequência Mensal</span>
                  </div>
                  <div className="h-[200px] lg:h-[260px] w-full flex-1 lg:ml-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historyStats.chartData} margin={{ top: 5, right: 5, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          interval={0}
                          height={40}
                          tick={(props: any) => {
                            const { x, y, payload } = props;
                            const dataPoint = historyStats.chartData.find(d => d.name === payload.value);
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text x={0} y={0} dy={14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10} fontWeight={900}>{payload.value}</text>
                                <text x={0} y={12} dy={14} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={8} fontWeight={700}>{dataPoint?.year}</text>
                              </g>
                            );
                          }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          allowDecimals={false}
                          width={35}
                          tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }}
                          label={{ 
                            value: 'TREINOS', 
                            angle: -90, 
                            position: 'insideLeft', 
                            offset: -5,
                            style: { 
                              fontSize: 18, 
                              fontWeight: 900, 
                              fill: 'rgba(255,255,255,0.2)', 
                              fontFamily: 'inherit',
                              textAnchor: 'middle'
                            } 
                          }}
                        />
                        <Tooltip cursor={{fill: 'transparent'}} content={() => null} />
                        <Bar 
                          dataKey="count" 
                          fill="#f59e0b" 
                          radius={[4, 4, 0, 0]} 
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Calendário */}
                <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-7 rounded-[32px] space-y-5 lg:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Calendário</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-90 transition-all text-white"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white min-w-[90px] text-center">
                        {historyViewDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      </span>
                      <button 
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-90 transition-all text-white"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 lg:gap-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                      <div key={d} className="text-center text-[10px] font-black text-white/20 mb-1">{d}</div>
                    ))}
                    {(() => {
                      const startOfMonth = new Date(historyViewDate.getFullYear(), historyViewDate.getMonth(), 1);
                      const endOfMonth = new Date(historyViewDate.getFullYear(), historyViewDate.getMonth() + 1, 0);
                      const daysInMonth = endOfMonth.getDate();
                      const startDay = startOfMonth.getDay();

                      const days = [];
                      for (let i = 0; i < startDay; i++) {
                        days.push(<div key={`empty-${i}`} />);
                      }

                      const trainedDays = timelineItems
                        .filter(item => {
                          const date = new Date(item.raw_date || item.date);
                          return date.getMonth() === historyViewDate.getMonth() && date.getFullYear() === historyViewDate.getFullYear();
                        })
                        .map(item => new Date(item.raw_date || item.date).getDate());

                      const now = new Date();
                      const isCurrentMonth = historyViewDate.getMonth() === now.getMonth() && historyViewDate.getFullYear() === now.getFullYear();

                      for (let i = 1; i <= daysInMonth; i++) {
                        const hasTrained = trainedDays.includes(i);
                        const isToday = isCurrentMonth && i === now.getDate();
                        const isSelected = historyViewDate.getDate() === i && isCurrentMonth;
                        
                        days.push(
                          <button 
                            key={i} 
                            onClick={() => {
                              const newDate = new Date(historyViewDate.getFullYear(), historyViewDate.getMonth(), i);
                              setHistoryViewDate(newDate);
                            }}
                            className={cn(
                              "aspect-square rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold border relative transition-all max-w-[32px] mx-auto w-full",
                              hasTrained 
                                ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                                : "bg-white/5 border-white/5 text-white/20",
                              isToday && !hasTrained && "border-amber-500/50",
                              isSelected && "ring-2 ring-[#C5A07D] ring-offset-2 ring-offset-black scale-110 z-10"
                            )}
                          >
                            {i}
                            {hasTrained && (
                              <div className="absolute -top-0.5 -right-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            )}
                          </button>
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>
              </div>

              {/* Atividade do Dia Selecionado */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Atividades do Dia Selecionado</span>
                </div>
                
                {isLoadingTimeline ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="animate-spin text-amber-500 size-6" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Carregando histórico...</p>
                  </div>
                ) : filteredDailyHistory.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredDailyHistory.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/[0.02] border border-white/5 p-5 rounded-[24px] hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                              item.type === 'external' ? "bg-amber-500/10 text-amber-500" : "bg-[#C5A07D]/10 text-[#C5A07D]"
                            )}>
                              {item.type === 'external' ? <Zap size={20} /> : <Dumbbell size={20} />}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">{item.fase}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-white/40 italic">
                                  {new Date(item.raw_date || item.date).toLocaleDateString('pt-BR')}
                                </span>
                                {(item.date.includes('•')) && (
                                  <>
                                    <span className="text-white/10 text-[8px]">•</span>
                                    <span className="text-[10px] font-bold text-white/40 italic">
                                      {item.date.split('•')[1].trim()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {item.status && (
                            <div className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{item.status}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[32px] text-center space-y-3">
                    <Clock className="text-white/5 size-12 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Sem atividades para este dia.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!selectedStudent && (
          <div className="w-full flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center">
              <ClipboardList className="text-primary" size={48} />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Nenhum Aluno Selecionado</h2>
              <p className="text-on-surface-variant text-sm">Pesquise e selecione um aluno no campo de busca acima para começar a prescrever treinos.</p>
            </div>
          </div>
        )}

      {/* Evolution History Modal - Elite Refactor */}
      <AnimatePresence>
        {historyExercise && (
          <div 
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/95 backdrop-blur-xl sm:p-6 p-0 pt-[env(safe-area-inset-top,2.5rem)] overflow-y-auto"
            onClick={() => setHistoryExercise(null)}
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl bg-[#030303] border-t sm:border-2 border-[#C5A07D]/20 sm:rounded-[32px] rounded-t-[32px] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col sm:max-h-[85vh] h-fit mb-12 sm:mb-0 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 flex justify-between items-start border-b border-white/5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C5A07D] animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C5A07D]">Performance Nexo</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-[#F5F5F0] leading-none">
                    {historyExercise.name}
                  </h3>
                </div>
                <button 
                  onClick={() => setHistoryExercise(null)} 
                  className="p-2.5 bg-white/5 rounded-xl text-white/30 hover:text-white transition-all hover:bg-white/10"
                >
                  <X size={20}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
                {/* 1. Gráfico de Performance (Topo) */}
                <div className="w-full h-[180px] min-h-[180px]">
                  {isLoadingHistory ? (
                    <div className="h-full w-full flex items-center justify-center bg-white/[0.02] rounded-2xl">
                      <Loader2 className="animate-spin text-[#C5A07D]" size={24} />
                    </div>
                  ) : loadHistory.filter(r => r.is_pr).length > 0 ? (
                    <div className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[...loadHistory].filter(r => r.is_pr).reverse().map(r => {
                            const dateObj = new Date(r.date || r.created_at);
                            const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                            const year = dateObj.getFullYear();
                            return {
                              dateLabel: `${month} ${year}`,
                              fullDate: dateObj.toLocaleDateString('pt-BR'),
                              weight_value: r.weight_value
                            };
                          })}
                          margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <XAxis 
                            dataKey="dateLabel" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#ffffff', fontSize: 9, fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#ffffff', fontSize: 9 }}
                            tickFormatter={(val) => `${val}kg`}
                            width={45}
                            domain={[0, 'auto']}
                            allowDataOverflow={false}
                          />
                          <Tooltip 
                            cursor={{ fill: '#C5A07D10', radius: 6 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-[#121212] border border-[#C5A07D]/40 p-3 rounded-xl shadow-2xl">
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                                    <p className="text-sm font-black text-[#C5A07D]">Carga: {payload[0].value}kg</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="weight_value" 
                            fill="#C5A07D" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[140px] w-full flex flex-col items-center justify-center bg-white/[0.02] rounded-[24px] border border-dashed border-white/5 space-y-3">
                      <TrendingUp size={32} className="text-white/10" />
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Sem histórico ainda</p>
                    </div>
                  )}
                </div>

                {/* 2. Painel de Input (Centro) */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={oneRMValue || ''} 
                      onChange={(e) => setOneRMValue(parseFloat(e.target.value) || 0)}
                      placeholder="CARGA MAX (KG)"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-lg font-black text-white outline-none focus:border-[#C5A07D]/50 transition-all placeholder:text-white/10 text-center sm:text-left"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#C5A07D]/40 font-black text-[10px] uppercase tracking-widest hidden sm:block">KG</div>
                  </div>
                  
                  <button 
                    onClick={handleSavePR}
                    disabled={isSavingPR || oneRMValue <= 0}
                    className="flex-[0.6] bg-[#C5A07D] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 shadow-[0_8px_20px_rgba(197,160,125,0.15)] py-3.5"
                  >
                    {isSavingPR ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
                    SALVAR RECORDE
                  </button>
                </div>

                {/* 3. Grid de Intensidades (Base) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5"></div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Intensidade</p>
                    <div className="h-px flex-1 bg-white/5"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    {[0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55].map((perc) => (
                      <div 
                        key={perc} 
                        className="bg-[#080808] border border-white/5 rounded-2xl flex flex-col items-center justify-center py-3 group hover:border-[#C5A07D]/30 transition-all relative shadow-inner"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#C5A07D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-[8px] font-black text-[#C5A07D] uppercase tracking-widest leading-none mb-0.5 opacity-60">
                          {Math.round(perc * 100)}%
                        </span>
                        <p 
                          className="text-[#F5F5F0] font-black tracking-tight w-full text-center truncate px-2"
                          style={{ fontSize: '15px' }}
                        >
                          {(oneRMValue * perc).toFixed(1)}
                          <span className="text-[8px] ml-0.5 opacity-20 uppercase font-bold text-xs">kg</span>
                        </p>
                      </div>
                    ))}
                    {/* Visual Placeholder */}
                    <div className="bg-gradient-to-br from-white/[0.01] to-transparent border border-dashed border-white/5 rounded-2xl flex items-center justify-center py-3">
                      <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center">
                        <Activity size={16} className="text-white/5" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clone Workout Modal */}
      <AnimatePresence>
        {showCloneModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="w-[92vw] sm:w-full sm:max-w-md bg-[#0F0F0F] border border-white/10 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6 sm:space-y-8 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center shrink-0 border-b border-white/5 pb-4 sm:pb-6">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 sm:gap-3">
                    <Users className="text-primary size-5 sm:size-6"/> 
                    Clonar Planilha
                  </h3>
                  <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-white/30">Selecione o aluno de destino</p>
                </div>
                <button 
                  onClick={() => setShowCloneModal(false)} 
                  className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-white/40 hover:text-white transition-all hover:bg-white/10"
                >
                  <X size={20}/>
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
                {students.length === 0 ? (
                  <div className="py-12 text-center opacity-20">
                    <Users size={40} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum aluno encontrado</p>
                  </div>
                ) : students
                  .filter(s => s.id !== selectedStudent?.id)
                  .map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => cloneWorkout(s.id)} 
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/[0.03] rounded-2xl sm:rounded-[24px] hover:bg-primary/10 transition-all border border-white/5 hover:border-primary/30 group text-left"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                      {s.img && s.img !== "" ? (
                        <img src={s.img} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="text-white/20" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors truncate">{s.name}</p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest truncate">{s.goal || 'Sem objetivo'}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <Check className="text-primary" size={16} />
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-[8px] sm:text-[9px] text-center text-white/20 italic px-4 leading-relaxed shrink-0 pt-2">
                O treino atual de {selectedStudent?.name} será integralmente copiado para o aluno selecionado.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exercise Library Modal */}
      <AnimatePresence>
        {showLibraryModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="w-full max-w-md bg-[#0A0A0A] border-2 border-[#C5A07D]/30 p-10 rounded-[40px] shadow-[0_0_50px_rgba(197,160,125,0.15)] space-y-8"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-[#C5A07D] flex items-center gap-3">
                    Nova Entrada
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Cadastro Global de Exercícios</p>
                </div>
                <button onClick={() => setShowLibraryModal(false)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all hover:bg-white/10">
                  <X size={20}/>
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A07D] block ml-1">Nome do Exercício</label>
                  <input
                    autoFocus
                    value={newLibraryExercise.name}
                    onChange={e => setNewLibraryExercise({ ...newLibraryExercise, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-sm font-bold placeholder:text-white/10 focus:border-[#C5A07D] outline-none transition-all"
                    placeholder="Ex: Leg Press 45º..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A07D] block ml-1">Grupamento Muscular</label>
                  <select
                    value={newLibraryExercise.muscle_id}
                    onChange={e => setNewLibraryExercise({ ...newLibraryExercise, muscle_id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-sm font-bold text-white focus:border-[#C5A07D] outline-none transition-all appearance-none"
                  >
                    {MUSCLE_GROUPS.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#0A0A0A]">{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  disabled={isAddingToLibrary || !newLibraryExercise.name}
                  onClick={handleCreateAndAddExercise}
                  className="w-full py-5 bg-[#C5A07D] text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-lg shadow-[#C5A07D]/20"
                >
                  {isAddingToLibrary ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Check size={20} /> Salvar e Inserir no Treino
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showModalitySelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black border border-white/10 p-8 rounded-[40px] w-full max-w-2xl relative shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div className="flex justify-between items-center mb-8 relative">
              <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">Selecionar Modalidade</h3>
              <button onClick={() => setShowModalitySelector(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative">
              {MODALITIES.map(mod => (
                <button
                  key={mod.name}
                  onClick={() => addModalityBlock(mod.name)}
                  className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-primary/10 hover:border-primary/40 transition-all group"
                >
                  <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                    <mod.icon className="text-primary" size={32} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#F5F5F0]">{mod.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Prescription;
