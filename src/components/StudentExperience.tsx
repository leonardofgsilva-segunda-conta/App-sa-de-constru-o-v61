import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  Timer, 
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  Clock,
  ThumbsUp,
  X,
  Plus,
  ArrowRight,
  Loader2,
  Sparkles,
  LogOut,
  User,
  Camera,
  Sun,
  Moon,
  ClipboardList,
  Calendar,
  BarChart,
  Target,
  Trophy,
  MoreVertical,
  History,
  Dumbbell,
  Navigation,
  Pause,
  Square,
  Waves,
  Activity
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  LineChart as RechartsLineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from '../lib/utils';
import LoadEvolutionChart from './LoadEvolutionChart';
import { dataService, Student, WorkoutRow, LoadRecord, Evaluation, Prescription } from '../services/dataService';
import { suggestWorkoutAdjustment } from '../services/aiService';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const PHASE_THEME: Record<string, { bg: string, border: string, glow: string }> = {
  recuperacao: { bg: "bg-[#22C55E]", border: "border-[#22C55E]/30", glow: "shadow-[#22C55E]/20" },
  adaptacao: { bg: "bg-[#EAB308]", border: "border-[#EAB308]/30", glow: "shadow-[#EAB308]/20" },
  hipertrofia: { bg: "bg-[#F97316]", border: "border-[#F97316]/30", glow: "shadow-[#F97316]/20" },
  forca_maxima: { bg: "bg-[#EF4444]", border: "border-[#EF4444]/30", glow: "shadow-[#EF4444]/20" },
  potencia: { bg: "bg-[#A855F7]", border: "border-[#A855F7]/30", glow: "shadow-[#A855F7]/20" },
  choque: { bg: "bg-[#881337]", border: "border-[#881337]/30", glow: "shadow-[#881337]/20" },
  manutencao: { bg: "bg-[#3B82F6]", border: "border-[#3B82F6]/30", glow: "shadow-[#3B82F6]/20" },
  especifico: { bg: "bg-[#06B6D4]", border: "border-[#06B6D4]/30", glow: "shadow-[#06B6D4]/20" },
};

const MODALITY_THEMES: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'musculação': { color: '#C5A07D', bg: 'bg-[#C5A07D]/10', border: 'border-[#C5A07D]/20', icon: Dumbbell },
  'natação': { color: '#06B6D4', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20', icon: Waves },
  'corrida': { color: '#3B82F6', bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/20', icon: Activity },
  'crossfit': { color: '#EF4444', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', icon: Zap },
  'tênis': { color: '#A3E635', bg: 'bg-[#A3E635]/10', border: 'border-[#A3E635]/20', icon: Target },
  'vôlei': { color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/20', icon: Activity },
  'cardio': { color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20', icon: Zap },
  'default': { color: '#C5A07D', bg: 'bg-[#C5A07D]/10', border: 'border-[#C5A07D]/20', icon: ClipboardList }
};

interface StudentExperienceProps {
  studentId: string;
  onExit: () => void;
  onLogout: () => void;
  userRole?: 'student' | 'trainer' | 'owner' | null;
  viewMode?: 'student' | 'trainer';
}

const StudentExperience: React.FC<StudentExperienceProps> = ({ studentId, onExit, onLogout, userRole, viewMode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [showPainModal, setShowPainModal] = useState<{ exerciseId: string; name: string } | null>(null);
  const [painData, setPainData] = useState<{ level: number; locations: string[]; notes: string; pse: number }>({ 
    level: 0, 
    locations: [], 
    notes: '',
    pse: 5
  });
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [timer, setTimer] = useState<number | null>(null); // Rest timer
  const [workoutTimer, setWorkoutTimer] = useState<number>(0); // Global training stopwatch
  const [isTrainingStarted, setIsTrainingStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastLoads, setLastLoads] = useState<Record<string, LoadRecord>>({});
  const [exercisePRs, setExercisePRs] = useState<Record<string, number>>({});
  const [currentExecution, setCurrentExecution] = useState<{ load: string; reps: string } | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [expandedPR, setExpandedPR] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'treino' | 'avaliacao' | 'periodizacao'>('treino');
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [historyViewDate, setHistoryViewDate] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [checkinHistory, setCheckinHistory] = useState<any[]>([]);
  const [exerciseSetsProgress, setExerciseSetsProgress] = useState<Record<string, number>>({});
  const [activeCardioTimer, setActiveCardioTimer] = useState<{ exerciseId: string; remaining: number; total: number; isPaused: boolean } | null>(null);
  const lastPlayedRef = useRef<{ alerted: string[] }>({ alerted: [] });

  const sendNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { 
          body, 
          icon: '/favicon.ico',
          tag: 'nexo-rest-timer'
        });
      } catch (e) {
        // Fallback for some mobile browsers that don't support new Notification() directly
        if ('serviceWorker' in navigator && (navigator as any).serviceWorker.ready) {
          (navigator as any).serviceWorker.ready.then((registration: any) => {
            registration.showNotification(title, { body, icon: '/favicon.ico', tag: 'nexo-rest-timer' });
          });
        }
      }
    }
  };

  const incrementSetProgress = (exerciseId: string) => {
    setExerciseSetsProgress(prev => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || 0) + 1
    }));
  };

  const handleOpenEvolution = () => {
    setShowEvolution(true);
    setIsMenuOpen(false);
  };

  const filteredDailyHistory = useMemo(() => {
    const selectedDateStr = historyViewDate.toISOString().split('T')[0];
    return checkinHistory
      .filter(h => {
        const recordDate = new Date(h.date);
        return recordDate.toISOString().split('T')[0] === selectedDateStr;
      })
      .sort((a, b) => {
        // External first
        if (a.type === 'external' && b.type !== 'external') return -1;
        if (a.type !== 'external' && b.type === 'external') return 1;
        // Then by date descending
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [checkinHistory, historyViewDate]);

  const [showExternalRecord, setShowExternalRecord] = useState(false);
  const [externalWorkoutData, setExternalWorkoutData] = useState({
    modality: 'Corrida',
    value: 0,
    intensity: 'Moderada',
    notes: ''
  });
  const [isSavingExternal, setIsSavingExternal] = useState(false);

  // GPS Tracking State
  const [gpsTrackingState, setGpsTrackingState] = useState<'idle' | 'tracking' | 'paused'>('idle');
  const [gpsData, setGpsData] = useState({
    distance: 0, // km
    startTime: 0,
    elapsedTime: 0, // seconds
    pace: '0:00',
    speed: 0,
    points: [] as { lat: number; lng: number; timestamp: number; accuracy: number }[]
  });
  const gpsWatchId = useRef<number | null>(null);
  const gpsLastPos = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const gpsTimerRef = useRef<any>(null);

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada no seu navegador.");
      return;
    }

    setGpsTrackingState('tracking');
    setGpsData(prev => ({
      ...prev,
      startTime: Date.now(),
      distance: 0,
      elapsedTime: 0,
      points: []
    }));

    gpsWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const now = Date.now();

        setGpsData(prev => {
          let newDistance = prev.distance;
          if (gpsLastPos.current) {
            const d = haversine(
              gpsLastPos.current.lat, 
              gpsLastPos.current.lng, 
              latitude, 
              longitude
            );
            // Only add if accuracy is reasonable and distance is above threshold
            if (accuracy < 30 && d > 0.002) {
              newDistance += d;
            }
          }

          gpsLastPos.current = { lat: latitude, lng: longitude, timestamp: now };

          const newPoints = [...prev.points, { 
            lat: latitude, 
            lng: longitude, 
            timestamp: now, 
            accuracy 
          }];

          // Calculate pace/speed
          const totalMinutes = prev.elapsedTime / 60;
          let paceStr = '0:00';
          let avgSpeed = 0;

          if (newDistance > 0) {
            const paceMinPerKm = totalMinutes / newDistance;
            const pm = Math.floor(paceMinPerKm);
            const ps = Math.floor((paceMinPerKm - pm) * 60);
            paceStr = `${pm}:${ps.toString().padStart(2, '0')}`;
            
            if (prev.elapsedTime > 0) {
              avgSpeed = newDistance / (prev.elapsedTime / 3600);
            }
          }

          return {
            ...prev,
            distance: newDistance,
            points: newPoints,
            pace: paceStr,
            speed: avgSpeed
          };
        });
      },
      (error) => {
        console.error("GPS Error:", error);
        toast.error("Erro no GPS. Verifique as permissões de localização.");
        stopGpsTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    gpsTimerRef.current = setInterval(() => {
      setGpsData(prev => ({
        ...prev,
        elapsedTime: prev.elapsedTime + 1
      }));
    }, 1000);
  };

  const pauseGpsTracking = () => {
    if (gpsTrackingState === 'tracking') {
      setGpsTrackingState('paused');
      if (gpsWatchId.current) navigator.geolocation.clearWatch(gpsWatchId.current);
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
      gpsLastPos.current = null;
    } else if (gpsTrackingState === 'paused') {
      // Resume
      setGpsTrackingState('tracking');
      startGpsTracking();
    }
  };

  const stopGpsTracking = () => {
    setGpsTrackingState('idle');
    if (gpsWatchId.current) navigator.geolocation.clearWatch(gpsWatchId.current);
    if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
    gpsWatchId.current = null;
    gpsLastPos.current = null;
    
    // Auto-fill distance if meaningful
    if (gpsData.distance > 0) {
      setExternalWorkoutData(prev => ({
        ...prev,
        value: Number(gpsData.distance.toFixed(2))
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (gpsWatchId.current) navigator.geolocation.clearWatch(gpsWatchId.current);
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
    };
  }, []);

  const getCurrentStudent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[STUDENT FIX] No auth user found');
      return null;
    }

    console.log(`[TOAST FILTER] role atual: ${userRole}`);
    console.log(`[TOAST FILTER] rota atual: ${window.location.pathname}`);
    console.log(`[TOAST FILTER] user.email: ${user.email}`);

    let query = supabase
      .from("students")
      .select("id, name, email, status, professor_id, user_id, goal, frequency");
    
    if (user.id) {
      query = query.or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`);
    } else {
      query = query.eq("email", user.email?.toLowerCase());
    }

    const { data: currentStudent, error } = await query.maybeSingle();

    const isTrainerRoute = window.location.pathname.includes('/dashboard') || 
                           window.location.pathname.includes('/professor') || 
                           window.location.pathname.includes('/trainer');

    if (isTrainerRoute || userRole === 'trainer') {
      console.log('[TOAST FILTER] toast de aluno bloqueado no professor');
    }

    if (error) {
      if (viewMode === 'student' && userRole !== 'trainer' && !isTrainerRoute) {
        console.error("[STUDENT FIX] Aluno não encontrado. Verifique se o e-mail do login é o mesmo do cadastro.", error);
      }
      return null;
    }

    console.log(`[STUDENT FIX] currentStudent:`, currentStudent);

    if (currentStudent) {
      console.log(`[STUDENT FIX] currentStudent.id usado para treinos: ${currentStudent.id}`);
      
      const displayName = currentStudent.name || currentStudent.email;
      
      // Map to Student interface expected by state (minimal properties for now)
      return {
        ...currentStudent,
        name: displayName,
        goal: currentStudent.goal || "",
        freq: currentStudent.frequency || "",
        status: currentStudent.status || "pendente",
        img: "",
        professor_id: currentStudent.professor_id || ""
      } as Student;
    } else {
      console.log('[STUDENT FIX] Aluno não encontrado para o email:', user.email);
      const isTrainerRoute = window.location.pathname.includes('/dashboard') || 
                             window.location.pathname.includes('/professor') || 
                             window.location.pathname.includes('/trainer');
                             
      if (viewMode === 'student' && userRole !== 'trainer' && !isTrainerRoute) {
        console.log('[TOAST FILTER] disparando toast para aluno não encontrado');
        toast.error("Aluno não encontrado. Verifique se o e-mail do login é o mesmo do cadastro.");
      } else {
        console.log('[TOAST FILTER] toast de aluno bloqueado (viewMode:', viewMode, 'role:', userRole, 'route:', window.location.pathname, ')');
      }
      return null;
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const activeWorkout = workouts[activeWorkoutIndex];
  const workoutName = activeWorkout?.workout_type || 'Treino';
  const exercises = useMemo(() => {
    if (!activeWorkout?.workout_data) return [];
    
    // Prioritize blocks if they exist
    if (activeWorkout.workout_data.blocks && Array.isArray(activeWorkout.workout_data.blocks)) {
      const allEx = activeWorkout.workout_data.blocks.flatMap(b => b.exercises || []);
      if (activeBlockId) {
        const block = activeWorkout.workout_data.blocks.find(b => b.id === activeBlockId);
        return block?.exercises || [];
      }
      return allEx;
    }

    return activeWorkout.workout_data.exercises || [];
  }, [activeWorkout, activeBlockId]);

  useEffect(() => {
    if (!student || !activeWorkout) return;
    
    const exercisesList = activeWorkout.workout_data?.exercises || [];
    if (exercisesList.length === 0) return;

    const fetchExerciseData = async () => {
      // 1. Buscar usuário logado (Obrigatório: Rule 1)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log(`[LOAD RPC] user.email: ${user.email}`);
      
      // 2. Chamar a RPC para buscar o resumo de carga e PR
      const { data, error } = await supabase.rpc("get_student_load_summary", {
        p_student_email: user.email
      });

      if (error) {
        console.error("Error calling get_student_load_summary:", error);
        return;
      }

      console.log(`[LOAD RPC] dados retornados:`, data);

      const loadMap: Record<string, any> = {};
      const prMap: Record<string, number> = {};

      if (data && Array.isArray(data)) {
        data.forEach((row: any) => {
          const exId = row.exercise_id;
          const exName = row.exercise_name;
          const lastLoad = row.last_weight;
          const prLoad = row.pr_weight;

          // 4. Montar mapas por exercício (ID e Fallback Nome)
          if (exId) {
            loadMap[exId] = { weight_value: lastLoad };
            prMap[exId] = prLoad;
          }
          if (exName) {
            loadMap[exName] = { weight_value: lastLoad };
            prMap[exName] = prLoad;
          }
        });
      }

      console.log(`[LOAD RPC] previousLoads final`, loadMap);
      console.log(`[LOAD RPC] PRs final`, prMap);

      // 8. Preencher o estado visual da tela com esses dados ao carregar a página.
      setLastLoads(prev => ({ ...prev, ...loadMap }));
      setExercisePRs(prev => ({ ...prev, ...prMap }));
    };

    fetchExerciseData();
  }, [activeWorkoutIndex, student, activeWorkout]);

  useEffect(() => {
    let mounted = true;
    
    // Timeout de segurança absoluto: força o carregamento falso se o Supabase travar
    const experienceTimeout = setTimeout(() => {
      if (mounted) {
        console.log('DEBUG: Student Experience Safety Timeout Triggered');
        setLoading(false);
      }
    }, 2500);

    let prChannel: any = null;

    const fetchData = async () => {
      try {
        if (mounted) setLoading(true);
        
        // Final safety check before database calls to prevent 22P02 error (invalid UUID)
        const studentInfo = await getCurrentStudent();
        
        if (!studentInfo || !mounted) {
          if (mounted) setLoading(false);
          return;
        }

        const currentId = studentInfo.id;
        setStudent(studentInfo);

        // Fetch data using the identified ID
        const [workoutRes, evalRes, prescriptionRes] = await Promise.all([
          dataService.getWorkouts(currentId),
          dataService.getLatestEvaluation(currentId),
          dataService.getPrescription(currentId)
        ]);
        
        if (!mounted) return;

        setWorkouts(workoutRes || []);
        setLatestEvaluation(evalRes);
        setPrescription(prescriptionRes);

        // Real-time synchronization of Records (PR)
        if (currentId) {
          // Robustez: Remover canal antes de criar para evitar erro de assinatura duplicada
          supabase.removeChannel(supabase.channel(`pr_sync_student_${currentId}`));

          prChannel = supabase
            .channel(`pr_sync_student_${currentId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'user_records',
                filter: `student_id=eq.${currentId}`
              },
              async () => {
                const freshPRs = await dataService.getStudentPRs(currentId);
                const updatedPrMap: Record<string, number> = {};
                freshPRs.forEach((pr: any) => {
                  updatedPrMap[pr.exercise_id] = pr.one_rm;
                });
                setExercisePRs(prev => ({ ...prev, ...updatedPrMap }));
              }
            )
            .subscribe();
        }
      } catch (error: any) {
        console.error('[EXPERIENCE] Error loading student data:', error);
        
        // Handle refresh token errors by logging out
        if (error.message?.includes('Refresh Token') || error.message?.includes('not found')) {
          onLogout();
          return;
        }

        toast.error('Erro de conexão', {
          description: 'Não foi possível sincronizar seus dados.'
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
      if (prChannel) supabase.removeChannel(prChannel);
      clearTimeout(experienceTimeout);
    };
  }, [studentId, onLogout]);

  // Synchronized General Workout Timer Logic
  useEffect(() => {
    let interval: any;
    
    const syncWorkoutTimer = () => {
      if (!isTrainingStarted || showSummary) return;
      
      const startedAt = localStorage.getItem('nexo_workout_started_at');
      if (startedAt) {
        const elapsed = Math.floor((Date.now() - parseInt(startedAt)) / 1000);
        setWorkoutTimer(elapsed);
      }
    };

    if (isTrainingStarted && !showSummary) {
      interval = setInterval(syncWorkoutTimer, 1000);
      syncWorkoutTimer();
    }

    const events = ['visibilitychange', 'focus', 'pageshow'];
    events.forEach(e => window.addEventListener(e, syncWorkoutTimer));

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, syncWorkoutTimer));
    };
  }, [isTrainingStarted, showSummary]);

  const avisarAluno = (texto: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel previous speech to avoid overlapping
      window.speechSynthesis.cancel();
      const mensagem = new SpeechSynthesisUtterance(texto);
      mensagem.lang = 'pt-BR';
      mensagem.rate = 1.0;
      mensagem.pitch = 1.0;
      window.speechSynthesis.speak(mensagem);
    }
  };

  const tocarBipe = (isFinal: boolean = false) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (common on mobile)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      // Bip frequencies for countdown and final alert
      oscillator.frequency.setValueAtTime(isFinal ? 1200 : 880, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(isFinal ? 0.4 : 0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isFinal ? 1.2 : 0.4));

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + (isFinal ? 1.2 : 0.4));
      
      // Haptic feedback (Mobile Fallback)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(isFinal ? [200, 100, 200, 100, 400] : [80]);
      }
    } catch (e) {
      console.warn('Audio/Haptic feedback failed', e);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(isFinal ? [200, 100, 200, 100, 400] : [100]);
      }
    }
  };

  // Cardio Timer Logic
  useEffect(() => {
    let interval: any;
    if (activeCardioTimer && !activeCardioTimer.isPaused && activeCardioTimer.remaining > 0) {
      interval = setInterval(() => {
        setActiveCardioTimer(prev => {
          if (!prev || prev.remaining <= 0) return prev;
          
          const newRemaining = prev.remaining - 1;
          
          // Alerts
          if (newRemaining === 10) {
            avisarAluno('Faltam 10 segundos para finalizar o cardio.');
          }
          if (newRemaining <= 3 && newRemaining > 0) {
            tocarBipe(false);
          }
          if (newRemaining === 0) {
            tocarBipe(true);
            avisarAluno('Cardio finalizado! Excelente trabalho.');
            sendNotification('Cardio Concluído', 'Você finalizou seu exercício aeróbico.');
          }

          return { ...prev, remaining: newRemaining };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCardioTimer?.isPaused, activeCardioTimer === null]);

  const startCardio = (exercise: any) => {
    const durationMin = exercise.duration || 20;
    const durationSec = durationMin * 60;
    
    // Unlock audio for mobile
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}

    setActiveCardioTimer({
      exerciseId: exercise.id,
      remaining: durationSec,
      total: durationSec,
      isPaused: false
    });

    toast.success('Cardio Iniciado!', {
      description: `Tempo: ${durationMin} minutos`
    });
  };

  const togglePauseCardio = () => {
    setActiveCardioTimer(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null);
  };

  const finishCardio = (exerciseId: string) => {
    toggleExerciseCompletion(exerciseId, -1);
    setActiveCardioTimer(null);
    toast.success('Cardio concluído com sucesso!');
  };

  const formatCardioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Background Sync and Audio Alerts Logic
  useEffect(() => {
    // Restore general workout state
    const startedAt = localStorage.getItem('nexo_workout_started_at');
    if (startedAt) {
      setIsTrainingStarted(true);
      const elapsed = Math.floor((Date.now() - parseInt(startedAt)) / 1000);
      setWorkoutTimer(elapsed);
    }

    let interval: any;
    
    const syncTimer = () => {
      const saved = localStorage.getItem('nexo_rest_timer');
      if (!saved) {
        if (timer !== null) setTimer(null);
        lastPlayedRef.current = { alerted: [] };
        return;
      }

      try {
        const data = JSON.parse(saved);
        const elapsed = Date.now() - data.startedAt;
        const remainingMs = data.durationMs - elapsed;
        const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

        // Use a small buffer to ensure we don't skip the last second in UI
        setTimer(prev => (prev === remainingSecs ? prev : remainingSecs));

        const isBackground = document.visibilityState === 'hidden';

        if (remainingSecs > 0) {
          // AI Voice alert exactly at 8s (or first check after 8s if returning from background)
          if (remainingSecs <= 8 && !lastPlayedRef.current.alerted.includes('warned8')) {
            avisarAluno('ATENÇÃO... Seu descanso está acabando. Prepare-se para a próxima série.');
            lastPlayedRef.current.alerted.push('warned8');
          }
          
          // Bips at 3, 2, 1
          [3, 2, 1].forEach(s => {
            if (remainingSecs <= s && !lastPlayedRef.current.alerted.includes(`beep${s}`)) {
              tocarBipe(false);
              lastPlayedRef.current.alerted.push(`beep${s}`);
            }
          });
        } else if (remainingSecs === 0 && !lastPlayedRef.current.alerted.includes('finalBeep')) {
          // Final Bip and resolution
          tocarBipe(true);
          lastPlayedRef.current.alerted.push('finalBeep');
          
          setTimer(null); // Auto-hide timer
          localStorage.removeItem('nexo_rest_timer');

          if (isBackground) {
            sendNotification('Descanso finalizado', 'Prepare-se para a próxima série.');
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
          }

          toast.success('Descanso finalizado!', {
            description: 'Prepare-se para a próxima série.'
          });
        }
      } catch (e) {
        localStorage.removeItem('nexo_rest_timer');
      }
    };

    // Events for mobile background resume context
    const events = ['visibilitychange', 'focus', 'pageshow'];
    events.forEach(e => window.addEventListener(e, syncTimer));
    
    interval = setInterval(syncTimer, 500);
    syncTimer(); // Immediate check on mount/resume
    
    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, syncTimer));
    };
  }, []);

  const startRestTimer = (restValue: string, exerciseId: string = "unknown") => {
    // Unblock Audio and Speech for Mobile
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        const silent = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(silent);
      }

      // Request Notification permission on first usage
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (e) {}

    // Parse rest value like "60s", "1m", "1:30"
    let seconds = 60; // default
    const cleanValue = restValue.toLowerCase().trim();
    
    if (cleanValue.includes('m')) {
      const mins = parseFloat(cleanValue.replace('m', '')) || 1;
      seconds = Math.floor(mins * 60);
    } else if (cleanValue.includes('s')) {
      seconds = parseInt(cleanValue.replace('s', '')) || 60;
    } else if (cleanValue.includes(':')) {
      const parts = cleanValue.split(':');
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      seconds = (mins * 60) + secs;
    } else {
      seconds = parseInt(cleanValue) || 60;
    }

    const durationMs = seconds * 1000;
    const startedAt = Date.now();
    
    // Persist for background synchronization
    localStorage.setItem('nexo_rest_timer', JSON.stringify({
      startedAt,
      durationMs,
      exerciseId
    }));
    
    lastPlayedRef.current = { alerted: [] };
    setTimer(seconds);
    toast.info('Cronômetro de descanso iniciado');
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartWorkout = (blockId?: string) => {
    setActiveBlockId(blockId || null);
    setIsTrainingStarted(true);
    setExerciseSetsProgress({});
    localStorage.removeItem('nexo_rest_timer');
    localStorage.setItem('nexo_workout_started_at', Date.now().toString());
    toast.success('Treino Iniciado!', {
      description: 'O cronômetro de ciência está contando.'
    });
  };

  const handleFinishWorkout = () => {
    // Congelar o tempo imediatamente ao clicar em finalizar
    setIsTrainingStarted(false); 
    setIsFinishing(true);
    setShowPainModal({ exerciseId: 'final', name: 'Resumo do Treino' });
  };

  const completeWorkout = async () => {
    try {
      const currentStudent = await getCurrentStudent();
      if (!currentStudent) throw new Error("Aluno não encontrado");

      if (currentStudent.status !== "ativo") {
        toast.error("Seu acesso ainda está aguardando aprovação do professor.");
        return;
      }

      const currentUserId = currentStudent.id;
      
      const completedAt = new Date().toISOString();
      
      // 1. Salvar check-in (horário e tempo) na tabela 'checkins'
      await dataService.saveCheckin({
        student_id: currentUserId,
        duration_seconds: workoutTimer,
        completed_at: completedAt
      });

      // 2. Salvar relato de dor e articulações na tabela 'workout_history'
      console.log(`[WORKOUT HISTORY] insert student_id`);
      await dataService.saveWorkoutHistory({
        student_id: currentUserId,
        workout_type: workoutName,
        total_volume: totalVolume,
        pain_level: painData.level,
        pain_location: painData.locations.join(', '),
        notes: painData.notes,
        pse: painData.pse,
        duration_seconds: workoutTimer,
        completed_at: completedAt,
        status: 'pendente' 
      });

      toast.success('Check-in realizado com sucesso! Missão cumprida.');
      
      setIsFinished(true);
      setIsFinishing(false);

      // Aguarda o feedback visual de sucesso antes de sair
      setTimeout(() => {
        handleExitExperience();
        setIsFinished(false);
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao realizar check-in:', error);
      
      if (error.message?.includes('Refresh Token') || error.message?.includes('not found')) {
        onLogout();
        return;
      }

      toast.error('Erro ao sincronizar check-in', {
        description: 'Tente novamente ou relate ao seu treinador.'
      });
      // Mesmo com erro, mostramos o resumo para não travar o fluxo do aluno
      setShowSummary(true);
    }
  };

  const handleCompleteSeries = async (exercise: any, load: string) => {
    try {
      // 1. Buscar o aluno atual na tabela students pelo email do usuário logado via helper
      const currentStudent = await getCurrentStudent();

      // 2. Se currentStudent não existir, mostrar: "Aluno não encontrado no banco de dados."
      if (!currentStudent) {
        toast.error("Aluno não encontrado no banco de dados.");
        return;
      }

      // 3. Se currentStudent.status não for "ativo", mostrar: "Seu acesso ainda está aguardando aprovação do professor."
      if (currentStudent.status !== "ativo") {
        toast.error("Seu acesso ainda está aguardando aprovação do professor.");
        return;
      }

      const numLoad = parseFloat(load);
      
      if (isNaN(numLoad)) {
        toast.error('Insira um valor válido para a carga');
        return;
      }

      const finalReps = parseInt(exercise.reps?.toString().replace(/\D/g, '')) || 10;
      setTotalVolume(prev => prev + (numLoad * finalReps));
      
      console.log(`[LOAD HISTORY] insert student_id`);

      const record = {
        student_id: currentStudent.id, // OBRIGATÓRIO (4)
        exercise_id: exercise.exercise_id || exercise.id,
        exercise_name: exercise.name,
        weight_value: numLoad,
        reps: finalReps,
        is_pr: false, // Don't auto-update PR from series completion
        date: new Date().toISOString().split('T')[0]
      };

      await dataService.saveLoadRecord(record);

      // Sincroniza localmente para que "Carga Anterior" atualize na hora
      setLastLoads(prev => ({
        ...prev,
        [exercise.name]: { ...record, id: 'temp-' + Date.now(), created_at: new Date().toISOString() } as any
      }));

      toast.success('Série registrada!', {
        description: `${numLoad}kg registrada.`
      });
    } catch (error: any) {
      console.error('Erro ao salvar carga:', error);
      
      if (error.message?.includes('Refresh Token') || error.message?.includes('not found')) {
        onLogout();
        return;
      }

      toast.error('Erro ao salvar carga', {
        description: 'Verifique sua conexão e tente novamente.'
      });
    }
  };

  const handleSaveManualPR = async (exercise: any, value: string) => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        toast.error('Valor inválido');
        return;
      }

      const currentStudent = await getCurrentStudent();

      if (!currentStudent) {
        toast.error("Aluno não encontrado no banco de dados.");
        return;
      }

      if (currentStudent.status !== "ativo") {
        toast.error("Seu acesso ainda está aguardando aprovação do professor.");
        return;
      }

      console.log(`[LOAD HISTORY] insert student_id`);
      
      const currentUserId = currentStudent.id;

      await dataService.saveExercisePR(currentUserId, exercise.exercise_id || exercise.id, numValue, exercise.name);
      
      // Sincronização: Garante que após o salvamento, a função de busca seja chamada novamente
      const freshPRs = await dataService.getStudentPRs(currentUserId);
      const updatedPrMap: Record<string, number> = {};
      freshPRs.forEach((pr: any) => {
        updatedPrMap[pr.exercise_id] = pr.one_rm;
      });
      setExercisePRs(prev => ({ ...prev, ...updatedPrMap }));

      toast.success('Recorde Pessoal (PR) atualizado!');
    } catch (error: any) {
      console.error('Erro ao salvar PR:', error);
      toast.error('Erro ao atualizar PR');
    }
  };

  const toggleExerciseCompletion = (exerciseId: string, index: number) => {
    setCompletedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        console.log('[EXERCISE CHECK COLOR] exercício concluído, aplicando verde');
        next.add(exerciseId);
        // Suave scroll para o próximo após um breve delay
        setTimeout(() => {
          const nextIdx = index + 1;
          if (nextIdx < exercises.length) {
            const nextElement = document.getElementById(`exercise-${exercises[nextIdx].id}`);
            if (nextElement) {
              nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 300);
      }
      return next;
    });
  };

  const handlePainSubmit = async () => {
    if (!showPainModal) return;
    
    try {
      const currentStudent = await getCurrentStudent();
      if (!currentStudent) throw new Error("Aluno não encontrado");
      const currentUserId = currentStudent.id;

      if (isFinishing) {
        // Se estiver finalizando, o completeWorkout já salva o feedback junto com o resumo do treino
        await completeWorkout();
      } else {
        await dataService.saveFeedback({
          student_id: currentUserId,
          pain_level: painData.level,
          pain_location: painData.locations.join(', ') || 'Nenhum local selecionado',
          exercise_name: showPainModal.name,
          pse: painData.pse,
          notes: painData.notes
        });

        toast.success('Relato enviado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao salvar relato:', error);
      
      if (error.message?.includes('Refresh Token') || error.message?.includes('not found')) {
        onLogout();
        return;
      }

      toast.error('Erro ao registrar relato', {
        description: 'Não foi possível salvar sua mensagem no momento.'
      });
      
      // Se estiver finalizando, tentamos completar o treino de qualquer forma para não travar
      if (isFinishing) {
        await completeWorkout();
      }
    }

    setPainData({ level: 0, locations: [], notes: '', pse: 5 });
    setShowPainModal(null);
    setIsFinishing(false);
  };

  const handleExitExperience = () => {
    setIsTrainingStarted(false);
    setWorkoutTimer(0);
    setCompletedExercises(new Set());
    setTotalVolume(0);
    setShowSummary(false);
    localStorage.removeItem('nexo_rest_timer');
    localStorage.removeItem('nexo_workout_started_at');
    onExit();
  };

  const handleGetAiSuggestion = async () => {
    if (!student?.lesao) return;
    
    setIsAiLoading(true);
    try {
      const suggestion = await suggestWorkoutAdjustment(
        student.lesao,
        workouts[activeWorkoutIndex]?.workout_type || "Geral",
        exercises
      );
      setAiSuggestion(suggestion || "Sem sugestões no momento.");
    } catch (err) {
      toast.error("Erro ao gerar sugestão de IA");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory && student?.id) {
      dataService.getStudentCheckinHistory(student.id).then(setCheckinHistory);
    }
  }, [showHistory, student?.id]);

  const historyStats = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthsFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Dates for the comparison summary (History View Date vs Previous Month)
    const viewMonth = historyViewDate.getMonth();
    const viewYear = historyViewDate.getFullYear();
    
    const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
    const lastMonth = prevMonthDate.getMonth();
    const lastMonthYear = prevMonthDate.getFullYear();

    let currentMonthCount = 0;
    let lastMonthCount = 0;

    // Last 6 months for the chart (Fixed or trailing from viewDate? Usually trailing feels better for history exploration)
    const last6Months: { name: string, label: string, month: number, year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - i, 1);
      last6Months.push({
        name: months[d.getMonth()],
        label: `${months[d.getMonth()]}\n${d.getFullYear()}`,
        month: d.getMonth(),
        year: d.getFullYear()
      });
    }

    const chartData = last6Months.map(m => ({ 
      name: m.name, 
      label: m.label,
      year: m.year,
      count: 0 
    }));

    checkinHistory.forEach(record => {
      const date = new Date(record.date);
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
  }, [checkinHistory, historyViewDate]);

  const handlePrevMonth = () => {
    setHistoryViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setHistoryViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const generateWorkoutSummaryLocal = (workoutExercises: any[], phase: string) => {
    if (!workoutExercises || workoutExercises.length === 0) return "Resumo técnico indisponível para este treino.";

    const foundMusclesSet = new Set<string>();
    workoutExercises.forEach(ex => {
      const name = ex.name.toLowerCase();
      if (name.includes("supino") || name.includes("crucifixo") || name.includes("crossover") || name.includes("peck deck") || name.includes("voador") || name.includes("peitoral")) foundMusclesSet.add("peitorais");
      if (name.includes("puxada") || name.includes("remada") || name.includes("barra fixa") || name.includes("pulldown") || name.includes("serrote") || name.includes("costas") || name.includes("dorsal")) foundMusclesSet.add("costas");
      if (name.includes("rosca") || name.includes("biceps") || name.includes("bíceps")) foundMusclesSet.add("bíceps");
      if (name.includes("tríceps") || name.includes("triceps") || name.includes("pulley") || name.includes("testa") || name.includes("francês") || name.includes("frances") || name.includes("coice")) foundMusclesSet.add("tríceps");
      if (name.includes("ombro") || name.includes("deltoide") || name.includes("desenvolvimento") || name.includes("elevação lateral") || name.includes("elevacao lateral") || name.includes("elevação frontal") || name.includes("elevacao frontal") || name.includes("manguito") || name.includes("remada alta")) foundMusclesSet.add("ombros");
      if (name.includes("agachamento") || name.includes("leg press") || name.includes("extensora") || name.includes("hack") || name.includes("sissy") || name.includes("quadriceps") || name.includes("quadríceps")) foundMusclesSet.add("quadríceps");
      if (name.includes("flexora") || name.includes("stiff") || name.includes("terra romeno") || name.includes("posterior") || name.includes("isquiotibiais") || name.includes("biceps femoral") || name.includes("bíceps femoral") || name.includes("leg curl") || name.includes("hamstring") || name.includes("elevação pélvica") || name.includes("elevacao pelvica") || name.includes("abdutora") || name.includes("glúteo") || name.includes("gluteo")) foundMusclesSet.add("posteriores e glúteos");
      if (name.includes("panturrilha") || name.includes("gêmeos") || name.includes("gemeos") || name.includes("sóleo") || name.includes("soleo") || name.includes("gastrocnemio") || name.includes("gastrocnêmio")) foundMusclesSet.add("panturrilhas");
      if (name.includes("abdominal") || name.includes("prancha") || name.includes("canivete") || name.includes("infra") || name.includes("supra") || name.includes("core") || name.includes("abs")) foundMusclesSet.add("abdômen e core");
      if (name.includes("esteira") || name.includes("bicicleta") || name.includes("bike") || name.includes("elíptico") || name.includes("eliptico") || name.includes("escada") || name.includes("corrida")) foundMusclesSet.add("cardio");
      if (name.includes("mobilidade") || name.includes("alongamento") || name.includes("aquecimento")) foundMusclesSet.add("mobilidade e alongamento");
    });

    const muscleArray = Array.from(foundMusclesSet);
    if (muscleArray.length === 0) return "Resumo técnico indisponível para este treino.";

    let gruposTxt = "";
    if (muscleArray.length === 1) {
      gruposTxt = muscleArray[0];
    } else {
      const last = muscleArray.pop();
      gruposTxt = muscleArray.join(", ") + " e " + last;
    }

    let faseFormatada = (phase || "Performance").toLowerCase().replace(/_/g, " ");
    if (faseFormatada === "forca maxima") faseFormatada = "força máxima";
    if (faseFormatada === "adaptacao") faseFormatada = "adaptação";
    if (faseFormatada === "resistencia") faseFormatada = "resistência";

    if (faseFormatada.includes('força')) {
      return `Hoje o alvo está em ${gruposTxt}. Neste ciclo de ${faseFormatada}, o foco é superar suas cargas máximas. Priorize intervalos mais longos e garanta estabilidade na execução pesada.`;
    }
    if (faseFormatada.includes('hipertrofia')) {
      return `O treino de hoje foca em ${gruposTxt}. Para otimizar sua ${faseFormatada}, valorize o tempo sob tensão, controle a descida do peso e busque a máxima exaustão muscular.`;
    }
    if (faseFormatada.includes('performance') || faseFormatada.includes('potência')) {
      return `Sessão direcionada para ${gruposTxt}. Como o seu ciclo é de ${faseFormatada}, o segredo aqui é a intenção de velocidade. Aplique o máximo de potência na fase concêntrica.`;
    }
    if (faseFormatada.includes('adaptação') || faseFormatada.includes('resistência')) {
      return `Hoje trabalharemos ${gruposTxt}. Durante esta ${faseFormatada}, o volume é seu aliado. Foque totalmente na postura e na cadência antes de pensar em aumentar a carga.`;
    }

    return `O foco do treino de hoje será em ${gruposTxt}. Ajuste a sua intensidade para a etapa de ${faseFormatada}, mantendo sempre a conexão mente-músculo ativa.`;
  };

  const currentPhaseName = useMemo(() => {
    const perData = prescription?.periodization;
    const currentMesoId = perData?.currentMesoId;
    const currentMeso = perData?.mesocycles?.find(m => m.id === currentMesoId) || perData?.mesocycles?.[0];
    return (currentMeso?.type || 'adaptação');
  }, [prescription]);

  const renderHistorySection = () => {
    if (!showHistory) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed inset-0 z-[160] bg-background flex flex-col p-6 lg:p-10 space-y-8 lg:space-y-10 overflow-y-auto"
      >
        <div className="flex items-center justify-between lg:max-w-5xl lg:mx-auto lg:w-full">
          <button 
            onClick={() => setShowHistory(false)}
            className={cn(
              "p-2 rounded-xl transition-all border",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white/40" : "bg-gray-100 border-gray-200 text-gray-500"
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black uppercase tracking-tight">Histórico de Treinos</h2>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {checkinHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 space-y-4">
            <History size={48} />
            <p className="text-sm font-bold uppercase tracking-widest">Você ainda não possui treinos registrados</p>
          </div>
        ) : (
          <div className="space-y-8 lg:space-y-6 pb-12 lg:max-w-5xl lg:mx-auto lg:w-full">
            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className={cn(
                "p-4 sm:p-5 rounded-[24px] sm:rounded-3xl border space-y-0.5 sm:space-y-1",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200 shadow-sm"
              )}>
                <p className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">{historyStats.currentMonthName}</p>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <p className="text-2xl sm:text-3xl font-black leading-none">{historyStats.currentMonth}</p>
                  <p className="text-sm sm:text-3xl font-black leading-none">Treinos</p>
                </div>
                <p className={cn(
                  "text-[10px] sm:text-[10px] font-black uppercase",
                  historyStats.diff >= 0 ? "text-emerald-500" : "text-red-500"
                )}>{historyStats.diffText} este mês</p>
              </div>
              <div className={cn(
                "p-4 sm:p-5 rounded-[24px] sm:rounded-3xl border space-y-0.5 sm:space-y-1",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200 shadow-sm"
              )}>
                <p className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">{historyStats.lastMonthName}</p>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <p className="text-2xl sm:text-3xl font-black leading-none">{historyStats.lastMonth}</p>
                  <p className="text-sm sm:text-3xl font-black leading-none">Treinos</p>
                </div>
                <p className="text-[10px] sm:text-[10px] font-black uppercase text-white/20">Mês anterior</p>
              </div>
            </div>

            {/* Gráfico e Calendário Lado a Lado no Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
              {/* Gráfico */}
              <div className={cn(
                "p-5 lg:p-8 rounded-[32px] border space-y-5 lg:space-y-8 lg:h-full flex flex-col overflow-hidden",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2">
                  <BarChart size={16} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Frequência Mensal</span>
                </div>
                <div className="h-[200px] lg:h-[260px] w-full lg:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={historyStats.chartData} margin={{ top: 5, right: 5, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        interval={0}
                        height={40}
                        tick={(props) => {
                          const { x, y, payload } = props;
                          const dataPoint = historyStats.chartData.find(d => d.name === payload.value);
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={14} textAnchor="middle" fill={theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)'} fontSize={10} fontWeight={900}>{payload.value}</text>
                              <text x={0} y={12} dy={14} textAnchor="middle" fill={theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'} fontSize={8} fontWeight={700}>{dataPoint?.year}</text>
                            </g>
                          );
                        }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false}
                        width={35}
                        tick={{ fontSize: 9, fontWeight: 900, fill: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }}
                        label={{ 
                          value: 'TREINOS', 
                          angle: -90, 
                          position: 'insideLeft', 
                          offset: -5, 
                          style: { 
                            fontSize: 18, 
                            fontWeight: 900, 
                            fill: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)', 
                            fontFamily: 'inherit',
                            textAnchor: 'middle'
                          } 
                        }}
                      />
                      <RechartsTooltip cursor={{fill: 'transparent'}} content={() => null} />
                      <Bar 
                        dataKey="count" 
                        fill="#f59e0b" 
                        radius={[4, 4, 0, 0]} 
                        barSize={20}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calendário */}
              <div className={cn(
                "p-6 lg:p-7 rounded-[32px] border space-y-6 lg:space-y-5",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200 shadow-sm"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Calendário</span>
                  </div>
                  <div className="flex items-center gap-4 lg:gap-3">
                     <button 
                       onClick={handlePrevMonth}
                       className={cn("p-1.5 rounded-lg active:scale-90 transition-all", theme === 'dark' ? "bg-white/5 hover:bg-white/10" : "bg-white border border-gray-200")}
                     >
                       <ChevronLeft size={14} />
                     </button>
                     <span className={cn(
                       "text-[10px] font-black uppercase tracking-widest min-w-[90px] text-center",
                       theme === 'dark' ? "text-white" : "text-gray-900"
                     )}>
                       {historyViewDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                     </span>
                     <button 
                       onClick={handleNextMonth}
                       className={cn("p-1.5 rounded-lg active:scale-90 transition-all", theme === 'dark' ? "bg-white/5 hover:bg-white/10" : "bg-white border border-gray-200")}
                     >
                       <ChevronRight size={14} />
                     </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2 lg:gap-1.5">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-white/20 mb-2 lg:mb-1">{d}</div>
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

                    const trainedDays = checkinHistory
                      .filter(record => {
                        const date = new Date(record.date);
                        return date.getMonth() === historyViewDate.getMonth() && date.getFullYear() === historyViewDate.getFullYear();
                      })
                      .map(record => new Date(record.date).getDate());

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
                              ? "bg-amber-500/20 border-amber-500 text-amber-500" 
                              : theme === 'dark' ? "bg-white/5 border-white/5 text-white/20" : "bg-gray-100 border-gray-200 text-gray-300",
                            isToday && !hasTrained && "border-amber-500/50",
                            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-black scale-110 z-10"
                          )}
                        >
                          {i}
                          {hasTrained && (
                            <div className="absolute -top-0.5 -right-0.5 w-1 lg:w-1 lg:h-1 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          )}
                        </button>
                      );
                    }
                    return days;
                  })()}
                </div>
              </div>
            </div>

            {/* Lista de Atividades Realizadas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <History size={16} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Atividade Realizada</span>
              </div>
              <div className="space-y-3">
                {filteredDailyHistory.length > 0 ? (
                  filteredDailyHistory.map((record, idx) => (
                    <div 
                      key={record.id || idx}
                      className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between gap-4",
                        theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          record.type === 'external' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {record.type === 'external' ? <Zap size={18} /> : <Dumbbell size={18} />}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black uppercase tracking-tight">
                            {record.type === 'external' 
                              ? record.modality 
                              : `TREINO ${record.workout_type || (record.label?.includes('Treino ') ? record.label.split('Treino ')[1] : record.label) || 'PRESCRITO'}`}
                          </p>
                          <p className="text-[10px] font-bold text-white/40">
                            {new Date(record.date).toLocaleDateString('pt-BR')}
                            {record.type === 'internal' && record.duration !== undefined && ` • ${dataService.formatTime(record.duration)}`}
                            {record.type === 'external' && ` • ${record.metric_value} ${record.metric_type || ''}`}
                          </p>
                          {record.type === 'external' && record.notes && (
                            <p className="text-[9px] font-medium text-amber-500/60 mt-1 italic">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <History size={32} className="mx-auto text-white/10" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      Nenhuma atividade registrada para este dia.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const handleSaveExternalWorkout = async () => {
    // 1. Validar:
    const isOtherModality = externalWorkoutData.modality === 'Outros' || externalWorkoutData.modality === 'Outro';
    
    if (!student) {
      toast.error("Erro interno: aluno não identificado.");
      return;
    }

    if (!externalWorkoutData.modality) {
      toast.error("Por favor, selecione a modalidade.");
      return;
    }

    if (externalWorkoutData.value <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }

    if (externalWorkoutData.intensity === '') {
      toast.error("Por favor, selecione a intensidade.");
      return;
    }

    if (isOtherModality && !externalWorkoutData.notes?.trim()) {
      toast.error("Por favor, descreva a atividade.");
      return;
    }

    setIsSavingExternal(true);

    try {
      // 2. Buscar aluno autenticado usando a mesma lógica do treino normal
      const currentStudent = await getCurrentStudent();
      if (!currentStudent) throw new Error("Aluno não encontrado");
      
      const studentIdToUse = currentStudent.id;
      console.log("student_id usado no treino externo:", studentIdToUse);

      const modalityUnits: Record<string, string> = {
        'Corrida ao ar livre': 'km',
        'Esteira': 'km',
        'Caminhada': 'km',
        'Bike': 'km',
        'Ciclismo': 'km',
        'Natação': 'm',
        'Beach Tênis': 'min',
        'Tênis': 'min',
        'Futebol': 'km',
        'Vôlei': 'min',
        'Lutas': 'min',
        'Musculação': 'min',
        'Crossfit': 'min',
        'Funcional': 'min',
        'Boxe': 'min',
        'Dança': 'min',
        'Outros': 'min'
      };

      const unit = modalityUnits[externalWorkoutData.modality] || 'min';
      const duration = unit === 'min' ? Number(externalWorkoutData.value) * 60 : 0;
      
      // Mapeamento de intensidade para PSE
      const pseMap: Record<string, number> = {
        'Leve': 3,
        'Moderada': 5,
        'Alta': 8
      };
      const pseValue = pseMap[externalWorkoutData.intensity] || 5;

      const payload = {
        student_id: studentIdToUse,
        workout_type: 'external',
        duration_seconds: gpsTrackingState !== 'idle' ? gpsData.elapsedTime : duration,
        pain_level: 0,
        pain_locations: [],
        pain_location: "EMPTY",
        total_volume: 0,
        pse: pseValue,
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        external_type: externalWorkoutData.modality,
        external_metric_type: unit,
        external_metric_value: gpsTrackingState !== 'idle' ? Number(gpsData.distance.toFixed(2)) : externalWorkoutData.value,
        external_intensity: externalWorkoutData.intensity,
        external_description: externalWorkoutData.notes || null,
        // Novos campos GPS rastreado
        external_gps_enabled: gpsData.points.length > 0,
        external_distance_km: Number(gpsData.distance.toFixed(2)),
        external_duration_seconds: gpsData.elapsedTime,
        external_pace_min_km: gpsData.pace,
        external_avg_speed_kmh: Number(gpsData.speed.toFixed(2)),
        external_route_points: gpsData.points,
        external_latitude: gpsData.points.length > 0 ? gpsData.points[0].lat : null,
        external_longitude: gpsData.points.length > 0 ? gpsData.points[0].lng : null
      };

      console.log("[TREINO EXTERNO] payload:", payload);

      const savedData = await dataService.saveExternalWorkout(payload);
      
      console.log("[TREINO EXTERNO] salvo:", savedData);
      toast.success('Treino externo registrado com sucesso.');
      
      // Limpar GPS se estava ativo
      if (gpsWatchId.current) navigator.geolocation.clearWatch(gpsWatchId.current);
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
      setGpsTrackingState('idle');
      setGpsData({
        distance: 0,
        startTime: 0,
        elapsedTime: 0,
        pace: '0:00',
        speed: 0,
        points: []
      });

      // Limpar formulário e fechar modal
      setShowExternalRecord(false);
      setExternalWorkoutData({
        modality: 'Corrida ao ar livre',
        value: 0,
        intensity: 'Moderada',
        notes: ''
      });

      // Atualizar histórico
      if (student?.id) {
        dataService.getStudentCheckinHistory(student.id).then(setCheckinHistory);
      }
    } catch (error: any) {
      console.error("[TREINO EXTERNO] erro Supabase:", error);
      toast.error(error.message || 'Erro ao salvar registro externo.');
    } finally {
      setIsSavingExternal(false);
    }
  };

  const renderExternalRecordModal = () => {
    if (!showExternalRecord) return null;

    const modalities = [
      'Corrida ao ar livre', 'Esteira', 'Caminhada', 'Bike', 'Ciclismo', 'Natação', 'Musculação', 'Crossfit', 'Funcional', 'Boxe', 'Dança', 'Vôlei', 'Futebol', 'Beach Tênis', 'Lutas', 'Outros'
    ];

    const modalityUnits: Record<string, string> = {
      'Corrida ao ar livre': 'KM',
      'Esteira': 'KM',
      'Caminhada': 'KM',
      'Bike': 'KM',
      'Ciclismo': 'KM',
      'Natação': 'METROS',
      'Musculação': 'MINUTOS',
      'Crossfit': 'MINUTOS',
      'Funcional': 'MINUTOS',
      'Boxe': 'MINUTOS',
      'Dança': 'MINUTOS',
      'Vôlei': 'MINUTOS',
      'Futebol': 'KM',
      'Beach Tênis': 'MINUTOS',
      'Lutas': 'MINUTOS',
      'Outros': 'MINUTOS'
    };

    const isOtherModality = externalWorkoutData.modality === 'Outros' || externalWorkoutData.modality === 'Outro';
    const isGpsModality = ['Corrida ao ar livre', 'Caminhada', 'Ciclismo', 'Bike'].includes(externalWorkoutData.modality);

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            if (gpsTrackingState === 'idle') setShowExternalRecord(false);
          }}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "relative w-full max-w-sm rounded-[32px] border p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]",
            theme === 'dark' ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight">Treino Externo</h3>
            <button 
              onClick={() => {
                if (gpsTrackingState !== 'idle') {
                  if (confirm("Deseja interromper o rastreamento GPS?")) {
                    stopGpsTracking();
                    setShowExternalRecord(false);
                  }
                } else {
                  setShowExternalRecord(false);
                }
              }}
              className="p-2 rounded-xl text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Modalidade</label>
              <select 
                value={externalWorkoutData.modality}
                onChange={(e) => {
                  if (gpsTrackingState !== 'idle') {
                    toast.error("Pare o GPS antes de mudar a modalidade.");
                    return;
                  }
                  setExternalWorkoutData({ ...externalWorkoutData, modality: e.target.value });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/50"
              >
                {modalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {isGpsModality && (
              <div className="bg-white/5 border border-amber-500/20 rounded-[24px] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Rastreamento GPS</span>
                  </div>
                  {gpsTrackingState !== 'idle' && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-red-500">Gravando</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Distância</p>
                    <p className="text-xl font-black">{gpsData.distance.toFixed(2)} <span className="text-xs text-white/40 font-bold">km</span></p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Tempo</p>
                    <p className="text-xl font-black">{dataService.formatTime(gpsData.elapsedTime)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Ritmo Médio</p>
                    <p className="text-xl font-black">{gpsData.pace} <span className="text-xs text-white/40 font-bold">min/km</span></p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Velocidade</p>
                    <p className="text-xl font-black">{gpsData.speed.toFixed(1)} <span className="text-xs text-white/40 font-bold">km/h</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {gpsTrackingState === 'idle' ? (
                    <button
                      onClick={startGpsTracking}
                      className="col-span-2 py-3 bg-amber-500 rounded-2xl text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Play size={16} fill="currentColor" />
                      Iniciar GPS
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={pauseGpsTracking}
                        className="py-3 bg-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        {gpsTrackingState === 'paused' ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                        {gpsTrackingState === 'paused' ? 'Retomar' : 'Pausar'}
                      </button>
                      <button
                        onClick={stopGpsTracking}
                        className="py-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Square size={16} fill="currentColor" />
                        Finalizar
                      </button>
                    </>
                  )}
                </div>
                
                <p className="text-[9px] text-center text-white/20 px-4 leading-relaxed italic">
                  Para rastrear com precisão, mantenha o app aberto durante a atividade.
                </p>
              </div>
            )}

            {isOtherModality && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Descreva a atividade</label>
                <input 
                  type="text"
                  value={externalWorkoutData.notes}
                  onChange={(e) => setExternalWorkoutData({ ...externalWorkoutData, notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/50"
                  placeholder="Ex: tênis, beach tennis, trilha..."
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {modalityUnits[externalWorkoutData.modality] || 'VALOR'}
              </label>
              <input 
                type="number"
                value={externalWorkoutData.value}
                onChange={(e) => setExternalWorkoutData({ ...externalWorkoutData, value: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/50"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Intensidade</label>
              <div className="grid grid-cols-3 gap-2">
                {['Leve', 'Moderada', 'Alta'].map((int) => (
                  <button
                    key={int}
                    onClick={() => setExternalWorkoutData({ ...externalWorkoutData, intensity: int })}
                    className={cn(
                      "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      externalWorkoutData.intensity === int
                        ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20"
                        : "bg-white/5 border-white/10 text-white/40"
                    )}
                  >
                    {int}
                  </button>
                ))}
              </div>
            </div>

            {!isOtherModality && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Observações (Opcional)</label>
                <textarea 
                  value={externalWorkoutData.notes}
                  onChange={(e) => setExternalWorkoutData({ ...externalWorkoutData, notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:border-amber-500/50 min-h-[80px]"
                  placeholder="Como foi o treino?"
                />
              </div>
            )}
          </div>

          <button 
            onClick={handleSaveExternalWorkout}
            disabled={isSavingExternal}
            className="w-full bg-amber-500 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSavingExternal ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            REGISTRAR TREINO
          </button>
        </motion.div>
      </div>
    );
  };
  const renderLoadEvolutionModal = () => {
    if (!showEvolution) return null;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowEvolution(false)}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "relative w-full max-w-2xl rounded-[32px] border flex flex-col max-h-[90vh] overflow-hidden",
            theme === 'dark' ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200 shadow-2xl"
          )}
        >
          <div className={cn(
            "p-6 flex items-center justify-between border-b",
            theme === 'dark' ? "border-white/5" : "border-gray-100"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <BarChart size={20} />
              </div>
              <h2 className={cn(
                "text-lg font-black italic uppercase tracking-tight",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>Evolução de Carga</h2>
            </div>
            <button 
              onClick={() => setShowEvolution(false)}
              className={cn(
                "p-2 rounded-xl transition-all",
                theme === 'dark' ? "bg-white/5 text-white/40 hover:text-white" : "bg-gray-100 text-gray-500"
              )}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {student && (
              <LoadEvolutionChart 
                studentId={student.id} 
                workouts={workouts} 
                theme={theme}
              />
            )}
          </div>
          
          <div className="pb-4 text-center">
             <p className={cn(
               "text-[10px] font-black uppercase tracking-[0.3em] opacity-10",
               theme === 'dark' ? "text-white" : "text-black"
             )}>Nexo Performance Pro</p>
          </div>
        </motion.div>
      </div>
    );
  };
  const renderEvaluationTab = () => {
    if (!latestEvaluation) {
      return (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="text-white/20" size={32} />
          </div>
          <p className="text-sm text-white/40 font-manrope">Nenhuma avaliação disponível ainda.</p>
        </div>
      );
    }

    const { weight, height, bmi, body_fat, lean_mass, fat_mass, evaluation_date, posture_data } = latestEvaluation;

    return (
      <div className="px-6 space-y-6 pb-24">
        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "p-4 rounded-2xl border",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
          )}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Última Avaliação</p>
            <p className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-gray-900")}>
              {new Date(evaluation_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl border",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
          )}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">IMC</p>
            <p className={cn("text-lg font-black", theme === 'dark' ? "text-[#C5A07D]" : "text-amber-600")}>
              {bmi?.toFixed(1) || '--'}
            </p>
          </div>
        </div>

        {/* Composição Corporal */}
        <div className={cn(
          "p-6 rounded-3xl border space-y-6",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[#C5A07D]/20 rounded-lg flex items-center justify-center">
              <BarChart className="text-[#C5A07D]" size={16} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest">Composição Corporal</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Peso Total</p>
              <p className="text-2xl font-black text-[#C5A07D]">{weight}kg</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Gordura Corporal</p>
              <p className="text-2xl font-black text-red-400">{body_fat}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Massa Magra</p>
              <p className="text-2xl font-black text-green-400">{lean_mass}kg</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Massa Gorda</p>
              <p className="text-2xl font-black text-red-400/60">{fat_mass}kg</p>
            </div>
          </div>
        </div>

        {/* Avaliação Postural (se existir) */}
        {posture_data && (
          <div className={cn(
            "p-6 rounded-3xl border space-y-4",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Info className="text-amber-500" size={16} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Análise Postural</h3>
            </div>
            
            <div className="space-y-3">
              {posture_data.diagnosis && (
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-xs text-white/60 leading-relaxed italic">
                    "{posture_data.diagnosis}"
                  </p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {[
                  ...posture_data.anterior.deviations,
                  ...posture_data.posterior.deviations,
                  ...posture_data.lateralDir.deviations,
                  ...posture_data.lateralEsq.deviations
                ].filter((v, i, a) => a.indexOf(v) === i && v).map((dev, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-white/60 uppercase tracking-widest">
                    {dev}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPeriodizationTab = () => {
    // Periodization data is inside prescription
    const perData = prescription?.periodization;
    
    if (!perData || !perData.mesocycles || perData.mesocycles.length === 0) {
      return (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-white/20" size={32} />
          </div>
          <p className="text-sm text-white/40 font-manrope">Periodização ainda não definida pelo professor.</p>
        </div>
      );
    }

    const currentMesoId = perData.currentMesoId;
    const currentMeso = perData.mesocycles.find(m => m.id === currentMesoId) || perData.mesocycles[0];
    const currentWeek = perData.currentMicroIndex + 1; // 1-indexed for display
    const totalWeeks = currentMeso.durationWeeks;
    const progress = Math.min((currentWeek / totalWeeks) * 100, 100);

    const getMesoLabel = (type: string) => {
      const labels: Record<string, string> = {
        recuperacao: 'Recuperação',
        adaptacao: 'Adaptação',
        hipertrofia: 'Hipertrofia',
        forca_maxima: 'Força Máxima',
        potencia: 'Potência',
        choque: 'Choque',
        manutencao: 'Manutenção',
        especifico: 'Específico'
      };
      return labels[type] || 'Fase Geral';
    };

    const getWeekLabel = (week: number) => {
      if (week === 1) return "Início do ciclo";
      if (week === 2) return "Em evolução";
      if (week === 3) return "Progresso sólido";
      if (week >= 4) return "Finalizando ciclo";
      return "Ciclo em andamento";
    };

    const currentWeekLabel = getWeekLabel(currentWeek);

    const phrases = [
      "Você está no caminho certo.",
      "Consistência gera resultado.",
      "Disciplina hoje, evolução amanhã."
    ];
    const punchyPhrase = phrases[new Date().getDate() % phrases.length];

    return (
      <div className="px-6 space-y-4 pb-24 overflow-x-hidden w-full max-w-full">
        {/* Fase Atual Card */}
        <div className={cn(
          "p-4 rounded-[32px] border-2 relative overflow-hidden transition-all duration-500 bg-surface-container shadow-2xl",
          PHASE_THEME[currentMeso.type].border,
          PHASE_THEME[currentMeso.type].glow
        )}>
          {/* Subtle top gradient overlay */}
          <div className={cn(
            "absolute inset-x-0 top-0 h-20 opacity-[0.05] pointer-events-none",
            PHASE_THEME[currentMeso.type].bg
          )} style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }} />
          
          {/* Top Intensity Line */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1.5",
            PHASE_THEME[currentMeso.type].bg
          )} />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-col space-y-4">
              <div>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-[0.3em] mb-1",
                  theme === 'dark' ? "text-white/40" : "text-black"
                )}>Você está na fase de</p>
                <h1 className={cn(
                  "text-[22px] font-bold uppercase tracking-tight leading-none drop-shadow-sm",
                  theme === 'dark' ? "text-white" : "text-black"
                )} style={{ 
                  textShadow: PHASE_THEME[currentMeso.type].bg.includes('EAB308') ? '0 0 20px rgba(234, 179, 8, 0.3)' : 'none' 
                }}>
                  {getMesoLabel(currentMeso.type)}
                </h1>
              </div>

              <div className="flex items-center justify-between w-full bg-black/20 p-2 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 px-2">
                  <Calendar size={14} className="text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Duração</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-black/40 border border-white/10 rounded-lg h-[22px] px-2 flex items-center justify-center text-[11px] font-black text-amber-500 min-w-[28px]">
                    {totalWeeks}
                  </div>
                  <span className="text-[10px] font-bold text-white/20 uppercase pr-2">Semanas</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Progresso da Fase</p>
                  <p className="text-[12px] font-bold text-amber-500/80 uppercase">{currentWeekLabel}</p>
                </div>
                <p className="text-xs font-black text-white/60">Semana {currentWeek} de {totalWeeks}</p>
              </div>
              
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    PHASE_THEME[currentMeso.type].bg,
                    "shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  )}
                />
              </div>

              {/* Micro Gamefeel */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", PHASE_THEME[currentMeso.type].bg)} />
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-tight">
                  🔥 Ciclo em alta performance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 p-2.5 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1">
                  🎯 FOCO ATUAL
                </p>
                <p className="text-[13px] font-black uppercase tracking-tight truncate">{currentMeso.name || 'Definido'}</p>
              </div>
              <div className="flex flex-col gap-1 p-2.5 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1">
                  📊 CONSISTÊNCIA
                </p>
                <p className="text-[13px] font-black uppercase tracking-tight">Em evolução</p>
              </div>
            </div>
          </div>
        </div>

        {/* Frase Final (Impacto) */}
        <div className="py-2 text-center">
          <p className="text-[13px] font-medium text-white/40 italic">
            "{punchyPhrase}"
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-t-2 border-[#C5A07D] rounded-full"
        />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A07D]">Sincronizando Laboratório...</p>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-black z-[100] p-6 flex flex-col items-center justify-center text-center space-y-8 overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-[#C5A07D]/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 size={48} className="text-[#C5A07D]" />
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Missão Cumprida</h2>
          <p className="text-on-surface-variant uppercase tracking-widest text-xs">Treino finalizado com sucesso!</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-2 shadow-2xl">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Volume Total Movimentado</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black text-[#C5A07D] tabular-nums">{(totalVolume / 1000).toFixed(2)}</span>
              <span className="text-xl font-black text-white/40 uppercase">Toneladas</span>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Tempo de Treino</p>
              <p className="text-xl font-black text-amber-500">{formatTime(workoutTimer)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <Clock className="text-amber-500" size={24} />
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60 max-w-xs italic">
          "O resultado é a soma de pequenos esforços repetidos dia após dia."
        </p>

        <button 
          onClick={handleExitExperience}
          className="w-full max-w-sm py-6 bg-[#C5A07D] text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#C5A07D]/20 active:scale-95 transition-all"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-[#C5A07D]/30 pb-48 transition-colors duration-300",
      theme === 'dark' ? "dark bg-background text-on-background" : "light bg-background text-on-background"
    )}>
      <AnimatePresence>
        {showHistory && renderHistorySection()}
      </AnimatePresence>
      {/* Container Header - Identification & Logout - Agora Fluido (Sem sticky/fixed) */}
      <div className={cn(
        "px-6 py-4 flex items-center justify-between transition-colors",
        theme === 'dark' ? "bg-black/40 border-b border-white/5" : "bg-white border-b border-gray-100"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center transition-colors",
            theme === 'dark' ? "border-amber-500/30 bg-white/5" : "border-amber-500/30 bg-gray-100"
          )}>
            <User size={20} className="text-amber-500/40" />
          </div>
          <div>
            <h2 className={cn(
              "text-sm font-black tracking-tight",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              {student?.name.split(' ')[0] || 'Atleta'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className={cn(
              "p-2.5 rounded-xl transition-all active:scale-95",
              theme === 'dark' 
                ? "bg-white/5 text-white/40 hover:text-white" 
                : "bg-gray-100 text-gray-400 hover:text-gray-900"
            )}
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Menu Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "p-2.5 rounded-xl transition-all active:scale-95",
                theme === 'dark' 
                  ? "bg-white/5 text-white/40 hover:text-white" 
                  : "bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
            >
              <MoreVertical size={16} />
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[140]"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={cn(
                      "absolute right-0 mt-2 w-52 rounded-2xl border shadow-2xl z-[150] overflow-hidden",
                      theme === 'dark' ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
                    )}
                  >
                    <button 
                      onClick={() => {
                        setShowHistory(true);
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3.5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                        theme === 'dark' ? "hover:bg-white/5 text-white/70" : "hover:bg-gray-50 text-gray-600"
                      )}
                    >
                      <History size={14} className="text-amber-500" />
                      Histórico
                    </button>

                    <button 
                      onClick={() => {
                        setShowExternalRecord(true);
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3.5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t",
                        theme === 'dark' ? "hover:bg-white/5 text-white/70 border-white/10" : "hover:bg-gray-50 text-gray-600 border-gray-100"
                      )}
                    >
                      <Zap size={14} className="text-amber-500" />
                      Treino Externo
                    </button>

                    <button 
                      onClick={handleOpenEvolution}
                      className={cn(
                        "w-full px-4 py-3.5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t",
                        theme === 'dark' ? "hover:bg-white/5 text-white/70 border-white/10" : "hover:bg-gray-50 text-gray-600 border-gray-100"
                      )}
                    >
                      <BarChart size={14} className="text-amber-500" />
                      Evolução de Carga
                    </button>

                    <button 
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3.5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t",
                        theme === 'dark' ? "hover:bg-red-500/10 text-red-400 border-white/10" : "hover:bg-red-50 text-red-600 border-gray-100"
                      )}
                    >
                      <LogOut size={14} />
                      Sair
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Tabs Menu */}
      <div className="px-6 mb-8">
        <div className={cn(
          "flex p-1 gap-1 rounded-2xl border",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
        )}>
          <button 
            onClick={() => setActiveTab('treino')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'treino'
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : theme === 'dark' ? "text-white/40 hover:text-white" : "text-black hover:text-black"
            )}
          >
            <Zap size={14} fill={activeTab === 'treino' ? "currentColor" : "none"} className={cn(activeTab !== 'treino' && theme === 'light' && "text-black")} />
            Treino
          </button>
          <button 
            onClick={() => setActiveTab('avaliacao')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'avaliacao'
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : theme === 'dark' ? "text-white/40 hover:text-white" : "text-black hover:text-black"
            )}
          >
            <BarChart size={14} className={cn(activeTab !== 'avaliacao' && theme === 'light' && "text-black")} />
            Avaliação
          </button>
          <button 
            onClick={() => setActiveTab('periodizacao')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'periodizacao'
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : theme === 'dark' ? "text-white/40 hover:text-white" : "text-black hover:text-black"
            )}
          >
            <Calendar size={14} className={cn(activeTab !== 'periodizacao' && theme === 'light' && "text-black")} />
            Período
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'treino' && (
          <motion.div
            key="treino"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header */}
            <header className="px-8 flex flex-col items-center text-center space-y-6 relative">
        <img 
          src="https://i.postimg.cc/qR3KCW6p/nexo-logo.png" 
          alt="NEXO Logo" 
          className={cn(
            "h-16 object-contain",
            theme === 'dark' ? "brightness-0 invert" : "brightness-100"
          )}
          referrerPolicy="no-referrer"
        />

        {/* Weekday Bar */}
        <div className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
            const isToday = new Date().getDay() === idx;
            return (
              <div 
                key={idx}
                className={cn(
                  "flex-1 h-7 flex items-center justify-center rounded-lg text-[10px] font-black transition-all",
                  isToday 
                    ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                    : theme === 'dark' ? "bg-white/5 text-white/20" : "bg-gray-100 text-gray-400"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Workout Navigation Row */}
        <nav className="flex items-center justify-center p-1 bg-black/50 backdrop-blur-md rounded-2xl border border-white/5 w-full max-w-sm mx-auto">
          <div className="grid grid-cols-4 gap-2 w-full">
            {workouts.length > 0 ? workouts.map((w, index) => {
              const letter = w.workout_type?.replace(/Treino\s+/i, '').charAt(0).toUpperCase() || String.fromCharCode(65 + index);
              const isActive = activeWorkoutIndex === index;
              
              return (
                <button
                  key={w.id || index}
                  onClick={() => setActiveWorkoutIndex(index)}
                  className={cn(
                    "h-10 flex items-center justify-center rounded-xl border text-[10px] font-black transition-all",
                    isActive 
                      ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                      : "bg-black border-[#C5A07D]/20 text-[#C5A07D] hover:border-[#C5A07D]"
                  )}
                >
                  TREINO {letter}
                </button>
              );
            }) : (
              <div className="col-span-4 h-10 flex items-center justify-center text-[10px] font-black text-white/20 uppercase tracking-widest pl-4">
                Nenhum treino prescrito
              </div>
            )}
          </div>
        </nav>
        
        <div className="space-y-0.5">
          <h1 className={cn(
            "text-base font-black uppercase tracking-tight",
            theme === 'dark' ? "text-[#F5F5F0]" : "text-gray-900"
          )}>
            Bora pro treino, {student?.name.split(' ')[0]}?
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", isTrainingStarted ? "bg-amber-500 animate-pulse" : "bg-[#C5A07D]")}></span>
            <p className="text-base font-black uppercase tracking-tight text-[#C5A07D]">
              {isTrainingStarted ? "• Treino Ativo" : `Foco: ${student?.goal || 'Performance'}`}
            </p>
          </div>
        </div>
      </header>

      {/* AI Suggestion based on Injury - Rule 15 */}
      {renderExternalRecordModal()}
      {renderLoadEvolutionModal()}
      {student?.lesao && (
        <div className="px-6 mb-4">
          <div className={cn(
            "p-5 rounded-[24px] border relative overflow-hidden",
            theme === 'dark' ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"
          )}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="text-amber-500" size={16} />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                  Ajuste Inteligente (Beta)
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[8px]">IA</span>
                </p>
                <p className="text-xs font-bold leading-relaxed">
                  Identificamos uma observação: <span className="text-amber-600">"{student.lesao}"</span>. Deseja ver ajustes sugeridos no treino?
                </p>
                
                {!aiSuggestion ? (
                  <button 
                    onClick={handleGetAiSuggestion}
                    disabled={isAiLoading}
                    className="mt-3 px-4 py-2 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <Zap size={12} fill="currentColor" />
                    )}
                    {isAiLoading ? 'Analisando...' : 'Ver Ajustes de Segurança'}
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-black/20 rounded-2xl border border-white/5 space-y-3"
                  >
                    <div className="text-[11px] text-white/70 leading-relaxed space-y-2 whitespace-pre-wrap">
                      {aiSuggestion}
                    </div>
                    <button 
                      onClick={() => setAiSuggestion(null)}
                      className="text-[9px] font-black uppercase tracking-widest text-[#C5A07D] underline"
                    >
                      Recolher sugestão
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isTrainingStarted ? (
        <section className="px-6 py-4 flex flex-col space-y-8">
          {activeWorkout?.workout_data?.blocks && Array.isArray(activeWorkout.workout_data.blocks) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
              {activeWorkout.workout_data.blocks.map((block: any, bIdx: number) => {
                const blockExercises = block.exercises || [];
                const modalityKey = block.modality?.toLowerCase() || 'default';
                const themeConfig = MODALITY_THEMES[modalityKey] || MODALITY_THEMES.default;
                const Icon = themeConfig.icon;

                return (
                  <motion.div 
                    key={block.id || bIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: bIdx * 0.1 }}
                    className={cn(
                      "p-6 sm:p-8 rounded-[32px] border space-y-6 flex flex-col h-full",
                      theme === 'dark' ? "bg-black/40" : "bg-white border-gray-100 shadow-xl",
                      themeConfig.border
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl flex items-center justify-center",
                        themeConfig.bg
                      )}>
                        <Icon style={{ color: themeConfig.color }} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className={cn(
                          "text-xl font-black uppercase tracking-tight truncate",
                          theme === 'dark' ? "text-white" : "text-black"
                        )}>{block.modality || 'Atividade'}</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: themeConfig.color }}>
                          {blockExercises.length} {blockExercises.length === 1 ? 'Exercício' : 'Exercícios'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 py-2 border-y border-black/5 dark:border-white/5 border-gray-100 overflow-y-auto max-h-[160px] no-scrollbar">
                      {blockExercises.map((ex: any, idx: number) => (
                        <div key={ex.id || idx} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: themeConfig.color }} />
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-tight truncate",
                            theme === 'dark' ? "text-white/70" : "text-gray-600"
                          )}>
                            {ex.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => handleStartWorkout(block.id)}
                      className="w-full py-4 text-black font-black uppercase tracking-[0.2em] text-[12px] rounded-[20px] shadow-lg transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                      style={{ backgroundColor: themeConfig.color, boxShadow: `0 10px 30px ${themeConfig.color}40` }}
                    >
                      <Play size={14} fill="currentColor" />
                      INICIAR {block.modality ? block.modality.toUpperCase() : 'TREINO'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : exercises.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "w-full max-w-md mx-auto p-8 rounded-[32px] border space-y-8",
                theme === 'dark' ? "bg-black/40 border-white/10" : "bg-white border-gray-100 shadow-xl"
              )}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-amber-500/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <ClipboardList className="text-amber-500" size={32} />
                </div>
                <div className="space-y-1">
                  <h2 className={cn(
                    "text-2xl font-black uppercase tracking-tight",
                    theme === 'dark' ? "text-white" : "text-black"
                  )}>{workoutName}</h2>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">
                    {exercises.length} Exercícios
                  </p>
                </div>
              </div>

              {/* Intelligent Summary Section */}
              <div className="space-y-2 text-center px-1">
                <div className="flex items-center justify-center gap-2 mb-1 opacity-40">
                  <Sparkles size={10} className="text-amber-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Resumo Técnico</span>
                </div>
                <p className={cn(
                  "text-justify text-center text-[14px] md:text-[15px] leading-relaxed mx-auto max-w-md",
                  theme === 'dark' ? "text-white/50" : "text-gray-500"
                )}>
                  {generateWorkoutSummaryLocal(exercises, currentPhaseName)}
                </p>
              </div>

              <div className="space-y-3 py-2 border-y border-white/5 dark:border-white/5 border-gray-100">
                {exercises.map((ex: any, idx: number) => (
                  <div 
                    key={ex.id || idx}
                    className="flex items-center gap-3 px-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className={cn(
                      "text-sm font-bold uppercase tracking-tight",
                      theme === 'dark' ? "text-white/80" : "text-gray-700"
                    )}>
                      {ex.name}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleStartWorkout()}
                className="w-full py-6 bg-amber-500 text-black font-black uppercase tracking-[0.3em] text-[15px] rounded-[24px] shadow-[0_20px_50px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Play size={18} fill="currentColor" />
                INICIAR TREINO
              </button>
            </motion.div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-6 bg-white/5 rounded-full">
                <ClipboardList size={40} className="text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Sem Treino</h3>
                <p className="text-sm text-white/30 max-w-xs mx-auto">Você não possui treino prescrito hoje.</p>
              </div>
            </div>
          )}
          
          <div className="text-center opacity-20">
            <p className={cn(
              "text-[8px] font-black uppercase tracking-[0.5em]",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>NEXO BIOMECHANICS — ESTADO DA ARTE</p>
          </div>
        </section>
      ) : (
        <main className="px-6 space-y-8">
          {exercises.length > 0 ? (
            <>
            <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className={cn(
                "text-3xl font-black uppercase tracking-tighter",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {workoutName}
              </h2>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.3em]",
                theme === 'dark' ? "text-white/20" : "text-gray-400"
              )}>
                {exercises.length} Exercícios Planejados
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {exercises.map((ex: any, idx: number) => {
              const isCompleted = completedExercises.has(ex.id);
              const lastLoadRecord = lastLoads[ex.exercise_id] || lastLoads[ex.id] || lastLoads[ex.name];
              const currentPR = exercisePRs[ex.exercise_id] || exercisePRs[ex.id] || exercisePRs[ex.name];
              
              return (
                <motion.div 
                  key={ex.id}
                  id={`exercise-${ex.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-4 sm:p-8 rounded-[28px] sm:rounded-[40px] border transition-all relative overflow-hidden",
                    isCompleted 
                      ? theme === 'dark' ? "bg-[#0A0A0A]/60 border-emerald-500/30 opacity-60" : "bg-gray-50 border-emerald-500/20 opacity-60"
                      : ex.type === 'cardio'
                        ? "bg-[#1E1E1E] border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                        : theme === 'dark' ? "bg-[#0A0A0A] border-white/10" : "bg-white border-gray-100 shadow-sm"
                  )}
                >
                  <div className="absolute top-5 right-6 z-10 flex gap-4">
                    {ex.type !== 'cardio' && (
                      <button
                        onClick={() => toggleExerciseCompletion(ex.id, idx)}
                        className={cn(
                          "p-2 sm:p-3 rounded-full transition-all",
                          isCompleted 
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                            : theme === 'dark' ? "bg-white/5 text-white/20 hover:bg-white/10 border border-white/5" : "bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-200"
                        )}
                      >
                        <CheckCircle2 size={isCompleted ? 20 : 18} className={cn(isCompleted && "animate-pulse")} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col gap-1 pr-12">
                      <h3 className={cn(
                        "text-xl sm:text-2xl font-black uppercase tracking-tight",
                        isCompleted ? "text-emerald-500" : ex.type === 'cardio' ? "text-cyan-400" : theme === 'dark' ? "text-[#F5F5F0]" : "text-gray-900"
                      )}>
                        {ex.name}
                      </h3>
                      
                      {ex.type === 'cardio' ? (
                        /* CARDIO INFO */
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Intensidade:</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                              ex.intensity === 'alta' ? "bg-red-500/20 text-red-400" :
                              ex.intensity === 'moderada' ? "bg-cyan-500/20 text-cyan-400" :
                              "bg-green-500/20 text-green-400"
                            )}>
                              {ex.intensity || 'moderada'}
                            </span>
                          </div>
                          {ex.objective && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Objetivo:</span>
                              <span className="text-xs sm:text-sm font-black text-cyan-500 uppercase">{ex.objective}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* RESISTIDO INFO */
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]",
                              theme === 'dark' ? "text-white/20" : "text-gray-400"
                            )}>Carga Anterior:</span>
                            <span className="text-xs sm:text-sm font-black text-[#C5A07D] tabular-nums">
                              {lastLoadRecord ? `${lastLoadRecord.weight_value}kg` : '--'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]",
                              theme === 'dark' ? "text-white/20" : "text-gray-400"
                            )}>PR:</span>
                            <span className="text-xs sm:text-sm font-black text-amber-500 tabular-nums">
                              {currentPR ? `${currentPR}kg` : '--'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Observação Técnica do Professor */}
                      {(ex.technical_notes || ex.notes) && (
                        <div className={cn(
                          "mt-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-dashed flex items-start gap-2",
                          theme === 'dark' ? "bg-primary/5 border-primary/20 text-primary/80" : "bg-primary/5 border-primary/30 text-primary"
                        )}>
                          <Info size={14} className="shrink-0 mt-0.5 opacity-60" />
                          <div className="space-y-0.5">
                            <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Técnica</span>
                            <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed italic block">
                              {ex.technical_notes || ex.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {ex.type === 'cardio' ? (
                      /* CARDIO UI */
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Prescrição</span>
                            <p className="text-2xl font-black italic text-white flex items-baseline gap-2">
                              {ex.duration || '20'}
                              <span className="text-xs font-black uppercase tracking-widest text-[#06B6D4]">minutos</span>
                            </p>
                          </div>
                          
                          {activeCardioTimer?.exerciseId === ex.id && (
                            <div className="text-right">
                              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-cyan-500 block mb-1">Tempo Restante</span>
                              <div className={cn(
                                "text-2xl font-black tabular-nums tracking-tighter",
                                activeCardioTimer.remaining < 60 ? "text-red-500 animate-pulse" : "text-white"
                              )}>
                                {formatCardioTime(activeCardioTimer.remaining)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3">
                          {!activeCardioTimer || activeCardioTimer.exerciseId !== ex.id ? (
                            <button 
                              onClick={() => startCardio(ex)}
                              disabled={isCompleted}
                              className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-[0.3em] text-[13px] rounded-2xl shadow-[0_15px_40px_rgba(6,182,212,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                              <Play size={16} fill="currentColor" />
                              INICIAR CARDIO
                            </button>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={togglePauseCardio}
                                className={cn(
                                  "py-4 rounded-xl flex items-center justify-center gap-2 border transition-all font-black text-[11px] uppercase tracking-widest",
                                  activeCardioTimer.isPaused 
                                    ? "bg-green-500 text-black border-green-500 shadow-lg shadow-green-500/20" 
                                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                                )}
                              >
                                {activeCardioTimer.isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                                {activeCardioTimer.isPaused ? 'RECURAR' : 'PAUSAR'}
                              </button>
                              <button 
                                onClick={() => finishCardio(ex.id)}
                                className="py-4 bg-cyan-500 text-black rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-cyan-500/20"
                              >
                                <CheckCircle2 size={16} />
                                CONCLUIR
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* RESISTIDO UI */
                      <>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="space-y-0.5">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-[0.3em]",
                            theme === 'dark' ? "text-white/20" : "text-gray-400"
                          )}>Prescrição</span>
                          <div className="flex items-center gap-3">
                            <p className={cn(
                              "text-base sm:text-lg font-black italic",
                              theme === 'dark' ? "text-white" : "text-gray-900"
                            )}>{ex.sets}x {ex.reps}</p>
                            
                            {/* Visual Set Dots - NEXO PRO */}
                            {ex.sets && parseInt(ex.sets.toString()) > 0 && (
                              <div className="flex items-center gap-1.5 ml-1">
                                {Array.from({ length: Math.min(parseInt(ex.sets.toString()), 10) }).map((_, i) => {
                                  const isCompleted = i < (exerciseSetsProgress[ex.id] || 0);
                                  return (
                                    <motion.div
                                      key={i}
                                      initial={false}
                                      animate={{ 
                                        backgroundColor: isCompleted ? "#22C55E" : (theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)"),
                                        scale: i === (exerciseSetsProgress[ex.id] || 0) - 1 ? [1, 1.2, 1] : 1,
                                      }}
                                      className={cn(
                                        "w-2 h-2 rounded-full border transition-colors duration-300",
                                        isCompleted 
                                          ? "border-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
                                          : theme === 'dark' ? "border-white/10" : "border-black/10"
                                      )}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PR Table Section */}
                      <div className={cn(
                        "rounded-2xl border transition-all overflow-hidden",
                        theme === 'dark' ? "bg-black/40 border-white/5" : "bg-gray-50 border-gray-200"
                      )}>
                      <button 
                        onClick={() => setExpandedPR(expandedPR === ex.id ? null : ex.id)}
                        className="w-full p-2.5 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <Zap size={12} className="text-amber-500" />
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            theme === 'dark' ? "text-white/60" : "text-gray-600"
                          )}>Tabela de Cargas (PR)</span>
                        </div>
                        <ChevronDown 
                          size={14} 
                          className={cn(
                            "text-white/20 transition-transform",
                            expandedPR === ex.id && "rotate-180"
                          )} 
                        />
                      </button>

                        <AnimatePresence>
                          {expandedPR === ex.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-3 pb-3 space-y-3"
                            >
                              <div className="flex items-center gap-4 pt-1">
                                <div className="flex-1 space-y-1">
                                  <label className="text-[7px] font-black uppercase tracking-widest text-white/20">Novo 1RM (kg)</label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="number" 
                                      defaultValue={currentPR || 0}
                                      id={`pr-input-${ex.id}`}
                                      className="bg-white/5 border-none outline-none text-sm font-black w-full rounded-lg px-3 py-1.5"
                                    />
                                    <button 
                                      onClick={() => {
                                        const input = document.getElementById(`pr-input-${ex.id}`) as HTMLInputElement;
                                        handleSaveManualPR(ex, input.value);
                                      }}
                                      className="px-3 bg-[#C5A07D] text-black rounded-lg font-black text-[8px] uppercase tracking-widest"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5">
                                {(() => {
                                  if (!currentPR || currentPR <= 0) {
                                    return (
                                      <div className="col-span-3 py-4 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#C5A07D] animate-pulse">
                                          Defina seu PR para ver as porcentagens
                                        </p>
                                      </div>
                                    );
                                  }

                                  return [50, 60, 70, 80, 90, 100].map(pct => {
                                    const calculated = (currentPR * (pct / 100)).toFixed(1);
                                    
                                    let colorClass = "text-amber-500";
                                    if (pct >= 90) colorClass = "text-red-500";
                                    else if (pct >= 70) colorClass = "text-amber-500";

                                    return (
                                      <div key={pct} className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                                        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-0.5">{pct}%</p>
                                        <p className={cn("text-xs font-black", colorClass)}>{calculated}kg</p>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-4">
                        <div className={cn(
                          "flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl sm:rounded-2xl border",
                          theme === 'dark' ? "bg-black/40 border-white/5" : "bg-gray-50 border-gray-200"
                        )}>
                          <div className="flex-1 w-full space-y-0.5">
                            <label className={cn(
                              "text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] pl-1",
                              theme === 'dark' ? "text-white/30" : "text-gray-500"
                            )}>Peso da Série (kg)</label>
                            <input 
                              type="number" 
                              placeholder={lastLoads[ex.name]?.weight_value?.toString() || "0"}
                              className={cn(
                                "bg-transparent border-none outline-none text-lg sm:text-xl font-black w-full placeholder:text-white/10",
                                theme === 'dark' ? "text-white" : "text-gray-900"
                              )}
                              id={`load-${ex.id}`}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button className={cn(
                              "py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 border transition-all font-black text-[8px] sm:text-[9px] uppercase tracking-widest",
                              theme === 'dark' 
                                ? "bg-white/5 hover:bg-white/10 text-white border-white/10" 
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                            )}>
                              <Play size={12} className="sm:size-[14px]" fill={theme === 'dark' ? "white" : "black"} />
                              Execução
                            </button>
                            <button 
                              onClick={() => {
                                incrementSetProgress(ex.id);
                                startRestTimer(ex.rest || '60s', ex.id);
                              }}
                              className={cn(
                                "py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 border transition-all font-black text-[8px] sm:text-[9px] uppercase tracking-widest",
                                theme === 'dark' 
                                  ? "bg-white/5 hover:bg-white/10 text-white border-white/10" 
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                              )}>
                              <Timer size={12} className="sm:size-[14px] text-amber-500" />
                              Descanso ({ex.rest || '60s'})
                            </button>
                          </div>
                          <button 
                            onClick={() => {
                              const loadInput = document.getElementById(`load-${ex.id}`) as HTMLInputElement;
                              handleCompleteSeries(ex, loadInput.value);
                            }}
                            className="w-full py-3.5 sm:py-4 bg-amber-500 text-black rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95"
                          >
                            Salvar Série
                          </button>
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {/* Finalizar Treino Button - Positioned after last exercise - Rule 2 */}
            <div className="pt-4 flex flex-col items-center gap-6">
              <div className={cn(
                "p-4 px-6 backdrop-blur-xl border rounded-[24px] shadow-xl flex items-center gap-4 transition-all hover:scale-105",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100 shadow-sm"
              )}>
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Clock size={18} className="text-amber-500 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Tempo de Treino</span>
                  <span className={cn(
                    "text-3xl font-black tabular-nums tracking-tighter",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {formatTime(workoutTimer)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleFinishWorkout}
                disabled={isFinishing || isFinished}
                className={cn(
                  "w-full max-w-md h-[56px] rounded-[18px] font-black uppercase tracking-[0.15em] text-[13px] transition-all duration-150 flex items-center justify-center gap-3 relative overflow-hidden group active:scale-[0.98] disabled:opacity-90 disabled:active:scale-100 mt-[20px] mb-[24px] mx-auto",
                  isFinished 
                    ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/40"
                    : isFinishing
                      ? "bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/20"
                      : "bg-gradient-to-br from-[#16A34A] to-[#22C55E] text-white shadow-xl shadow-green-600/30 hover:shadow-green-600/40"
                )}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {isFinished ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <CheckCircle2 size={24} className="text-white" />
                    </motion.div>
                    <span className="relative z-10">TREINO CONCLUÍDO</span>
                  </>
                ) : isFinishing ? (
                  <>
                    <Loader2 size={20} className="animate-spin text-white" />
                    <span className="relative z-10">FINALIZANDO...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="relative z-10">FINALIZAR TREINO</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-6 bg-white/5 rounded-full">
              <ClipboardList size={40} className="text-white/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">Nenhuma Prescrição</h3>
              <p className="text-sm text-white/30 max-w-xs mx-auto">Seu treinador ainda não liberou sua rotina para este dia ou divisão.</p>
            </div>
            <button 
              onClick={onExit}
              className="px-8 py-4 border border-[#C5A07D]/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A07D]/60 hover:text-[#C5A07D] transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </main>
    )}

      {/* Rest Timer Floating UI */}
      <AnimatePresence>
        {timer !== null && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-xs"
          >
            <div className="bg-[#0F0F0F] border-2 border-amber-500/50 rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 shadow-2xl shadow-amber-500/20 backdrop-blur-xl flex flex-col items-center space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2">
                <Timer size={14} className="text-amber-500 animate-pulse" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Tempo de Descanso</span>
              </div>
              <div className="text-3xl sm:text-5xl font-black tabular-nums text-white flex items-baseline gap-1">
                {timer}
                <span className="text-lg sm:text-xl text-white/20">s</span>
              </div>
              <button 
                onClick={() => setTimer(null)}
                className="w-full py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/40 transition-colors"
              >
                Parar Cronômetro
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </motion.div>
  )}

  {activeTab === 'avaliacao' && (
    <motion.div
      key="avaliacao"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {renderEvaluationTab()}
    </motion.div>
  )}

  {activeTab === 'periodizacao' && (
    <motion.div
      key="periodizacao"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {renderPeriodizationTab()}
    </motion.div>
  )}
</AnimatePresence>

      {/* Pain Feedback Modal */}
      <AnimatePresence>
        {showPainModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-md overflow-x-hidden">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-[#0F0F0F] rounded-t-[32px] sm:rounded-[32px] border-t-2 border-[#C5A07D]/30 p-4 sm:p-8 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Segurança NEXO</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-[#F5F5F0]">Sentiu Dor?</h3>
                </div>
                <button 
                  onClick={() => setShowPainModal(null)}
                  className="p-2 bg-white/5 rounded-xl text-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {/* PSE Section - Always show if finishing */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-[#C5A07D] px-1">
                    <span>Percepção de Esforço (PSE)</span>
                    <span className="text-[12px] font-black">{painData.pse} / 10</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={painData.pse}
                    onChange={(e) => setPainData({...painData, pse: parseInt(e.target.value)})}
                    className="w-full accent-[#C5A07D] h-1 bg-white/5 rounded-full outline-none appearance-none"
                    style={{ height: '4px' }}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest italic opacity-60">
                    <span>Muito Leve</span>
                    <span>Esforço Máximo</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-white/40 pl-1 block mb-2">Local do Desconforto (Opcional)</label>
                  <div className="grid grid-cols-2 gap-[6px]">
                    {['Joelho', 'Lombar', 'Ombro', 'Cotovelo', 'Punho', 'Quadril', 'Tornozelo', 'Pescoço'].map(loc => (
                      <button 
                        key={loc}
                        onClick={() => {
                          const isSelected = painData.locations.includes(loc);
                          if (isSelected) {
                            setPainData({...painData, locations: painData.locations.filter(l => l !== loc)});
                          } else {
                            setPainData({...painData, locations: [...painData.locations, loc]});
                          }
                        }}
                        className={cn(
                          "h-[36px] flex items-center justify-center px-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all border",
                          painData.locations.includes(loc)
                            ? "bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20" 
                            : "bg-white/5 text-white/40 border-white/5"
                        )}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-white/40 px-1">
                    <span>Intensidade da Dor</span>
                    <span className={cn(
                      "text-[12px] font-black",
                      painData.level > 0 ? "text-amber-500" : "text-white/20"
                    )}>{painData.level} / 10</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={painData.level}
                    onChange={(e) => setPainData({...painData, level: parseInt(e.target.value)})}
                    className="w-full accent-amber-500 h-1 bg-white/5 rounded-full outline-none appearance-none"
                    style={{ height: '4px' }}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest italic opacity-60">
                    <span>Sem Dor</span>
                    <span>Dor Insustentável</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-white/40 pl-1 block mb-2">Observações</label>
                  <textarea 
                    value={painData.notes}
                    onChange={(e) => setPainData({...painData, notes: e.target.value})}
                    placeholder="Descreva o tipo de dor (fisgada, queimação...)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[13px] text-white outline-none focus:border-amber-500/50 transition-all h-[80px] placeholder:text-[12px] placeholder:text-white/20"
                  />
                </div>

                <button 
                  onClick={handlePainSubmit}
                  className="w-full h-[44px] flex items-center justify-center bg-amber-500 text-black rounded-xl font-black uppercase tracking-[0.2em] text-[13px] shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Confirmar Relato
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentExperience;
