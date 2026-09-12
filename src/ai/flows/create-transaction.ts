
"use server";
/**
 * @fileOverview Creates a PIX transaction using the Frendz API with randomized buyer data.
 */

import type { TransactionData } from '@/lib/types';

export type CreateTransactionInput = {
  amount: number;
  tracking?: {
      utm_source?: string | null;
      utm_medium?: string | null;
      utm_campaign?: string | null;
      utm_id?: string | null;
      utm_term?: string | null;
      utm_content?: string | null;
      ref?: string | null;
      src?: string | null;
      sck?: string | null;
      utmify_visitor_id?: string | null;
  };
  productName?: string;
  source?: string;
};

function generateRandomBuyer() {
    const nomes = ['Ana', 'Carlos', 'Maria', 'Pedro', 'Julia', 'Lucas', 'Fernanda', 'Rafael', 'Camila', 'Bruno', 'Luciana', 'Ricardo', 'Beatriz', 'Marcos', 'Larissa'];
    const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Almeida', 'Ribeiro', 'Barbosa', 'Carvalho', 'Mendes', 'Teixeira'];

    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    const name = `${nome} ${sobrenome}`;

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `cliente_${timestamp}_${randomStr}@mail.com`;

    // CPF fixo conforme solicitado
    const document = "24987584026";

    // Telefone aleatório: DDD + 9 + 8 dígitos (total 11 caracteres, sem DDI)
    const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '27'];
    const ddd = ddds[Math.floor(Math.random() * ddds.length)];
    const randomPhone = Math.floor(10000000 + Math.random() * 90000000);
    const phone = `${ddd}9${randomPhone}`;

    return { name, email, document, phone };
}

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionData> {
    const token = process.env.FRENDZ_API_TOKEN!;
    const productHash = process.env.FRENDZ_PRODUCT_HASH!;
    const offerHash = process.env.FRENDZ_OFFER_HASH!;
    const amountInCents = Math.round((input.amount || 0) * 100);

    const buyer = generateRandomBuyer();

    const body = {
      amount: amountInCents,
      offer_hash: offerHash,
      payment_method: "pix",
      customer: {
        name: buyer.name,
        email: buyer.email,
        phone_number: buyer.phone,
        document: buyer.document,
      },
      cart: [
        {
          product_hash: productHash,
          title: (input.productName || "Presente").substring(0, 100),
          price: amountInCents,
          quantity: 1,
          operation_type: 1,
          tangible: false,
        },
      ],
      expire_in_days: 1,
      transaction_origin: "api",
      tracking: {
        ref: input.tracking?.ref || null,
        src: input.tracking?.src || null,
        sck: input.tracking?.sck || null,
        utm_source: input.tracking?.utm_source || null,
        utm_medium: input.tracking?.utm_medium || null,
        utm_campaign: input.tracking?.utm_campaign || null,
        utm_id: input.tracking?.utm_id || null,
        utm_term: input.tracking?.utm_term || null,
        utm_content: input.tracking?.utm_content || null,
        utmify_visitor_id: input.tracking?.utmify_visitor_id || null,
      },
      postback_url: "https://appdomadames.netlify.app/api/webhook",
    };

    try {
      const response = await fetch(`https://api.frendz.com.br/api/public/v1/transactions?api_token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Frendz API Error Response:', JSON.stringify(responseData, null, 2));
        throw new Error(responseData.message || 'Erro na API Frendz');
      }

      if (!responseData.hash || !responseData.pix) {
        throw new Error('Resposta da API Frendz em formato inesperado');
      }

      return {
        id: responseData.hash,
        status: responseData.payment_status || 'waiting_payment',
        pix: {
          payload: responseData.pix.pix_qr_code,
          qr_code_base64: responseData.pix.qr_code_base64 || null,
        },
      };

    } catch (error: any) {
      console.error('Server Action Error (createTransaction):', error.message);
      throw new Error(error.message || 'Falha ao processar pagamento');
    }
}
