import React, { useState } from 'react';
import { Camera, Image as ImageIcon, X, Check, Activity, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/geminiService';

interface PosturalViewData {
  photoUrl: string;
  deviations: string[];
}

interface PosturalEvaluationProps {
  data: {
    anterior: PosturalViewData;
    posterior: PosturalViewData;
    lateralDir: PosturalViewData;
    lateralEsq: PosturalViewData;
    diagnosis?: string;
  };
  onChange: (newData: any) => void;
}

const regions = [
  { name: 'Cabeça', items: ['Normal', 'Protusa', 'Inclinada'] },
  { name: 'Ombros', items: ['Nivelados', 'Protraídos', 'Elevados'] },
  { name: 'Pelve', items: ['Neutra', 'Anteversão', 'Retroversão'] },
  { name: 'Joelhos', items: ['Alinhados', 'Valgo', 'Varo'] },
  { name: 'Pés', items: ['Neutros', 'Pronados', 'Supinados'] },
];

const ViewSection = ({ 
  title, 
  data, 
  onChange,
  gridColor,
  setGridColor
}: { 
  title: string; 
  data: PosturalViewData; 
  onChange: (viewData: PosturalViewData) => void;
  gridColor: string;
  setGridColor: (color: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const presetColors = [
    { name: 'Branco', value: '#FFFFFF' },
    { name: 'Amarelo Neon', value: '#FFFF00' },
    { name: 'Ciano', value: '#00FFFF' },
    { name: 'Magenta', value: '#FF00FF' },
    { name: 'Preto', value: '#000000' },
  ];

  // Safety check for data
  if (!data) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDeviation = (deviation: string) => {
    const currentDeviations = data?.deviations || [];
    const isSelected = currentDeviations.includes(deviation);
    if (isSelected) {
      onChange({ ...data, deviations: currentDeviations.filter(d => d !== deviation) });
    } else {
      onChange({ ...data, deviations: [...currentDeviations, deviation] });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header and Grid Color Editor */}
      <div className="w-full flex flex-col gap-4 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-white/5 p-3 sm:p-0 rounded-2xl sm:rounded-none sm:bg-transparent">
          {/* Title Line */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#C5A07D]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A07D]">
                {title}
              </span>
            </div>
            
            {/* Mobile Only Edit Label */}
            <span className="sm:hidden text-[8px] font-black uppercase tracking-widest text-gray-500">
              EDITAR GRADE
            </span>
          </div>

          {/* Controls Line */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-gray-100 dark:border-white/5 sm:border-none overflow-x-auto no-scrollbar">
             <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Editar cor da Grade</span>
             <div className="flex items-center gap-2 sm:gap-2 shrink-0">
                {presetColors.map(c => (
                  <button 
                    key={c.value} 
                    onClick={() => setGridColor(c.value)}
                    className={cn(
                      "w-6 h-6 sm:w-4 sm:h-4 rounded-full border transition-all",
                      gridColor === c.value ? "border-primary scale-110 ring-2 ring-primary/20" : "border-white/20 hover:scale-110"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
                <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1" />
                <div className="relative w-6 h-6 sm:w-5 sm:h-5 rounded-full overflow-hidden border border-white/20 shrink-0">
                  <input 
                    type="color" 
                    value={gridColor.startsWith('#') ? gridColor : '#FFFFFF'} 
                    onChange={(e) => setGridColor(e.target.value)}
                    className="absolute -inset-2 w-10 h-10 cursor-pointer"
                  />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 dark:thin-border flex flex-col sm:flex-row h-full overflow-hidden rounded-[24px] sm:rounded-[32px]">
        {/* Photo Area with Plumb Line Simulator */}
        <div 
          className="relative aspect-[9/16] sm:w-64 bg-gray-100 dark:bg-black/40 cursor-pointer overflow-hidden group shrink-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {data.photoUrl && data.photoUrl !== "" ? (
            <>
              <img 
                src={data.photoUrl} 
                alt={title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full" style={{ 
                  backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
                  backgroundSize: '30px 30px'
                }} />
              </div>
              {/* Plumb Line - Red */}
              <div className="absolute inset-y-0 left-1/2 w-[2px] bg-[#EF4444] opacity-60 shadow-[0_0_8px_rgba(239,68,68,0.5)] pointer-events-none" />
              
              {/* Overlay Toolbar */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4"
                  >
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-4 rounded-full backdrop-blur-md transition-all">
                      <Camera className="text-white" size={24} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <button 
                      onClick={() => onChange({ ...data, photoUrl: '' })}
                      className="bg-red-500/20 hover:bg-red-500/30 p-4 rounded-full backdrop-blur-md transition-all text-red-500"
                    >
                      <X size={24} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <label className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#C5A07D]/10 flex items-center justify-center text-[#C5A07D] group-hover:scale-110 transition-transform">
                <ImageIcon size={32} />
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Upload Foto</p>
                <p className="text-[8px] font-bold uppercase tracking-tighter text-gray-500 dark:text-white/40 mt-1">Vertical 9:16</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          )}
        </div>

        {/* Checklist Area */}
        <div className="p-6 flex-1 space-y-6 custom-scrollbar overflow-y-auto bg-gray-50 dark:bg-black/20">
          {regions.map((region) => (
            <div key={region.name} className="space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#C5A07D]" />
                {region.name}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {region.items.map((item) => {
                  const isSelected = data?.deviations?.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleDeviation(item)}
                      className={cn(
                        "px-3 py-2 text-[8px] font-bold uppercase tracking-tight transition-all border",
                        isSelected 
                          ? "bg-[#C5A07D] text-black border-[#C5A07D] shadow-[0_0_10px_rgba(197,160,125,0.3)]" 
                          : "text-gray-600 dark:text-white/60 hover:border-primary/30 border-gray-100 dark:border-white/5 bg-white dark:bg-white/5"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CleanReport = ({ text }: { text: string }) => {
  if (!text) return null;

  // Clean remaining markdown artifacts and unwanted characters
  const cleanText = text
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/Equipe de Biomecânica/gi, 'Professor')
    .replace(/Nexo Clínica/gi, '')
    .replace(/Nexo/gi, '')
    // Remove dashes/hifens from common title formats (e.g., "LAUDO DE AVALIAÇÃO POSTURAL -")
    .replace(/^LAUDO DE AVALIAÇÃO POSTURAL\s*[-–—:]+/gi, 'LAUDO DE AVALIAÇÃO POSTURAL')
    .replace(/^LAUDO POSTURAL\s*[-–—:]+/gi, 'LAUDO DE AVALIAÇÃO POSTURAL')
    // Ensure "Atenciosamente, Professor" ends with exactly one dot
    .replace(/Atenciosamente,\s*Professor\.*/gi, 'Atenciosamente, Professor.')
    .trim();

  const lines = cleanText.split('\n');

  return (
    <div className="bg-white text-slate-900 p-8 shadow-sm min-h-[400px] h-full relative border border-slate-200 ring-1 ring-black/5 rounded-sm">
      {/* Letterhead Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#C5A07D]" />
      
      <div className="space-y-4 relative z-10">
        {lines.map((line, idx) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return <div key={idx} className="h-1" />;

          // Detect Section Headers (Simplified detection)
          const isTitle = /^[A-ZÀ-Ú\s:]{4,80}$/.test(trimmedLine) || trimmedLine.endsWith(':');

          if (isTitle && !trimmedLine.toLowerCase().includes('atenciosamente')) {
            return (
              <h3 key={idx} className="text-[#C5A07D] font-bold text-xs tracking-widest uppercase border-b border-[#C5A07D]/10 pb-1 mb-2">
                {trimmedLine.replace(/[-–—:]+$/, '').trim()}
              </h3>
            );
          }

          // Detect Lists
          if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
            return (
              <div key={idx} className="flex gap-2 pl-2 group">
                <div className="w-1 h-1 rounded-full bg-[#C5A07D] mt-1.5 shrink-0" />
                <p className="text-slate-700 text-[11px] leading-[1.6] font-medium text-justify flex-1">
                  {trimmedLine.replace(/^[-•]\s*/, '')}
                </p>
              </div>
            );
          }

          // Signature
          if (trimmedLine.toLowerCase().includes('atenciosamente')) {
             return (
               <div key={idx} className="pt-4 mt-6 border-t border-slate-100 italic">
                 <p className="text-[#C5A07D] font-bold text-xs not-italic uppercase tracking-widest">
                   {trimmedLine}
                 </p>
               </div>
             );
          }

          // Normal paragraphs
          return (
            <p key={idx} className="text-slate-700 text-[11px] leading-[1.6] font-medium opacity-90 text-justify">
              {trimmedLine}
            </p>
          );
        })}
      </div>

      {/* Clinical Footer */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-end opacity-20">
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest">NEXO - CIÊNCIA INTEGRADA</p>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );
};

export const PosturalEvaluation: React.FC<PosturalEvaluationProps> = ({ data, onChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [gridColor, setGridColor] = useState('rgba(255, 255, 255, 0.4)');

  const generateReport = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const deviationsSummary = [
        { view: 'Anterior', list: data.anterior?.deviations },
        { view: 'Posterior', list: data.posterior?.deviations },
        { view: 'Lateral Direita', list: data.lateralDir?.deviations },
        { view: 'Lateral Esquerda', list: data.lateralEsq?.deviations },
      ]
      .filter(v => v.list && v.list.length > 0)
      .map(v => `${v.view}: ${v.list.join(', ')}`)
      .join('\n');

      if (!deviationsSummary) {
        alert('Por favor, marque alguns desvios antes de gerar o laudo.');
        setIsGenerating(false);
        return;
      }

      const prompt = `Você é um especialista em biomecânica e fisioterapeuta.
Com base nos seguintes desvios posturais identificados em um aluno, gere um LAUDO DE AVALIAÇÃO POSTURAL PROFISSIONAL contendo: CONCLUSÃO CLÍNICA, CONDUTA DIAGNÓSTICA e RECOMENDAÇÕES DE TREINO.

DESVIOS IDENTIFICADOS:
${deviationsSummary}

REGRAS DE FORMATAÇÃO E CONTEÚDO:
1. NÃO INCLUA TÍTULO NO INÍCIO (como LAUDO DE AVALIAÇÃO POSTURAL). Comece diretamente.
2. USE TÍTULOS CLAROS EM MAIÚSCULAS PARA AS SEÇÕES (Ex: CONCLUSÃO CLÍNICA).
2. NÃO USE símbolos de Markdown como asteriscos (**) ou hashtags (#).
3. Use listas simples com hífens (-) para recomendações.
4. Assine ao final EXATAMENTE como: 'Atenciosamente, Professor.'.
5. Não use nomes como 'IA' ou 'Inteligência Artificial'. Fale como o especialista.
6. Não mencione 'Equipe de Biomecânica' ou 'Nexo Clínica'.
7. A resposta deve ser técnica, profissional e direta.`;

      const text = await geminiService.askAI(prompt);
      
      if (text) {
        onChange({ ...data, diagnosis: text });
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      let errorMsg = "Erro ao gerar o laudo. Tente novamente.";
      if (error.message.includes('API_KEY')) {
        errorMsg = "Serviço de IA indisponível: Chave de API não configurada no servidor.";
      }
      onChange({ ...data, diagnosis: errorMsg });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Avaliação Postural</h2>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#C5A07D] mt-2 flex items-center gap-2 font-manrope">
            Protocolo de Linha de Prumo
            <div className="w-10 sm:w-20 h-[1px] bg-[#C5A07D]/30" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface-container thin-border">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EF4444]" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-60">Prumo (Vermelho)</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface-container thin-border">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#C5A07D]/20" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-60">Grade</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
        <ViewSection 
          title="Visão Anterior" 
          data={data.anterior} 
          onChange={(newVal) => onChange({ ...data, anterior: newVal })} 
          gridColor={gridColor}
          setGridColor={setGridColor}
        />
        <ViewSection 
          title="Visão Posterior" 
          data={data.posterior} 
          onChange={(newVal) => onChange({ ...data, posterior: newVal })} 
          gridColor={gridColor}
          setGridColor={setGridColor}
        />
        <ViewSection 
          title="Lateral Esquerda" 
          data={data.lateralEsq} 
          onChange={(newVal) => onChange({ ...data, lateralEsq: newVal })} 
          gridColor={gridColor}
          setGridColor={setGridColor}
        />
        <ViewSection 
          title="Lateral Direita" 
          data={data.lateralDir} 
          onChange={(newVal) => onChange({ ...data, lateralDir: newVal })} 
          gridColor={gridColor}
          setGridColor={setGridColor}
        />
      </div>

      {/* Diagnosis Section */}
      <section className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t border-gray-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 flex items-center justify-center text-primary border border-primary/20 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Laudo Postural</h3>
              <p className="text-[8px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-white/40 tracking-widest font-manrope">Análise gerada por processamento biomecânico</p>
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-primary text-black font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-xl"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Activity size={18} />}
            Gerar Novo Laudo
          </button>
        </div>

        <div className="relative overflow-hidden">
          {data.diagnosis ? (
            <CleanReport text={data.diagnosis} />
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 p-8 sm:p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[24px] sm:rounded-[32px]">
              <Activity className="text-primary/20 size-10 sm:size-12" />
              <div className="space-y-1">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary/40">Aguardando Análise</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-tighter">Marque os desvios acima e clique em "Gerar Laudo"</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

