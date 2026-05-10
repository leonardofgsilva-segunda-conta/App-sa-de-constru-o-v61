import React, { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, User, ClipboardList, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface CardioData {
  resting_hr: number;
  resting_bp_systolic: number;
  resting_bp_diastolic: number;
  protocol: string;
  distance: number;
  time: string;
  final_hr: number;
  step_hr: number;
  vo2_max: number;
  classification: string;
}

interface CardioEvaluationProps {
  data: CardioData;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  onChange: (data: CardioData) => void;
}

export const CardioEvaluation: React.FC<CardioEvaluationProps> = ({ data, age, gender, weight, onChange }) => {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const updateField = (field: keyof CardioData, value: any) => {
    const newData = { ...localData, [field]: value };
    calculateVO2(newData);
  };

  const calculateVO2 = (currentData: CardioData) => {
    let vo2 = 0;
    
    switch (currentData.protocol) {
      case 'cooper':
        if (currentData.distance && currentData.distance > 0) {
          vo2 = (currentData.distance - 504.9) / 44.73;
        }
        break;
      case 'rockport':
        if (currentData.time && currentData.final_hr && weight > 0) {
          const [min, sec] = currentData.time.split(':').map(Number);
          const timeInMin = min + (sec || 0) / 60;
          const weightLb = weight * 2.20462;
          const genderCode = gender === 'male' ? 1 : 0;
          vo2 = 132.853 - (0.0769 * weightLb) - (0.3877 * age) + (6.315 * genderCode) - (3.2649 * timeInMin) - (0.1565 * currentData.final_hr);
        }
        break;
      case 'tc6m':
        if (currentData.distance && currentData.distance > 0) {
          // ACSM Simplified
          vo2 = (0.1 * (currentData.distance / 6)) + 3.5;
        }
        break;
      case 'queens':
        if (currentData.step_hr && currentData.step_hr > 0) {
          if (gender === 'male') {
            vo2 = 111.33 - (0.42 * currentData.step_hr);
          } else {
            vo2 = 65.81 - (0.1847 * currentData.step_hr);
          }
        }
        break;
    }

    const classification = getClassification(vo2, age, gender);
    onChange({ ...currentData, vo2_max: Number(vo2.toFixed(2)), classification });
  };

  const getClassification = (vo2: number, age: number, gender: 'male' | 'female') => {
    if (vo2 <= 0) return '---';
    
    // Simplified Classification Table based on ACSM
    if (gender === 'male') {
      if (age < 30) {
        if (vo2 < 34) return 'Fraco';
        if (vo2 < 43) return 'Médio';
        if (vo2 < 52) return 'Bom';
        return 'Excelente';
      } else if (age < 40) {
        if (vo2 < 31) return 'Fraco';
        if (vo2 < 40) return 'Médio';
        if (vo2 < 49) return 'Bom';
        return 'Excelente';
      } else if (age < 50) {
        if (vo2 < 27) return 'Fraco';
        if (vo2 < 36) return 'Médio';
        if (vo2 < 45) return 'Bom';
        return 'Excelente';
      } else {
        if (vo2 < 25) return 'Fraco';
        if (vo2 < 33) return 'Médio';
        if (vo2 < 41) return 'Bom';
        return 'Excelente';
      }
    } else {
      if (age < 30) {
        if (vo2 < 28) return 'Fraco';
        if (vo2 < 35) return 'Médio';
        if (vo2 < 41) return 'Bom';
        return 'Excelente';
      } else if (age < 40) {
        if (vo2 < 26) return 'Fraco';
        if (vo2 < 33) return 'Médio';
        if (vo2 < 38) return 'Bom';
        return 'Excelente';
      } else if (age < 50) {
        if (vo2 < 23) return 'Fraco';
        if (vo2 < 30) return 'Médio';
        if (vo2 < 35) return 'Bom';
        return 'Excelente';
      } else {
        if (vo2 < 21) return 'Fraco';
        if (vo2 < 27) return 'Médio';
        if (vo2 < 32) return 'Bom';
        return 'Excelente';
      }
    }
  };

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic === 0 || diastolic === 0) return null;
    if (systolic < 120 && diastolic < 80) return { label: 'Normal', color: 'text-green-500' };
    if (systolic < 130 && diastolic < 85) return { label: 'Pré-Hipertensão', color: 'text-yellow-500' };
    return { label: 'Hipertensão', color: 'text-red-500' };
  };

  const bpStatus = getBPStatus(localData.resting_bp_systolic, localData.resting_bp_diastolic);

  const protocols = [
    { id: 'cooper', label: 'Teste de Cooper (12 min)' },
    { id: 'rockport', label: 'Teste de Rockport (1 milha)' },
    { id: 'tc6m', label: 'Teste de Caminhada (6 min)' },
    { id: 'queens', label: 'Banco (Queens College)' },
  ];

  return (
    <div className="space-y-12">
      {/* Sinais Vitais */}
      <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 dark:thin-border p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="h-6 sm:h-8 w-1 bg-primary"></div>
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Sinais Vitais de Repouso</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="md:col-span-4 space-y-2 sm:space-y-3">
            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary/80">Frequência Cardíaca</label>
            <div className="relative group transition-all">
              <input 
                type="number"
                value={localData.resting_hr || ''}
                onChange={(e) => updateField('resting_hr', Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-3 sm:p-4 pr-16 focus:border-primary outline-none text-lg sm:text-xl font-black text-gray-900 dark:text-primary transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.2em] pointer-events-none">bpm</span>
            </div>
          </div>
          
          <div className="md:col-span-8 space-y-2 sm:space-y-3">
            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary/80">Pressão Arterial</label>
            <div className="flex gap-4 sm:gap-6">
              <div className="relative flex-1 group transition-all">
                <input 
                  type="number"
                  placeholder="SIS"
                  value={localData.resting_bp_systolic || ''}
                  onChange={(e) => updateField('resting_bp_systolic', Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-3 sm:p-4 pr-16 sm:pr-20 focus:border-primary outline-none text-lg sm:text-xl font-black text-gray-900 dark:text-primary transition-all"
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.2em] pointer-events-none">mmHg</span>
              </div>
              <div className="relative flex-1 group transition-all">
                <input 
                  type="number"
                  placeholder="DIA"
                  value={localData.resting_bp_diastolic || ''}
                  onChange={(e) => updateField('resting_bp_diastolic', Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-3 sm:p-4 pr-16 sm:pr-20 focus:border-primary outline-none text-lg sm:text-xl font-black text-gray-900 dark:text-primary transition-all"
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.2em] pointer-events-none">mmHg</span>
              </div>
            </div>
          </div>
        </div>

        {bpStatus && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg flex items-center justify-between"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Classificação PA (SBC):</span>
            <span className={cn("text-xs font-black uppercase tracking-widest", bpStatus.color)}>{bpStatus.label}</span>
          </motion.div>
        )}
      </section>

      {/* Protocolos */}
      <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 dark:thin-border p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="h-6 sm:h-8 w-1 bg-primary"></div>
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Protocolo de Teste</h2>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-2 sm:space-y-3">
            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary/80">Selecione o Protocolo</label>
            <select 
              value={localData.protocol}
              onChange={(e) => updateField('protocol', e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-3 sm:p-4 focus:border-primary outline-none text-[9px] sm:text-[10px] font-bold uppercase tracking-widest appearance-none cursor-pointer text-gray-900 dark:text-white"
            >
              {protocols.map(p => (
                <option key={p.id} value={p.id} className="dark:bg-zinc-900">{p.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {localData.protocol === 'cooper' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/80">Distância Percorrida</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={localData.distance || ''}
                    onChange={(e) => updateField('distance', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-4 pr-20 focus:border-primary outline-none text-sm font-bold text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest pointer-events-none">metros</span>
                </div>
              </div>
            )}

            {localData.protocol === 'rockport' && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/80">Tempo total (min:seg)</label>
                  <input 
                    type="text"
                    placeholder="12:30"
                    value={localData.time || ''}
                    onChange={(e) => updateField('time', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-4 focus:border-primary outline-none text-sm font-bold text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/80">FC Final</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={localData.final_hr || ''}
                      onChange={(e) => updateField('final_hr', Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-4 pr-16 focus:border-primary outline-none text-sm font-bold text-gray-900 dark:text-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest pointer-events-none">bpm</span>
                  </div>
                </div>
              </>
            )}

            {localData.protocol === 'tc6m' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/80">Distância Percorrida</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={localData.distance || ''}
                    onChange={(e) => updateField('distance', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-4 pr-20 focus:border-primary outline-none text-sm font-bold text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest pointer-events-none">metros</span>
                </div>
              </div>
            )}

            {localData.protocol === 'queens' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/80">FC de Recuperação</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={localData.step_hr || ''}
                    onChange={(e) => updateField('step_hr', Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-lg p-4 pr-16 focus:border-primary outline-none text-sm font-bold text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest pointer-events-none">bpm</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Resultados de Performance */}
      <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 dark:thin-border p-8 rounded-[32px] shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-1 bg-primary"></div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Resultados de Performance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">VO2 Máximo Estimado</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-6xl font-black text-primary tracking-tighter tabular-nums">{localData.vo2_max || '--'}</h3>
              <span className="text-sm font-bold uppercase text-gray-400 dark:text-white/30">ml/kg/min</span>
            </div>
            
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60 text-primary">
                <span>Capacidade Aeróbica</span>
                <span className="font-black">{localData.classification}</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full overflow-hidden relative">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, (localData.vo2_max / 60) * 100)}%` }}
                   className="h-full bg-primary shadow-[0_0_20px_rgba(197,160,125,0.4)]"
                />
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-30 text-gray-400">
                <span>Baixo</span>
                <span>Atleta</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-black/40 p-8 border border-gray-100 dark:border-white/5 rounded-lg space-y-6">
            <h4 className="text-sm font-black uppercase tracking-tight flex items-center gap-3 text-primary">
              <ClipboardList size={18} />
              Laudo Cardiorrespiratório
            </h4>
            <div className="space-y-4 text-xs text-gray-600 dark:text-white/60 leading-relaxed text-justify italic">
              <p>
                A análise da capacidade aeróbica através do {protocols.find(p => p.id === localData.protocol)?.label} 
                indica um VO2 Máximo de {localData.vo2_max} ml/kg/min.
              </p>
              <p>
                Esta marca classifica o aluno como "{localData.classification}" para a sua faixa etária e sexo, 
                segundo os padrões da ACSM. Estratégias de treinamento intervalado e contínuo são sugeridas para otimização da performance.
              </p>
            </div>
            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Atenciosamente,</p>
              <p className="text-[10px] font-bold text-primary mt-1">NEXO — Ciência Integrada</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
