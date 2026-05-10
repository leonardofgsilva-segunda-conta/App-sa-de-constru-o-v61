import { supabase, isDemoMode } from '../lib/supabase';

export interface Student {
  id: string;
  professor_id: string;
  name: string;
  goal: string;
  freq: string;
  status: string;
  img: string;
  phone?: string;
  lesao?: string;
  observacoes?: string;
  birthDate?: string;
  email?: string;
  password?: string;
  invite_token?: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  professor_id: string;
  title: string;
  message: string;
  type: 'new_student' | 'workout_completed' | 'feedback' | 'alert';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export interface TrainerProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  img?: string;
  plan: 'free' | 'semestral' | 'anual';
  subscription_status: 'active' | 'inactive' | 'trial';
  student_limit: number | null;
  stripe_customer_id?: string;
  plan_expires_at?: string;
  sport_modality?: string;
  created_at?: string;
}

export interface Evaluation {
  id: string;
  student_id: string;
  weight: number;
  height: number;
  bmi: number;
  body_fat: number;
  fat_mass: number;
  lean_mass: number;
  folds: Record<string, number>;
  perimeters: Record<string, number | number[]>;
  posture_data?: {
    anterior: { photoUrl: string; deviations: string[] };
    posterior: { photoUrl: string; deviations: string[] };
    lateralDir: { photoUrl: string; deviations: string[] };
    lateralEsq: { photoUrl: string; deviations: string[] };
    diagnosis?: string;
  };
  cardio_data?: {
    resting_hr: number;
    resting_bp_systolic: number;
    resting_bp_diastolic: number;
    protocol: string;
    distance?: number;
    time?: string;
    final_hr?: number;
    step_hr?: number;
    vo2_max: number;
    classification: string;
  };
  evaluation_date: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  student_id: string;
  exercises: Record<string, any[]>;
  workout_data?: Record<string, any[]>;
  periodization?: PeriodizationData;
  logs: any[];
  division?: string;
  workout_name?: string;
  updated_at: string;
}

export interface WorkoutRow {
  id?: string;
  student_id: string;
  workout_type: string;
  workout_data: any;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface LoadRecord {
  id: string;
  student_id: string;
  exercise_id?: string;
  exercise_name: string;
  weight_value: number;
  reps: number;
  is_pr?: boolean;
  date?: string;
  created_at: string;
}

export interface PeriodizationData {
  currentMesoId: string | null;
  currentMicroIndex: number; // Index of current week within the mesocycle
  mesocycles: MesoCycle[];
}

export interface MesoCycle {
  id: string;
  name: string;
  type: 'recuperacao' | 'adaptacao' | 'hipertrofia' | 'forca_maxima' | 'potencia' | 'choque' | 'manutencao' | 'especifico';
  durationWeeks: number;
}

export interface Feedback {
  id: string;
  student_id: string;
  pain_level: number;
  pain_location: string;
  exercise_name?: string;
  comment: string;
  created_at: string;
}

export interface ExternalWorkout {
  id?: string;
  student_id: string;
  professor_id: string;
  modality: string;
  metric_type: string;
  metric_value: number;
  intensity: string;
  notes?: string;
  workout_date: string;
  created_at?: string;
}

export const dataService = {
  // ... existing methods ...
  async saveExternalWorkout(data: any) {
    const { data: saved, error } = await supabase
      .from('workout_history')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('[EXTERNAL TRAINING] erro ao salvar em workout_history:', error);
      throw error;
    }
    return saved;
  },

  async getExternalWorkouts(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('workout_history')
      .select('*')
      .eq('student_id', studentId)
      .eq('workout_type', 'external')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[EXTERNAL TRAINING] erro ao buscar treinos externos:', error);
      return [];
    }

    return (data || []).map(e => ({
      id: e.id,
      workout_date: e.completed_at,
      modality: e.external_type || 'Atividade',
      metric_value: e.external_metric_value,
      metric_type: e.external_metric_type,
      notes: e.external_description || '',
      intensity: e.external_intensity || ''
    }));
  },

  // Trainers/Profiles
  async ensureTrainerProfile(): Promise<TrainerProfile | null> {
    if (isDemoMode) {
      return {
        id: 'trainer-123',
        user_id: 'demo-user',
        email: 'trainer@demo.com',
        full_name: 'Treinador Demo',
        plan: 'anual',
        subscription_status: 'active',
        student_limit: null,
        created_at: new Date().toISOString()
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    console.log('[TRAINER SCOPE] user.id', user.id);

    // 1. Buscar perfil para verificar role e nome
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('user_id', user.id)
      .maybeSingle();

    // 1.1 Verificação extra na tabela students
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .ilike('email', user.email || '')
      .maybeSingle();

    console.log('[TRAINER ENTRY BLOCK] role encontrada no ensureTrainerProfile:', profile?.role);
    console.log('[TRAINER ENTRY BLOCK] registro em students encontrado:', !!studentRecord);

    if (profile?.role === 'student' || studentRecord) {
      console.log('[TRAINER ENTRY BLOCK] ensureTrainerProfile bloqueado para student');
      return null;
    }

    // 2. Chamar RPC para garantir o perfil de trainer
    const { data: trainer, error: rpcError } = await supabase.rpc('ensure_trainer_profile', {
      p_user_id: user.id,
      p_email: user.email,
      p_full_name: profile?.full_name || user.user_metadata?.full_name || user.email
    });

    if (rpcError) {
      console.error('Error in ensure_trainer_profile RPC:', rpcError);
      return null;
    }

    if (trainer) {
      // Se a RPC retornar um array, pega o primeiro elemento
      const profileData = Array.isArray(trainer) ? trainer[0] : trainer;
      console.log('[TRAINER SCOPE] currentTrainer.id', profileData?.id);
      return profileData;
    }

    return null;
  },

  async getTrainerSubscription(): Promise<TrainerProfile | null> {
    return this.ensureTrainerProfile();
  },

  async canAddStudent(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return { allowed: false, message: 'Perfil não encontrado.' };

    if (subscription.plan === 'free') {
      const { data: students, error: countError } = await supabase
        .from('students')
        .select('status', { count: 'exact' })
        .eq('professor_id', subscription.id)
        .or('status.ilike.pendente,status.ilike.ativo');

      const totalCount = students?.length || 0;

      if (!countError && totalCount >= (subscription.student_limit || 1)) {
        return { 
          allowed: false, 
          message: 'Seu plano gratuito permite apenas 1 aluno. Faça upgrade para cadastrar mais alunos.' 
        };
      }
    }

    return { allowed: true };
  },

  async updateSubscriptionAfterPayment(plan: 'semestral' | 'anual') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthsToAdd = plan === 'semestral' ? 6 : 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + monthsToAdd);

    await supabase
      .from('trainers')
      .update({
        plan,
        subscription_status: 'active',
        student_limit: 100,
        plan_expires_at: expiresAt.toISOString()
      })
      .eq('user_id', user.id);
  },

  // Students
  async getStudents(statusFilter?: string | string[], excludeStatus?: string): Promise<Student[]> {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return [];

    let query = supabase
      .from('students')
      .select('*')
      .eq('professor_id', subscription.id);
    
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        query = query.in('status', statusFilter);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    if (excludeStatus) {
      query = query.neq('status', excludeStatus);
    }

    console.log('[TRAINER SCOPE] query students professor_id', subscription.id);
    const { data, error } = await query.order('name');
    console.log('[TRAINER SCOPE] alunos retornados', data?.length || 0);

    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }

    return data.map(s => ({
      id: s.id,
      professor_id: s.professor_id,
      name: s.name,
      goal: s.goal,
      freq: s.frequency,
      status: s.status,
      img: "",
      phone: s.phone,
      lesao: s.lesao,
      observacoes: s.observacoes,
      birthDate: s.birth_date,
      email: s.email,
      password: s.password,
      invite_token: s.invite_token
    }));
  },

  async getStudentById(id: string): Promise<Student | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const subscription = await this.getTrainerSubscription();
    if (!subscription) return null;

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('professor_id', subscription.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      professor_id: data.professor_id,
      name: data.name,
      goal: data.goal,
      freq: data.frequency,
      status: data.status,
      img: "",
      phone: data.phone,
      lesao: data.lesao,
      observacoes: data.observacoes,
      birthDate: data.birth_date,
      email: data.email,
      password: data.password,
      invite_token: data.invite_token
    };
  },

  async getStudentByInviteToken(token: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('invite_token', token)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      professor_id: data.professor_id,
      name: data.name,
      goal: data.goal,
      freq: data.frequency,
      status: data.status,
      img: "",
      phone: data.phone,
      lesao: data.lesao,
      observacoes: data.observacoes,
      birthDate: data.birth_date,
      email: data.email,
      invite_token: data.invite_token
    };
  },

  async addStudent(student: Omit<Student, 'id' | 'professor_id' | 'invite_token'>) {
    const check = await this.canAddStudent();
    if (!check.allowed) {
      throw new Error(check.message);
    }

    const subscription = await this.getTrainerSubscription();
    if (!subscription) throw new Error('Professor não autenticado.');

    const invite_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from('students')
      .insert([{
        professor_id: subscription.id,
        name: student.name,
        goal: student.goal,
        frequency: student.freq,
        status: student.status,
        phone: student.phone,
        lesao: student.lesao,
        observacoes: student.observacoes,
        birth_date: student.birthDate,
        email: student.email,
        invite_token
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async updateStudent(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update({
        name: updates.name,
        goal: updates.goal,
        frequency: updates.freq,
        status: updates.status,
        phone: updates.phone,
        lesao: updates.lesao,
        observacoes: updates.observacoes,
        birth_date: updates.birthDate,
        email: updates.email
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteStudent(id: string) {
    // Para evitar erros de chave estrangeira, primeiro deletamos da tabela workouts
    const { error: workoutError } = await supabase
      .from('workouts')
      .delete()
      .eq('student_id', id);

    if (workoutError) throw workoutError;

    // Em seguida, deletamos o aluno
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Evaluations
  async addEvaluation(evaluation: Omit<Evaluation, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('evaluations')
      .upsert([evaluation], { 
        onConflict: 'student_id, evaluation_date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error in addEvaluation:', error);
      throw error;
    }
    return data[0];
  },

  async getLatestEvaluation(studentId: string): Promise<Evaluation | null> {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest evaluation:', error);
      return null;
    }

    return data;
  },

  async getEvaluationByDate(studentId: string, date: string): Promise<Evaluation | null> {
    // Assuming date is YYYY-MM-DD
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching evaluation by date:', error);
      return null;
    }

    return data;
  },

  async getEvaluationsHistory(studentId: string): Promise<Evaluation[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching evaluation history:', error);
      return [];
    }

    return data;
  },

  // Prescriptions
  async savePrescription(
    studentId: string, 
    exercises: Record<string, any[]>, 
    logs: any[], 
    division: string, 
    workoutName: string,
    periodization?: PeriodizationData
  ) {
    // 1. Fetch current prescription to preserve other divisions (A, B, C...)
    const { data: currentRecord } = await supabase
      .from('prescriptions')
      .select('workout_data')
      .eq('student_id', studentId)
      .maybeSingle();

    const existingWorkouts = currentRecord?.workout_data || {};
    
    // 2. Perform incremental merge using the keys provided (spread operator logic)
    // This ensures that if we are saving 'A', the keys for 'B', 'C' etc are kept if they exist in DB
    const mergedWorkouts = { 
      ...existingWorkouts, 
      ...exercises 
    };

    const objetoParaSalvar = {
      student_id: studentId,
      workout_name: workoutName,
      workout_data: mergedWorkouts,
      logs: logs,
      division: division,
      periodization: periodization
    };

    const { data, error } = await supabase
      .from('prescriptions')
      .upsert(objetoParaSalvar, { 
        onConflict: 'student_id' 
      })
      .select()
      .single();

    if (error) throw error;
    
    // Ensure UI compatibility
    if (data && data.workout_data && !data.exercises) {
      data.exercises = data.workout_data;
    }
    
    return data;
  },

  async getPrescription(studentId: string): Promise<Prescription | null> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }

    if (data && data.workout_data && !data.exercises) {
      data.exercises = data.workout_data;
    }

    return data;
  },

  // Exercise Library
  async getExerciseLibrary() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching exercise library:', error);
      return [];
    }
    return data;
  },

  async addExerciseToLibrary(exercise: { name: string, muscle_id: string }) {
    const { data, error } = await supabase
      .from('exercises')
      .insert([exercise])
      .select();

    if (error) throw error;
    return data[0];
  },

  // New Workouts Table Logic (Granular Persistence)
  async getWorkouts(studentId: string): Promise<WorkoutRow[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('student_id', studentId)
      .order('workout_type', { ascending: true });

    if (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
    return data || [];
  },

  async saveWorkout(studentId: string, type: string, data: any, startDate?: string, endDate?: string) {
    const { data: saved, error } = await supabase
      .from('workouts')
      .upsert({
        student_id: studentId,
        workout_type: type,
        workout_data: data,
        start_date: startDate,
        end_date: endDate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,workout_type'
      })
      .select()
      .single();

    if (error) throw error;
    return saved;
  },

  async deleteWorkout(studentId: string, type: string) {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('student_id', studentId)
      .eq('workout_type', type);
    
    if (error) throw error;
  },

  // Load History
  async getExerciseLoadHistory(student_id: string, exercise_name: string, exercise_id?: string): Promise<LoadRecord[]> {
    let query = supabase
      .from('load_history')
      .select('*')
      .eq('student_id', student_id);
    
    // Filtro direto sem validações extras conforme solicitado
    if (exercise_id) {
      query = query.or(`exercise_id.eq.${exercise_id},exercise_name.eq.${exercise_name}`);
    } else {
      query = query.eq('exercise_name', exercise_name);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching load history:', error);
      return [];
    }
    return data;
  },

  async getStudentCheckinHistory(studentId: string) {
    const [checkinsRes, internalHistoryRes, externalHistoryRes] = await Promise.all([
      supabase
        .from('checkins')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false }),
      supabase
        .from('workout_history')
        .select('*')
        .eq('student_id', studentId)
        .neq('workout_type', 'external')
        .order('completed_at', { ascending: false }),
      supabase
        .from('workout_history')
        .select('*')
        .eq('student_id', studentId)
        .eq('workout_type', 'external')
        .order('completed_at', { ascending: false })
    ]);

    if (checkinsRes.error) console.error('Error fetching checkins:', checkinsRes.error);
    if (internalHistoryRes.error) console.error('Error fetching internal history:', internalHistoryRes.error);
    if (externalHistoryRes.error) console.error('Error fetching external history:', externalHistoryRes.error);

    const checkins = (checkinsRes.data || []).map(c => ({
      id: c.id,
      date: c.completed_at,
      type: 'internal',
      label: 'Treino Prescrito',
      duration: c.duration_seconds
    }));

    const internalHistory = (internalHistoryRes.data || []).map(h => ({
      id: h.id,
      date: h.completed_at,
      type: 'internal',
      label: `Treino ${h.workout_type}`,
      duration: h.duration_seconds
    }));

    const external = (externalHistoryRes.data || []).map(e => ({
      id: e.id,
      date: e.completed_at,
      type: 'external',
      modality: e.external_type || 'Atividade',
      metric_value: e.external_metric_value, 
      metric_type: e.external_metric_type,
      notes: e.external_description,
      intensity: e.external_intensity
    }));

    // Combine and sort by date descending
    const combined = [...checkins, ...internalHistory, ...external].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return combined;
  },

  formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  async getStudentFrequencyRanking() {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [checkinsRes, workoutsRes] = await Promise.all([
      supabase
        .from('checkins')
        .select('student_id, completed_at, students!inner(name, professor_id)')
        .eq('students.professor_id', subscription.id)
        .gte('completed_at', startOfMonth),
      supabase
        .from('workout_history')
        .select('student_id, completed_at, students!inner(name, professor_id)')
        .eq('students.professor_id', subscription.id)
        .gte('completed_at', startOfMonth)
    ]);

    if (checkinsRes.error) console.error('Error fetching ranking [checkins]:', checkinsRes.error);
    if (workoutsRes.error) console.error('Error fetching ranking [workouts]:', workoutsRes.error);

    const allRecords = [...(checkinsRes.data || []), ...(workoutsRes.data || [])];
    
    const rankingMap: Record<string, { student_id: string, name: string, count: number, last_activity: string }> = {};

    allRecords.forEach((record: any) => {
      const studentId = record.student_id;
      const studentName = record.students?.name || 'Aluno sem nome';
      const completedAt = record.completed_at;

      if (!rankingMap[studentId]) {
        rankingMap[studentId] = { student_id: studentId, name: studentName, count: 0, last_activity: completedAt };
      }

      rankingMap[studentId].count++;
      if (new Date(completedAt) > new Date(rankingMap[studentId].last_activity)) {
        rankingMap[studentId].last_activity = completedAt;
      }
    });

    return Object.values(rankingMap)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
      })
      .slice(0, 5);
  },

  async updateLoadRecord(id: string, updates: Partial<{ weight_value: number, reps: number }>) {
    const { data, error } = await supabase
      .from('load_history')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteLoadRecord(id: string) {
    const { error } = await supabase
      .from('load_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async saveFeedback(feedback: {
    student_id: string;
    pain_level: number;
    pain_location: string;
    exercise_name?: string;
    pse?: number;
    notes?: string;
  }) {
    // Tentamos salvar em workout_history como solicitado na última atualização de feedback/dor
    const { error } = await supabase
      .from('workout_history')
      .insert([{
        student_id: feedback.student_id,
        pain_level: feedback.pain_level,
        pain_location: feedback.pain_location,
        workout_type: feedback.exercise_name || 'Feedback Avulso',
        notes: feedback.notes,
        pse: feedback.pse,
        completed_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error saving feedback to workout_history:', error);
      // Fallback para feedback_treino se necessário, mas usando 'notes' em vez de 'comment'
      const { error: error2 } = await supabase.from('feedback_treino').insert([{
        student_id: feedback.student_id,
        pain_level: feedback.pain_level,
        pain_location: feedback.pain_location,
        exercise_name: feedback.exercise_name,
        pse: feedback.pse,
        notes: feedback.notes
      }]);
      if (error2) throw error2;
    }
  },

  async saveCheckin(data: {
    student_id: string;
    duration_seconds: number;
    completed_at: string;
  }) {
    const { error } = await supabase
      .from('checkins')
      .insert([data]);
    
    if (error) {
      console.error('Error saving check-in:', error);
      throw error;
    }
  },

  async saveWorkoutHistory(data: {
    student_id: string;
    workout_type: string;
    total_volume: number;
    pain_level?: number;
    pain_location?: string;
    notes?: string;
    pse?: number;
    duration_seconds: number;
    completed_at: string;
    status?: string;
  }) {
    // Check for duplicate (same student, same type != external, same day)
    if (data.workout_type !== 'external') {
      const today = new Date(data.completed_at).toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('workout_history')
        .select('id')
        .eq('student_id', data.student_id)
        .eq('workout_type', data.workout_type)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)
        .maybeSingle();

      if (existing) {
        console.log('[TREINO] Já existe registro para hoje, ignorando duplicata.');
        return;
      }
    }

    const { error } = await supabase
      .from('workout_history')
      .insert([data]);
    
    if (error) {
      console.error('Error saving workout history:', error);
      throw error;
    }
  },

  async getStudentTimeline(studentId: string) {
    const { data, error } = await supabase
      .from('load_history')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching timeline:', error);
      return [];
    }
    return data;
  },

  async getCurrentStudentId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    console.log(`[DEBUG STUDENT ID] auth user id: ${user.id}`);
    console.log(`[DEBUG STUDENT ID] auth email: ${user.email}`);

    const { data: currentStudent } = await supabase
      .from("students")
      .select("id, email")
      .eq("email", user.email)
      .maybeSingle();

    if (currentStudent) {
      console.log(`[DEBUG STUDENT ID] students.id usado: ${currentStudent.id}`);
      return currentStudent.id;
    }

    return null;
  },

  async getStudentLoadHistory(studentId: string): Promise<LoadRecord[]> {
    console.log(`[DEBUG LOAD QUERY] student_id usado na busca: ${studentId}`);
    console.log(`[SHARED LOAD HISTORY] studentId usado: ${studentId}`);
    const { data, error } = await supabase
      .from('load_history')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared load history:', error);
      return [];
    }
    console.log(`[SHARED LOAD HISTORY] rows encontradas: ${data?.length || 0}`);
    return data || [];
  },

  // PR / 1RM Logic - Sync between student and trainer
  async getExercisePR(studentId: string, exerciseId: string) {
    const { data, error } = await supabase
      .from('user_records')
      .select('*')
      .eq('student_id', studentId)
      .eq('exercise_id', exerciseId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching PR:', error);
    }
    return data;
  },

  async getStudentPRs(studentId: string) {
    console.log(`[DEBUG LOAD QUERY] student_id usado na busca (PRs): ${studentId}`);
    const { data, error } = await supabase
      .from('user_records')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching student PRs:', error);
      return [];
    }
    return data;
  },

  async saveExercisePR(studentId: string, exerciseId: string, value: number, exerciseName: string) {
    try {
      const { data, error } = await supabase
        .from('user_records')
        .upsert({
          student_id: studentId,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          one_rm: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,exercise_id'
        })
        .select()
        .single();

      if (error) {
        console.error('DATABASE REJECTED PR SAVE:', error);
        throw error;
      }

      // Also save to load_history as a PR record for history tracking
      await this.saveLoadRecord({
        student_id: studentId,
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        weight_value: value,
        reps: 1,
        is_pr: true,
        date: new Date().toISOString().split('T')[0]
      });

      return data;
    } catch (err) {
      console.error('CRITICAL ERROR IN saveExercisePR:', err);
      throw err;
    }
  },

  async saveLoadRecord(record: Omit<LoadRecord, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('load_history')
      .insert([{
        ...record,
        date: record.date || new Date().toISOString().split('T')[0]
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Dashboard specific
  async getDashboardStats() {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return { students: 0, evaluations: 0, prescriptions: 0, todayWorkouts: 0 };

    const today = new Date().toISOString().split('T')[0];

    // Subqueries in .in() are not supported as builders in the current client.
    // Fetching IDs first.
    const { data: trainerStudents } = await supabase
      .from('students')
      .select('id')
      .eq('professor_id', subscription.id);
    
    const studentIds = trainerStudents?.map(s => s.id) || [];

    if (studentIds.length === 0) {
      return { students: 0, evaluations: 0, prescriptions: 0, todayWorkouts: 0 };
    }
    
    const [studentsCount, evaluationsCount, prescriptionsCount, todayWorkoutsCount] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'ativo').eq('professor_id', subscription.id),
      supabase.from('evaluations').select('id', { count: 'exact', head: true }).in('student_id', studentIds),
      supabase.from('prescriptions').select('id', { count: 'exact', head: true }).in('student_id', studentIds),
      supabase.from('workouts')
        .select('id', { count: 'exact', head: true })
        .lte('start_date', today)
        .gte('end_date', today)
        .in('student_id', studentIds)
    ]);

    return {
      students: studentsCount.count || 0,
      evaluations: evaluationsCount.count || 0,
      prescriptions: prescriptionsCount.count || 0,
      todayWorkouts: todayWorkoutsCount.count || 0
    };
  },

  async getRecentStudents(limit = 4): Promise<Student[]> {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return [];

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('professor_id', subscription.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    
    return data.map(s => ({
      id: s.id,
      professor_id: s.professor_id,
      invite_token: s.invite_token,
      name: s.name,
      goal: s.goal,
      freq: s.frequency,
      status: s.status,
      img: "",
      phone: s.phone,
      lesao: s.lesao,
      observacoes: s.observacoes,
      birthDate: s.birth_date,
      email: s.email,
      password: s.password
    }));
  },

  async getUpcomingWorkouts(limit = 4) {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return [];

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('workouts')
      .select('*, students!inner(name, goal, professor_id)')
      .eq('students.professor_id', subscription.id)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) return [];
    
    return data.map(w => ({
      studentId: w.student_id,
      name: w.students?.name || 'Aluno sem nome',
      img: "",
      type: `Treino ${w.workout_type}`,
      date: w.start_date,
      goal: w.students?.goal
    }));
  },

  async getUpcomingDeadlines() {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return [];

    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    // Fetch workouts expiring soon
    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('student_id, end_date, students!inner(name, professor_id)')
      .eq('students.professor_id', subscription.id)
      .gte('end_date', todayStr)
      .lte('end_date', next7DaysStr)
      .order('end_date', { ascending: true });

    // Fetch latest evaluations for each student to find pending ones (assuming > 30 days)
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('student_id, evaluation_date, students!inner(name, professor_id)')
      .eq('students.professor_id', subscription.id)
      .order('evaluation_date', { ascending: false });

    // Deduplicate evaluations by student (get latest)
    const latestEvalsMap = new Map();
    if (evaluations) {
      evaluations.forEach(ev => {
        if (!latestEvalsMap.has(ev.student_id)) {
          latestEvalsMap.set(ev.student_id, ev);
        }
      });
    }

    const deadlines: any[] = [];

    if (workouts) {
      workouts.forEach(w => {
        const student = Array.isArray(w.students) ? w.students[0] : (w.students as any);
        deadlines.push({
          id: `w-${w.student_id}-${w.end_date}`,
          studentId: w.student_id,
          studentName: student?.name || 'Aluno sem nome',
          type: 'workout',
          date: w.end_date,
          label: 'Troca de Treino'
        });
      });
    }

    // Identify pending evaluations
    // If no evaluation exists OR last evaluation was more than 30 days ago
    const { data: allActiveStudents } = await supabase
      .from('students')
      .select('id, name')
      .eq('status', 'ativo')
      .eq('professor_id', subscription.id);
    
    if (allActiveStudents) {
      allActiveStudents.forEach(st => {
        const lastEval = latestEvalsMap.get(st.id);
        let isPending = false;
        let evalDate = '';

        if (!lastEval) {
          isPending = true;
          evalDate = 'Sem Data';
        } else {
          const lastDate = new Date(lastEval.evaluation_date);
          const diffDays = Math.ceil((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) {
            isPending = true;
            evalDate = lastEval.evaluation_date;
          }
        }

        if (isPending) {
          // Check if already in deadlines for workout? No, can have both.
          deadlines.push({
            id: `e-${st.id}`,
            studentId: st.id,
            studentName: st.name,
            type: 'evaluation',
            date: evalDate,
            label: 'Avaliação Pendente'
          });
        }
      });
    }

    return deadlines.sort((a, b) => {
      if (a.date === 'Sem Data') return -1;
      if (b.date === 'Sem Data') return 1;
      return a.date.localeCompare(b.date);
    }).slice(0, 6);
  },

  async getBiomechanicalRisks(limit = 4) {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return [];

    // Buscar relatos de dor (pain_level > 0) que não estejam concluídos (pendentes ou nulos)
    const { data, error } = await supabase
      .from('workout_history')
      .select('*, students!inner(*)')
      .gt('pain_level', 0)
      .eq('students.professor_id', subscription.id)
      .or('status.eq.pendente,status.is.null')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching biomechanical risks:', error);
      // Fallback para feedback_treino
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('feedback_treino')
        .select('*, students!inner(*)')
        .eq('students.professor_id', subscription.id)
        .or('status.eq.pendente,status.is.null')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (fallbackError) return [];
      
      return fallbackData.map(f => {
        const student = Array.isArray(f.students) ? f.students[0] : f.students;
        return {
          id: f.id,
          studentId: f.student_id,
          name: student?.name || 'Aluno sem nome',
          img: "",
          goal: student?.goal || '',
          painLevel: f.pain_level,
          location: f.pain_location,
          comment: f.notes || f.comment || '',
          date: f.created_at
        };
      });
    }

    return data.map(f => {
      const student = Array.isArray(f.students) ? f.students[0] : f.students;
      return {
        id: f.id,
        studentId: f.student_id,
        name: student?.name || 'Aluno sem nome',
        img: "",
        goal: student?.goal || '',
        painLevel: f.pain_level,
        location: f.pain_location,
        comment: f.notes || '',
        date: f.completed_at
      };
    });
  },

  async updateTrainerProfile(profile: Partial<TrainerProfile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('trainers')
      .update(profile)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async uploadTrainerAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Remove existing if any (to respect "file name must be userId" and overwrite/avoid duplicates)
    await supabase.storage
      .from('avatars')
      .remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getPendingStudents(): Promise<Student[]> {
    const subscription = await this.getTrainerSubscription();
    if (!subscription) return [];

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'pendente')
      .eq('professor_id', subscription.id)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(s => ({
      id: s.id,
      professor_id: s.professor_id,
      invite_token: s.invite_token,
      name: s.name,
      goal: s.goal,
      freq: s.frequency,
      status: s.status,
      img: "",
      phone: s.phone,
      lesao: s.lesao,
      observacoes: s.observacoes,
      birthDate: s.birth_date,
      email: s.email,
      password: s.password,
      created_at: s.created_at
    }));
  },

  async activateStudent(id: string, password?: string) {
    const { error } = await supabase
      .from('students')
      .update({ 
        status: 'ativo',
        ...(password ? { password } : {})
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async rejectStudent(id: string) {
    const { error } = await supabase
      .from('students')
      .update({ 
        status: 'recusado'
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async registerStudentPublic(name: string, email: string, phone: string, ref: string, birthDate?: string) {
    console.log('[PRECADASTRO PURO] envio iniciado');
    console.log('[PRECADASTRO PURO] chamando RPC');
    
    try {
      const { data: response, error: rpcError } = await supabase.rpc('register_student_by_invite', {
        p_ref: ref,
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_birth_date: birthDate
      });

      if (rpcError) {
        console.warn('[PRECADASTRO PURO] RPC falhou ou ignorou p_birth_date, tentando fallback:', rpcError);
        
        const { data: retryResponse, error: retryError } = await supabase.rpc('register_student_by_invite', {
          p_ref: ref,
          p_name: name,
          p_email: email,
          p_phone: phone
        });
        
        if (retryError) {
          console.error('[PRECADASTRO PURO] erro');
          throw retryError;
        }

        if (birthDate) {
          await supabase
            .from('students')
            .update({ birth_date: birthDate })
            .eq('email', email);
        }
        
        console.log('[PRECADASTRO PURO] sucesso');
        return retryResponse;
      }

      console.log('[PRECADASTRO PURO] sucesso');
      return response;
    } catch (error) {
      console.error('[PRECADASTRO PURO] erro');
      throw error;
    }
  },

  async registerStudentWithAuth(name: string, email: string, phone: string, password: string, ref: string, birthDate?: string) {
    console.log('[STUDENT SIGNUP] criando auth');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role: 'student' } }
    });

    if (authError) throw authError;
    console.log('[STUDENT SIGNUP] auth user id');

    await supabase.from('profiles').upsert({
      user_id: authData.user!.id,
      email,
      role: 'student',
      full_name: name
    }, { onConflict: 'user_id' });
    console.log('[STUDENT SIGNUP] profile criado');

    await supabase.rpc('register_student_by_invite', {
      p_ref: ref,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_birth_date: birthDate
    });

    await supabase.from('students').update({ 
      user_id: authData.user!.id,
      status: 'pendente',
      birth_date: birthDate
    }).eq('email', email);
    console.log('[STUDENT SIGNUP] student pendente criado');

    return authData.user;
  },



  async registerStudent(name: string, email: string, phone: string, ref: string) {
    const { data: response, error } = await supabase.rpc('register_student_by_invite', {
      p_ref: ref,
      p_name: name,
      p_email: email,
      p_phone: phone
    });

    if (error) {
      console.error('Error in register_student_by_invite:', error);
      throw error;
    }

    if (response && response.success === false) {
      throw new Error(response.error || 'Erro ao registrar aluno.');
    }

    return response;
  },

  async checkTrainerExists(trainerId: string): Promise<boolean> {
    // Usar RPC pública para evitar bloqueio de RLS em página pública de cadastro
    const { data, error } = await supabase.rpc('public_validate_trainer_ref', { 
      p_trainer_id: trainerId 
    });
    
    if (error) {
      console.error('Error checking trainer existence via RPC:', error);
      return false;
    }
    
    return data?.exists === true;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const subscription = await this.getTrainerSubscription();
      if (!subscription) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('professor_id', subscription.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('Notifications table not found in schema cache. Skipping notification fetch.');
          return [];
        }
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Silent error in getNotifications:', err);
      return [];
    }
  },

  async markNotificationAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error && error.code !== 'PGRST205') throw error;
    } catch (err) {
      console.error('Silent error in markNotificationAsRead:', err);
    }
  },

  async markAllNotificationsAsRead() {
    try {
      const subscription = await this.getTrainerSubscription();
      if (!subscription) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('professor_id', subscription.id)
        .eq('is_read', false);
      
      if (error && error.code !== 'PGRST205') throw error;
    } catch (err) {
      console.error('Silent error in markAllNotificationsAsRead:', err);
    }
  }
};
