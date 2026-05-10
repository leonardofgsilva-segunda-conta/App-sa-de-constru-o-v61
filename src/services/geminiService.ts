export const geminiService = {
  askAI: async (prompt: string, model: string = "gemini-1.5-flash") => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      });

      const text = await response.text();
      let data: any = {};
      
      try {
        if (text) {
          data = JSON.parse(text);
        }
      } catch (e) {
        console.error("[geminiService] Erro ao analisar JSON:", e, "Texto recebido:", text);
        throw new Error('O servidor enviou uma resposta inválida (IA).');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar IA no servidor.');
      }

      return data.text;
    } catch (error) {
      console.error("Gemini Proxy Error:", error);
      throw error;
    }
  },

  suggestTrainingAdjustments: async (injury: string, currentGoal: string, biofeedback?: { painLevel: number, location: string, notes: string }) => {
    try {
      let prompt = `Como um especialista em fisiologia do exercício e biomecânica, sugira ajustes e precauções para um treino baseado na seguinte lesão/condição: "${injury}". O objetivo do aluno é: "${currentGoal}".`;
      
      if (biofeedback) {
        prompt += `\n\nContexto imediato (Biofeedback de hoje): O aluno relatou nível de dor ${biofeedback.painLevel}/10 na região de ${biofeedback.location}. Notas do aluno: "${biofeedback.notes}".`;
      }

      prompt += `\n\nForneça dicas práticas e exercícios que devem ser evitados ou modificados especificamente para a sessão de amanhã. Responda em português de forma concisa (máximo 3 parágrafos) e profissional.`;

      return await geminiService.askAI(prompt);
    } catch (error: any) {
      if (error.message.includes('API_KEY')) {
        return "Serviço de IA indisponível: Chave de API não configurada no servidor.";
      }
      return "Erro ao processar sugestão da IA. Por favor, tente novamente mais tarde.";
    }
  }
};
