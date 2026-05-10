import Stripe from "stripe";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { planId } = req.body;
  console.log(`[API Checkout] Iniciando checkout para o plano: ${planId}`);

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("[API Checkout] ERRO: STRIPE_SECRET_KEY não configurada.");
      return res.status(500).json({ error: "Configuração do Stripe ausente no servidor." });
    }

    const stripe = new Stripe(stripeKey);

    // Mapeamento de IDs de Produtos do Stripe (ajustados para o seu projeto)
    const priceMapping: Record<string, string> = {
      'semestral': 'prod_UQCerRVLv0omZc',
      'anual': 'prod_UQCfrq3CxOI4yP'
    };

    if (planId === 'gratis') {
       return res.status(200).json({ url: '/dashboard?status=success' });
    }

    const productId = priceMapping[planId as keyof typeof priceMapping];
    
    if (!productId) {
      console.error(`[API Checkout] ERRO: Plano inválido: ${planId}`);
      return res.status(400).json({ error: "Plano selecionado inválido para checkout." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product: productId,
            unit_amount: planId === 'semestral' ? 5990 : 3990, // Valores exemplo em centavos
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.origin}/dashboard?status=success&plan=${planId}`,
      cancel_url: `${req.headers.origin}/checkout-planos`,
    });

    console.log(`[API Checkout] Sucesso! Sessão criada: ${session.id}`);
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("[API Checkout] Erro interno:", error);
    return res.status(500).json({ 
      error: error.message || "Erro ao processar o checkout do Stripe." 
    });
  }
}
