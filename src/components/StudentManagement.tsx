import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit3, X, Eye, Dumbbell, Zap, Activity, 
  AlertTriangle, User, Camera, Copy, Loader2, Mail, CheckCircle2, ClipboardCheck,
  Trash2, BrainCircuit
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dataService, Student } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface StudentManagementProps {
  onSelectStudent: (id: string, tab: string) => void;
  trainerProfile: any;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingStudent: Student | null;
  setEditingStudent: (s: Student | null) => void;
  generatedPassword: string | null;
  setGeneratedPassword: (p: string | null) => void;
  formData: any;
  setFormData: (data: any) => void;
  initialFormState: any;
  refreshTrigger?: number;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ 
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
  initialFormState,
  refreshTrigger = 0
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'ativos' | 'arquivados'>('ativos');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ name: '', email: '', password: '', token: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<Student | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Buscamos TODOS os alunos do banco para garantir que nada seja perdido
      const allStudents = await dataService.getStudents();
      
      // Aplicamos o filtro de aba conforme regra solicitada:
      // Ativos: Todo mundo que NÃO é 'Inativo' ou 'Arquivado'
      // Arquivados: Apenas quem é 'Inativo' ou 'Arquivado'
      const filteredByTab = allStudents.filter(s => {
        const studentStatus = (s.status || '').toLowerCase();
        const isArchived = studentStatus === 'inativo' || studentStatus === 'arquivado';
        
        if (activeTab === 'ativos') {
          return !isArchived;
        } else {
          return isArchived;
        }
      });

      setStudents(filteredByTab);
    } catch (err) {
      console.error('Erro ao buscar alunos:', err);
      toast.error('Erro ao carregar lista de alunos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeTab, refreshTrigger]);

  const handleOpenModal = async (student: Student | null = null) => {
    if (!student) {
      const check = await dataService.canAddStudent();
      if (!check.allowed) {
        toast.error(check.message);
        setActiveTab('ativos'); // Refresh list or similar
        return;
      }
    }

    setGeneratedPassword(null);
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name || '',
        goal: student.goal || '',
        freq: student.freq || '',
        status: student.status || 'Ativo',
        img: student.img || '',
        phone: student.phone || '',
        lesao: student.lesao || '',
        observacoes: student.observacoes || '',
        birthDate: student.birthDate || '',
        email: student.email || '',
        id: student.id
      });
    } else {
      setEditingStudent(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      // Usamos uma pasta temporária ou de alunos para o avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `student-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, img: publicUrl });
      toast.success("Foto carregada. Lembre-se de salvar o cadastro.");
    } catch (err: any) {
      toast.error("Erro ao carregar foto: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // 1. OBRIGATÓRIA: SENHA PADRÃO '12345'
      const finalPassword = '12345';

      // 2. CRIAÇÃO DE USUÁRIO NO SUPABASE AUTH (Acesso Oficial)
      if (formData.email) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: finalPassword,
        });

        if (signUpError && signUpError.message !== 'User already registered') {
          console.warn('Auth Sync Warning:', signUpError.message);
        }
      }

      // 3. TRATAMENTO DE DADOS (Removendo a senha da persistência no banco de dados)
      const { id, password, ...baseDataWithoutPassword } = formData;
      
      const cleanedData = {
        ...baseDataWithoutPassword,
        birthDate: baseDataWithoutPassword.birthDate || null,
        phone: baseDataWithoutPassword.phone || null,
        lesao: baseDataWithoutPassword.lesao || null,
        observacoes: baseDataWithoutPassword.observacoes || null,
        freq: baseDataWithoutPassword.freq || null,
        goal: baseDataWithoutPassword.goal || null,
        name: baseDataWithoutPassword.name || '',
        email: baseDataWithoutPassword.email?.trim().toLowerCase() || '',
        status: baseDataWithoutPassword.status || 'Ativo'
      };

      if (editingStudent) {
        await dataService.updateStudent(editingStudent.id, cleanedData);
        toast.success("Perfil de aluno atualizado.");
      } else {
        await dataService.addStudent(cleanedData);
        toast.success("Novo aluno registrado com sucesso!");
      }

      // 4. MODAL DE SUCESSO (Apenas em novos cadastros)
      if (!editingStudent) {
        const newStudent = await dataService.getStudents().then(list => list.find(s => s.email === formData.email.trim().toLowerCase()));
        
        setSuccessData({
          name: formData.name,
          email: formData.email,
          password: finalPassword,
          token: newStudent?.invite_token
        });
        setShowSuccessModal(true);
        setIsModalOpen(false);
      } else {
        setIsModalOpen(false);
      }
      
      await fetchStudents();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro crítico ao salvar aluno.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyInviteLink = (token?: string) => {
    if (!token) {
      toast.error("Link de convite não disponível.");
      return;
    }
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}?invite=${token}`;
    
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link de convite copiado para a área de transferência!");
  };

  const copyWelcomeText = () => {
    const profName = trainerProfile?.full_name || "Seu Treinador";
    const baseUrl = window.location.origin;
    const inviteLink = successData.token ? `${baseUrl}?invite=${successData.token}` : '';
    
    const text = `Seja bem-vindo ao Time do professor ${profName}! Acesse o app pelo link: ${inviteLink}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDeletePermanent = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(`Tem certeza? Isso apagará todos os dados de treino e avaliações de ${studentName} para sempre.`);
    
    if (!confirmed) return;

    try {
      setLoading(true);
      await dataService.deleteStudent(studentId);
      
      toast.success("Aluno excluído permanentemente.");
      await fetchStudents();
    } catch (err: any) {
      console.error('Erro ao excluir aluno:', err);
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAiAnalysis = async (student: Student) => {
    if (!student.lesao) {
      toast.error("Nenhuma lesão informada para este aluno.");
      return;
    }

    setLoadingAI(student.id);
    setSelectedStudentForAI(student);
    
    try {
      // Usamos o serviço para sugerir ajustes
      const suggestion = await geminiService.suggestTrainingAdjustments(
        student.lesao,
        student.goal || "Desenvolvimento Geral",
        undefined // No biofeedback available here
      );
      
      setAiSuggestion(suggestion);
      setShowAiModal(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro na análise IA: " + (err.message || "Tente novamente mais tarde."));
    } finally {
      setLoadingAI(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      {/* Header Seção */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Controle de Membros</span>
          <h1 className="editorial-title text-3xl sm:text-5xl md:text-8xl mt-2 sm:mt-4 text-gray-900 dark:text-white font-manrope">BANCO DE<br /><span className="text-primary">DADOS</span></h1>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-primary text-black px-6 md:px-10 py-4 md:py-5 font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] flex items-center gap-2 md:gap-3 shadow-[0_20px_50px_rgba(197,160,125,0.2)] hover:brightness-110 active:scale-95 transition-all w-full md:w-auto justify-center rounded-xl md:rounded-2xl shrink-0">
          <Plus size={18} strokeWidth={3} />
          Cadastrar Aluno
        </button>
      </section>

      {/* Navegação de Abas */}
      <div className="flex gap-4 sm:gap-8 border-b border-gray-200 dark:border-white/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'ativos', label: 'Alunos Ativos' },
          { id: 'arquivados', label: 'Arquivados' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("pb-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all relative whitespace-nowrap", activeTab === tab.id ? "text-primary" : "text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white")}>
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Busca */}
      <section className="relative group">
        <div className="absolute inset-y-0 left-5 sm:left-6 flex items-center pointer-events-none text-gray-400 dark:text-white/20 group-focus-within:text-primary transition-colors"><Search size={22} /></div>
        <input className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 py-4 sm:py-6 pl-12 sm:pl-16 pr-4 sm:pr-6 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/10 focus:ring-1 focus:ring-primary/20 outline-none text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all rounded-xl sm:rounded-2xl shadow-sm" placeholder="Pesquisar por nome ou e-mail..." type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </section>

      {/* Tabela de Alunos */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 overflow-hidden rounded-[24px] sm:rounded-[32px] shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse hidden sm:table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black uppercase text-[10px] font-black text-gray-500 dark:text-white/30 tracking-[0.2em]">
                <th className="px-8 py-6 whitespace-nowrap">Identificação</th>
                <th className="px-8 py-6 whitespace-nowrap">Status Operacional</th>
                <th className="px-8 py-6 whitespace-nowrap">Ficha Principal</th>
                <th className="px-8 py-6 whitespace-nowrap text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="py-32 text-center"><Loader2 className="animate-spin text-primary mx-auto w-10 h-10" /></td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={4} className="py-32 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/20">Sem registros para exibir</td></tr>
              ) : filteredStudents.map(student => (
                <tr key={student.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-black overflow-hidden border border-gray-200 dark:border-white/5 shadow-inner flex items-center justify-center">
                        {student.img && student.img !== "" ? (
                          <img src={student.img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-40 dark:opacity-10 text-gray-400 dark:text-white"><User size={24} /></div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black uppercase tracking-tight text-sm text-gray-900 dark:text-white">{student.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 dark:text-white/30 tracking-widest font-bold">{student.email}</span>
                          {student.birthDate && (
                            <>
                              <span className="text-gray-300 dark:text-white/10 text-[8px]">•</span>
                              <span className="text-[10px] text-primary/60 tracking-widest font-bold">
                                {new Date(student.birthDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} 
                                ({(() => {
                                  const today = new Date();
                                  const birth = new Date(student.birthDate);
                                  let age = today.getFullYear() - birth.getFullYear();
                                  const m = today.getMonth() - birth.getMonth();
                                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                  return age;
                                })()} anos)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full inline-block", 
                      student.status?.toLowerCase() === 'ativo' 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 border border-gray-200 dark:border-white/10"
                    )}>
                      {student.status || 'Não definido'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-600 dark:text-white/60 font-black uppercase tracking-widest">{student.goal || 'S/ Objetivo'}</span>
                      {student.lesao ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-red-500 font-bold uppercase truncate max-w-[150px]" title={student.lesao}>
                            <AlertTriangle size={10} className="inline mr-1" />
                            {student.lesao}
                          </span>
                          <button 
                            onClick={() => handleAiAnalysis(student)}
                            disabled={loadingAI === student.id}
                            className={cn(
                              "p-1 rounded-md transition-all",
                              loadingAI === student.id ? "bg-primary/20 text-primary animate-pulse" : "bg-primary/10 text-primary hover:bg-primary hover:text-black"
                            )}
                            title="Análise IA de Lesão"
                          >
                            {loadingAI === student.id ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} strokeWidth={3} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-400 dark:text-white/20 font-bold uppercase">{student.freq || 'Freq. não definida'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3 text-gray-400 dark:text-white/20">
                      <button onClick={() => copyInviteLink(student.invite_token)} title="Link de Convite" className="p-2 hover:text-primary transition-colors"><Mail size={18} /></button>
                      <button onClick={() => onSelectStudent(student.id, 'avaliacao')} title="Nova Avaliação" className="p-2 hover:text-primary transition-colors"><Zap size={18} /></button>
                      <button onClick={() => handleOpenModal(student)} title="Editar Cadastro" className="p-2 hover:text-secondary transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => onSelectStudent(student.id, 'relatorios')} title="Visualizar Relatório" className="p-2 hover:text-gray-900 dark:hover:text-white transition-colors"><Eye size={18} /></button>
                      {activeTab === 'arquivados' && (
                        <button 
                          onClick={() => handleDeletePermanent(student.id, student.name)} 
                          title="Excluir Permanentemente" 
                          className="p-2 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Versão Card para Mobile */}
          <div className="sm:hidden divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto w-8 h-8" /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/20">Nenhum registro</div>
            ) : (
              filteredStudents.map(student => (
                <div key={student.id} className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-black overflow-hidden border border-gray-200 dark:border-white/5 flex items-center justify-center shrink-0">
                      {student.img ? (
                        <img src={student.img} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="opacity-20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-xs text-gray-900 dark:text-white truncate">{student.name}</p>
                      <p className="text-[9px] text-gray-400 dark:text-white/30 truncate uppercase font-bold tracking-widest">{student.email}</p>
                    </div>
                    <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 pr-2.5 py-1 rounded-full",
                      student.status?.toLowerCase() === 'ativo' ? "bg-primary/20 text-primary" : "bg-gray-100 dark:bg-white/5 text-gray-400"
                    )}>{student.status}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-400 dark:text-white/20 bg-gray-50 dark:bg-black/40 rounded-xl p-1 gap-1">
                    <button onClick={() => copyInviteLink(student.invite_token)} className="flex-1 p-2.5 hover:text-primary transition-colors flex justify-center"><Mail size={16} /></button>
                    <button onClick={() => onSelectStudent(student.id, 'avaliacao')} className="flex-1 p-2.5 hover:text-primary transition-colors flex justify-center"><Zap size={16} /></button>
                    <button onClick={() => handleOpenModal(student)} className="flex-1 p-2.5 hover:text-secondary transition-colors flex justify-center"><Edit3 size={16} /></button>
                    <button onClick={() => onSelectStudent(student.id, 'relatorios')} className="flex-1 p-2.5 hover:text-white transition-colors flex justify-center"><Eye size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSaving && setIsModalOpen(false)} className="absolute inset-0 bg-black/80 dark:bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }} className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full max-h-[100dvh] sm:max-h-[90vh] sm:rounded-[40px]">
              
              <div className="flex justify-between items-center p-6 sm:p-10 border-b border-gray-100 dark:border-white/5 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-primary/10 text-primary rounded-xl sm:rounded-2xl"><User size={24} strokeWidth={2.5} /></div>
                  <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">{editingStudent ? 'Atualizar Perfil' : 'Novo Aluno'}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"><X size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
                <form id="student-form" onSubmit={handleSave} className="space-y-8 sm:space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
                    
                    {/* Foto de Perfil */}
                    <div className="col-span-full flex flex-col items-center mb-2 sm:mb-4">
                      <div className="relative group">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/5 overflow-hidden shadow-2xl relative flex items-center justify-center">
                          {formData.img && formData.img !== "" ? (
                            <img src={formData.img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-40 dark:opacity-10 text-gray-400 dark:text-white"><User size={48} /></div>
                          )}
                          {uploadingPhoto && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                              <Loader2 className="animate-spin text-primary" size={20} />
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 sm:p-3 bg-primary text-black rounded-full cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                          <Camera size={20} strokeWidth={3} />
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        </label>
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/20 mt-3 sm:mt-4">Avatar do Aluno</span>
                    </div>

                    {/* Blocos de Dados */}
                    <div className="col-span-full border-b border-gray-100 dark:border-white/5 pb-2"><span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-primary/60">Credenciais de Acesso</span></div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Nome Completo</label>
                      <input required className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all font-manrope" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="João da Silva" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">E-mail Oficial</label>
                      <input required type="email" className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all font-manrope disabled:opacity-50" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="nome@exemplo.com" disabled={!!editingStudent} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Status da Conta</label>
                      <select 
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                        value={formData.status || 'Ativo'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>

                    <div className="col-span-full border-b border-gray-100 dark:border-white/5 pb-2 mt-4 sm:mt-6"><span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-primary/60">Perfil e Biotipo</span></div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Objetivo Estratégico</label>
                      <input required className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all" value={formData.goal || ''} onChange={(e) => setFormData({...formData, goal: e.target.value})} placeholder="Ex: Melhora Postural" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Frequência Semanal</label>
                      <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all" value={formData.freq || ''} onChange={(e) => setFormData({...formData, freq: e.target.value})} placeholder="3x na semana" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Telefone / WhatsApp</label>
                      <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(00) 00000-0000" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Data de Nascimento</label>
                      <input type="date" className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all text-center sm:text-left" value={formData.birthDate || ''} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} />
                    </div>

                    <div className="col-span-full space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Lesões ou Impedimentos</label>
                      <input className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-4 sm:p-5 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-xl sm:rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all" value={formData.lesao || ''} onChange={(e) => setFormData({...formData, lesao: e.target.value})} placeholder="Ex: Hérnia L4/L5, Dor no ombro direito..." />
                    </div>

                    <div className="col-span-full space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Observações Gerais</label>
                      <textarea rows={3} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 p-4 sm:p-6 text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-bold tracking-tight rounded-2xl sm:rounded-3xl focus:ring-1 focus:ring-primary/30 transition-all resize-none" value={formData.observacoes || ''} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} placeholder="Notas adicionais sobre o histórico do aluno..." />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 sm:p-10 border-t border-gray-100 dark:border-white/5 bg-gray-100/30 dark:bg-surface-container-highest/30 backdrop-blur-md flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 py-4 sm:py-5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/5 transition-all rounded-xl text-gray-500 dark:text-white">Cancelar</button>
                <button type="submit" form="student-form" disabled={isSaving} className="order-1 sm:order-2 flex-[2] py-4 sm:py-5 bg-primary text-black font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-[11px] flex items-center justify-center gap-2 sm:gap-4 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 rounded-xl shadow-[0_20px_50px_rgba(197,160,125,0.2)] font-manrope">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} strokeWidth={3} />}
                  {editingStudent ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Sucesso */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowSuccessModal(false)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg bg-white dark:bg-surface-container border border-gray-200 dark:border-primary/20 p-10 rounded-[2.5rem] text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8 shadow-inner"><CheckCircle2 size={40} strokeWidth={2.5} /></div>
              
              <div className="bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-white/5 p-8 rounded-3xl text-left mb-8 text-[13px] leading-relaxed font-manrope shadow-inner">
                <p className="text-gray-900 dark:text-white">
                  Seja bem-vindo ao Time do professor <span className="text-primary font-bold">{trainerProfile?.full_name || "Seu Professor"}</span>! 
                  Acesse o app pelo link de convite abaixo para concluir seu perfil.
                </p>
                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl break-all text-[10px] text-primary/60">
                   {window.location.origin}?invite={successData.token}
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={copyWelcomeText} 
                  className={cn(
                    "w-full py-5 font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95 rounded-2xl shadow-lg",
                    copied 
                      ? "bg-amber-500 text-black shadow-amber-500/20" 
                      : "bg-primary text-black shadow-primary/20 hover:brightness-110"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={20} />
                      Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copiar Dados
                    </>
                  )}
                </button>
                <button onClick={() => setShowSuccessModal(false)} className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white transition-all py-2">Concluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Análise IA */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAiModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-primary/20 p-8 md:p-12 rounded-[40px] shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-primary/20 text-primary rounded-3xl shrink-0 h-16 w-16 flex items-center justify-center">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Análise Clínica IA</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Prescrição Adaptativa Sugerida</p>
                </div>
                <button onClick={() => setShowAiModal(false)} className="ml-auto p-3 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                  <div className="flex items-center gap-3 text-red-500 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Lesão Reportada</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedStudentForAI?.lesao}</p>
                </div>

                <div className="p-8 bg-primary/5 border border-primary/10 rounded-[32px] prose prose-invert prose-sm max-w-none">
                  <div className="flex items-center gap-3 text-primary mb-4">
                    <Zap size={16} fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sugestão de Adaptação</span>
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-line">
                    {aiSuggestion}
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center italic mt-4">
                  *Esta é uma sugestão gerada por IA. A decisão final e a segurança da execução são de responsabilidade do treinador.
                </p>
              </div>

              <div className="mt-10">
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="w-full py-5 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Entendi, vou aplicar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentManagement;
