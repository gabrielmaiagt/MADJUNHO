
import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/ai/flows/process-webhook';
import { config } from 'dotenv';

export async function POST(req: NextRequest) {
  // Explicitly load environment variables at the start of the request.
  config();

  try {
    const body = await req.json();
    
    // Passar as credenciais diretamente para o fluxo
    await processWebhook({
        body: body,
        firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY
    });
    
    return NextResponse.json({ received: true, message: 'Webhook processado.' });
  } catch (error: any) {
    console.error('Erro ao processar a requisição do webhook:', error);
    const details = error.details || error.message || 'Erro desconhecido.';
    console.error('Payload do erro:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Erro ao processar a requisição.', details: details }, { status: 500 });
  }
}

// Lidando com outros métodos HTTP para retornar 'Method Not Allowed'.
export async function GET() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}
