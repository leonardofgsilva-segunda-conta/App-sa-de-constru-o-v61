import { loadStripe, Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

/**
 * Standard lazy initialization for Stripe.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = async () => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!key) {
    console.warn("VITE_STRIPE_PUBLIC_KEY não encontrada.");
    return null;
  }
  
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export const handleCheckout = async (planId: string, email?: string) => {
  console.log(`[StripeService] Iniciando processo para: ${planId} | Email: ${email}`);
  
  try {
    const stripe = await getStripe();
    
    // Se a chave for a de fallback ou nula, avisamos em vez de crashar
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      alert('O sistema de pagamentos está em manutenção ou sem chaves configuradas.');
      return { success: false, message: 'Stripe não configurado no ambiente.' };
    }

    console.log('Enviando requisição para API de checkout...');
    
    // 2. Chamar o backend para criar uma Checkout Session
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, email }),
    });
    
    // Ler como texto primeiro para evitar "Unexpected end of JSON input"
    const text = await response.text();
    let data: any = {};
    
    try {
      if (text) {
        data = JSON.parse(text);
      }
    } catch (e) {
      console.error('[StripeService] Erro ao analisar JSON:', e, 'Texto recebido:', text);
      throw new Error('O servidor enviou uma resposta inválida (não-JSON).');
    }
    
    if (!response.ok) {
      const errorMessage = data.error || `O servidor retornou erro ${response.status}.`;
      throw new Error(errorMessage);
    }

    console.log('Resposta da Stripe:', data);

    if (!data || !data.url) {
      throw new Error('Formato de resposta inválido do servidor: URL de checkout ausente.');
    }

    // 3. Redirecionar para o Stripe Checkout
    console.log('Redirecionando para:', data.url);
    window.location.href = data.url;
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro no checkout Stripe:', error);
    toast.error(error.message || 'Erro ao processar pagamento.');
    return { success: false, message: error.message };
  }
};
