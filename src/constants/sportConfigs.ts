export interface SportConfig {
  label: string;
  value: string;
  primaryColor: string;
  accentColor: string;
  metrics: string[];
  cardLabel: string;
}

export const SPORT_CONFIGS: Record<string, SportConfig> = {
  musculacao: {
    label: 'Musculação',
    value: 'musculacao',
    primaryColor: '#C5A07D',
    accentColor: 'rgba(197, 160, 125, 0.2)',
    metrics: ['séries', 'reps', 'carga', 'descanso'],
    cardLabel: 'Musculação'
  },
  corrida: {
    label: 'Corrida',
    value: 'corrida',
    primaryColor: '#0070FF',
    accentColor: 'rgba(0, 112, 255, 0.2)',
    metrics: ['distância', 'pace', 'tempo', 'intensidade'],
    cardLabel: 'Corrida'
  },
  natacao: {
    label: 'Natação',
    value: 'natacao',
    primaryColor: '#06B6D4',
    accentColor: 'rgba(6, 182, 212, 0.2)',
    metrics: ['metragem', 'estilo', 'tiros', 'descanso'],
    cardLabel: 'Natação'
  },
  tenis: {
    label: 'Tênis',
    value: 'tenis',
    primaryColor: '#CCFF00',
    accentColor: 'rgba(204, 255, 0, 0.2)',
    metrics: ['duração', 'intensidade', 'saque', 'deslocamento'],
    cardLabel: 'Tênis'
  },
  volei: {
    label: 'Vôlei',
    value: 'volei',
    primaryColor: '#8B5CF6',
    accentColor: 'rgba(139, 92, 246, 0.2)',
    metrics: ['saltos', 'intensidade', 'duração', 'potência'],
    cardLabel: 'Vôlei'
  },
  crossfit: {
    label: 'Crossfit',
    value: 'crossfit',
    primaryColor: '#EF4444',
    accentColor: 'rgba(239, 68, 68, 0.2)',
    metrics: ['rounds', 'tempo', 'carga', 'intensidade'],
    cardLabel: 'Crossfit'
  }
};
