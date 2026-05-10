export async function suggestWorkoutAdjustment(lesao: string, workoutName: string, exercises: any[]) {
  // Garantir que não tentamos usar o SDK diretamente no navegador para evitar erros de API Key
  try {
    const prompt = `Como um especialista em biomecânica e fisiologia do exercício, sugira ajustes para um treino.
  
O aluno possui a seguinte lesão ou limitação: "${lesao}".
O treino atual é: "${workoutName}".
Exercícios prescritos: ${exercises.map(ex => ex.name).join(', ')}.

Por favor, forneça:
1. Uma breve explicação dos riscos mecânicos para esta lesão com esses exercícios.
2. Sugestões de substituição ou adaptação para os exercícios que podem ser prejudiciais.
3. Orientações de segurança.

Seja conciso, profissional e use um tom encorajador. Responda em Português do Brasil.`;

    // Usamos sempre a rota de API do servidor para segurança
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.warn("Servidor de IA retornou erro:", response.status);
      return "Não foi possível gerar uma sugestão automática no momento. Consulte seu professor.";
    }

    const data = await response.json();
    return data.text || "Não foi possível gerar uma sugestão automática no momento.";
  } catch (error) {
    console.warn("Erro ao processar solicitação de IA:", error);
    return "Não foi possível gerar uma sugestão automática no momento. Consulte seu professor.";
  }
}

export async function generateWorkoutSummary(workoutName: string, exercises: any[], cyclePhase: string) {
  try {
    const prompt = `Como um treinador de alta performance, gere um resumo técnico e específico para o treino do dia.

DADOS REAIS:
- Identificação: ${workoutName}
- Fase/Período Atual: ${cyclePhase}
- Exercícios: ${exercises.map(ex => ex.name).join(', ')}

REGRAS OBRIGATÓRIAS:
1. Mapeie os exercícios para os grupos musculares:
   - Supino, crucifixo, crossover, peck deck, voador, inclinado, declinado -> peitorais
   - Puxada, remada, barra, pulldown -> dorsal/costas
   - Rosca -> bíceps braquial
   - Tríceps, pulley, testa, francês -> tríceps
   - Desenvolvimento, elevação lateral, elevação frontal -> ombros/trapézio
   - Agachamento, leg press, extensora -> quadríceps/glúteos
   - Flexora, stiff, terra romeno -> bíceps femoral/glúteos
   - Panturrilha -> gastrocnêmios/sóleo
   - Prancha, abdominal, crunch -> core/abdômen

2. ANALISE A FASE: Adaptação, hipertrofia, força, resistência, performance, recuperação, choque, potência, base, específico ou manutenção. Ajuste o tom técnico para esta fase.

3. ESTRUTURA:
   - Identifique os músculos principais baseados nos exercícios acima.
   - Relacione o estímulo principal com a fase atual (${cyclePhase}).
   - MÁXIMO 4 linhas. Texto profissional, direto, sem jargões motivacionais genéricos.
   - NÃO use emojis.
   - Justifique a importância da execução ou intensidade baseada na fase.

4. VARIAÇÃO: Varie as aberturas. Não use "O treino de hoje foca...". Use "Esta sessão ativa...", "O foco recai sobre...", "Trabalharemos hoje...", etc.

5. FALLBACK: Se não houver exercícios, responda: "Resumo indisponível para este treino."`;

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) return "Treino focado na execução técnica e controle muscular dentro da fase atual do ciclo.";
    const data = await response.json();
    return data.text || "Treino focado na execução técnica e controle muscular dentro da fase atual do ciclo.";
  } catch (error) {
    return "Treino focado na execução técnica e controle muscular dentro da fase atual do ciclo.";
  }
}
