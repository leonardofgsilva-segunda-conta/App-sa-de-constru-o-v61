import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Configuração do Gemini
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) 
  : null;

// Configuração do Stripe
// A chave secreta NUNCA deve ser exposta no frontend
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

app.use(express.json());

// API: Proxy para o Gemini AI
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt, model = "gemini-3-flash-preview" } = req.body;

    if (!genAI) {
      console.warn("GEMINI_API_KEY não configurada no servidor.");
      return res.status(503).json({ 
        error: "Serviço de IA temporariamente indisponível no servidor.",
        code: "MISSING_API_KEY"
      });
    }

    if (!prompt) {
      return res.status(400).json({ error: "O prompt é obrigatório." });
    }

    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na API Gemini do servidor:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Nova rota unificada de checkout compatível com o frontend
app.post("/api/checkout", async (req, res) => {
  console.log(`[API Checkout] Iniciando para o plano: ${req.body.planId}`);
  try {
    const { planId, email } = req.body;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      console.error("[API Checkout] ERRO: STRIPE_SECRET_KEY não encontrada.");
      return res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada no servidor." });
    }

    const stripeInstance = new Stripe(stripeKey);

    if (planId === 'gratis') {
      return res.status(200).json({ url: '/dashboard?status=success' });
    }

    // Mapeamento
    const priceMapping: Record<string, string> = {
      'semestral': 'prod_UQCerRVLv0omZc',
      'anual': 'prod_UQCfrq3CxOI4yP'
    };

    const productId = priceMapping[planId];
    
    if (!productId) {
      console.error(`[API Checkout] ERRO: Plano inválido: ${planId}`);
      return res.status(400).json({ error: `O plano '${planId}' não é válido para cobrança.` });
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product: productId,
            unit_amount: planId === 'semestral' ? 5990 : 3990,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: email,
      success_url: `${req.headers.origin}/dashboard?status=success&plan=${planId}`,
      cancel_url: `${req.headers.origin}/checkout-planos`,
    });

    console.log(`[API Checkout] Sucesso! Sessão: ${session.id}`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("[API Checkout] Erro interno:", error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: error.message || "Erro ao criar checkout" });
  }
});

// API: Criar Sessão de Checkout (Legado - mantido para compatibilidade temporária)
app.post("/api/create-checkout-session", async (req, res) => {
  console.log(`[API] Recebida solicitação de checkout para: ${req.body.planId}`);
  try {
    const { planId, email } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[API] STRIPE_SECRET_KEY não encontrada nas variáveis de ambiente.");
      return res.status(500).json({ 
        error: "Erro de configuração: STRIPE_SECRET_KEY ausente no servidor." 
      });
    }

    // Mapeamento de IDs de planos para IDs de Produtos do Stripe
    const priceMapping: Record<string, string> = {
      'semestral': 'prod_UQCerRVLv0omZc',
      'anual': 'prod_UQCfrq3CxOI4yP'
    };

    const priceId = priceMapping[planId];
    console.log(`[API] Mapeamento do plano ${planId} -> ${priceId}`);
    
    if (planId === 'gratis') {
      console.log("[API] Plano grátis selecionado, redirecionando para dashboard.");
      return res.json({ url: '/dashboard?status=success' });
    }

    if (!priceId) {
      console.error(`[API] Plano não reconhecido: ${planId}`);
      return res.status(400).json({ error: `Plano '${planId}' não é válido para cobrança.` });
    }

    console.log("[API] Criando sessão no Stripe...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product: priceId,
            unit_amount: planId === 'semestral' ? 5990 : 3990, 
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: email,
      success_url: `${req.headers.origin}/dashboard?status=success&plan=${planId}`,
      cancel_url: `${req.headers.origin}/checkout-planos`,
    });

    console.log(`[API] Sessão criada com sucesso: ${session.id}`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("[API] Erro interno ao criar sessão Stripe:", error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: error.message || "Erro interno ao processar stripe checkout." 
    });
  }
});

// Configuração do Vite Middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*all", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor NEXO rodando em http://localhost:${PORT}`);
});
