import React from 'react';
import { motion } from 'motion/react';

interface MuscleData {
  volume: number;
  hasPain: boolean;
  isFatigued?: boolean;
}

interface AnatomicalModelProps {
  muscleData: Record<string, MuscleData>;
  limit?: number;
  highlightedId?: string | null;
}

const AnatomicalModel: React.FC<AnatomicalModelProps> = ({ muscleData, limit = 26, highlightedId }) => {
  const muscles = [
    // Front View
    { id: 'peitorais', name: 'Peitorais', view: 'front', path: 'M 135 110 Q 155 105 170 115 L 170 145 Q 150 155 130 145 Z M 170 115 Q 185 105 205 110 L 210 145 Q 190 155 170 145 Z' },
    { id: 'deltoides', name: 'Deltóides', view: 'front', path: 'M 110 110 Q 120 100 135 110 L 130 145 Q 115 155 105 140 Z M 230 110 Q 220 100 205 110 L 210 145 Q 225 155 235 140 Z' },
    { id: 'biceps', name: 'Bíceps', view: 'front', path: 'M 100 145 Q 115 160 110 195 L 125 195 Q 130 160 125 145 Z M 240 145 Q 225 160 230 195 L 215 195 Q 210 160 215 145 Z' },
    { id: 'abs', name: 'Abdômen', view: 'front', path: 'M 155 155 L 185 155 L 180 230 L 160 230 Z' },
    { id: 'quadriceps', name: 'Quadríceps', view: 'front', path: 'M 135 245 Q 155 260 150 340 L 168 340 Q 170 260 168 245 Z M 205 245 Q 185 260 190 340 L 172 340 Q 170 260 172 245 Z' },
    
    // Back View
    { id: 'trapezio', name: 'Trapézio', view: 'back', path: 'M 150 100 L 190 100 L 180 140 L 160 140 Z' },
    { id: 'latissimo', name: 'Latíssimo', view: 'back', path: 'M 140 140 L 200 140 L 190 205 L 150 205 Z' },
    { id: 'triceps', name: 'Tríceps', view: 'back', path: 'M 100 145 Q 115 160 110 195 L 125 195 Q 130 160 125 145 Z M 240 145 Q 225 160 230 195 L 215 195 Q 210 160 215 145 Z' },
    { id: 'gluteos', name: 'Glúteos', view: 'back', path: 'M 145 235 Q 170 230 195 235 L 200 275 Q 170 285 140 275 Z' },
    { id: 'isquiotibiais', name: 'Isquiotibiais', view: 'back', path: 'M 140 285 Q 155 310 150 370 L 168 370 Q 170 310 168 285 Z M 200 285 Q 185 310 190 370 L 172 370 Q 170 310 172 285 Z' },
    { id: 'panturrilhas', name: 'Panturrilhas', view: 'back', path: 'M 145 385 Q 155 410 150 450 L 165 450 Q 170 410 165 385 Z M 195 385 Q 185 410 190 450 L 175 450 Q 170 410 175 385 Z' },
  ];

  const renderView = (view: 'front' | 'back') => {
    // Official high-definition links
    const bgImage = view === 'front' 
      ? "https://i.postimg.cc/87k68YXP/corpo-frente.png" 
      : "https://i.postimg.cc/mtyH54j4/corpo-costas.png";

    return (
      <div className="relative w-1/2 lg:w-full lg:max-w-[320px] overflow-visible">
        {/* Layer 1: HD Background Anatomy */}
        <img 
          src={bgImage} 
          alt=""
          className="w-full h-auto object-contain pointer-events-none z-0 brightness-[0.9]"
          style={{ imageRendering: 'auto' }}
          referrerPolicy="no-referrer"
        />

        {/* Layer 2: Interactive SVG Heatmap (Aligned exactly on top) */}
        <svg 
          viewBox="0 0 340 510" 
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
          style={{ mixBlendMode: 'overlay', opacity: 0.45 }}
        >
          {muscles.filter(m => m.view === view).map(muscle => {
            let data = (muscleData || {})[muscle.id];
            
            // Mapping aliases for data consistency
            if (!data && muscleData) {
              if (muscle.id === 'peitorais') data = muscleData['Peitorais'];
              if (muscle.id === 'deltoides') data = muscleData['Ombros'];
              if (muscle.id === 'abs') data = muscleData['Core'];
              if (muscle.id === 'gluteos') data = muscleData['Gluteo'];
              if (muscle.id === 'quadriceps') data = muscleData['Quadriceps'];
              if (muscle.id === 'isquiotibiais') data = muscleData['Isquiotibiais'] || muscleData['Biceps Femoral'];
              if (muscle.id === 'panturrilhas') data = muscleData['Gastrocnemios'];
              if (['latissimo', 'trapezio'].includes(muscle.id)) data = muscleData['Costas'];
            }

            const vol = data?.volume || 0;
            const isOverloaded = vol >= limit;
            const intensity = Math.min(vol / limit, 1);
            
            const isHighlighted = highlightedId === muscle.id || 
                               (highlightedId === 'Ombros' && muscle.id === 'deltoides') ||
                               (highlightedId === 'Core' && muscle.id === 'abs') ||
                               (highlightedId === 'Gluteo' && muscle.id === 'gluteos') ||
                               (highlightedId === 'Quadriceps' && muscle.id === 'quadriceps') ||
                               (['Isquiotibiais', 'Biceps Femoral'].includes(highlightedId || '') && muscle.id === 'isquiotibiais') ||
                               (highlightedId === 'Gastrocnemios' && muscle.id === 'panturrilhas') ||
                               (highlightedId === 'Costas' && ['latissimo', 'trapezio'].includes(muscle.id));

            // Biofeedback color: translucent gold or alert red
            const fill = isOverloaded 
              ? '#FF0000' 
              : vol > 0 
                ? `rgba(197, 160, 125, ${0.5 + (intensity * 0.5)})`
                : 'transparent';

            return (
              <path
                key={muscle.id}
                d={muscle.path}
                fill={fill}
                stroke={isHighlighted ? '#C5A07D' : 'transparent'}
                strokeWidth={isHighlighted ? "1.5" : "0"}
                className="transition-all duration-700"
                style={{ 
                  filter: (isHighlighted || isOverloaded) 
                    ? `drop-shadow(0 0 12px ${isOverloaded ? '#FF0000' : '#C5A07D'})` 
                    : 'none'
                }}
              />
            );
          })}
        </svg>

        {/* HUD Scanner Line */}
        <motion.div 
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-white/10 z-20 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-row lg:gap-24 gap-[6px] justify-center items-center py-2 sm:py-8 w-full max-w-5xl mx-auto">
      {renderView('front')}
      {renderView('back')}
    </div>
  );
};

export default AnatomicalModel;
