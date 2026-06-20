
"use server";
/**
 * @fileOverview Creates a PIX transaction using the BuckPay API with randomized buyer data.
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
    
    // Telefone aleatório: 55 + DDD + 9 + 8 dígitos (total 13 caracteres)
    const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '27'];
    const ddd = ddds[Math.floor(Math.random() * ddds.length)];
    const randomPhone = Math.floor(10000000 + Math.random() * 90000000); 
    const phone = `55${ddd}9${randomPhone}`;
    
    return { name, email, document, phone };
}

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionData> {
    const token = process.env.BUCKPAY_API_KEY!;
    const userAgent = "Buckpay API";
    const externalId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const buyer = generateRandomBuyer();

    const body = {
      external_id: externalId,
      payment_method: "pix",
      amount: Math.round((input.amount || 0) * 100),
      buyer: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        document: buyer.document
      },
      product: {
        id: (input.productName || "app-upgrade").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-'),
        name: (input.productName || "Upgrade App").substring(0, 100)
      },
      offer: {
        id: (input.source || "default").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: (input.productName || "Oferta Especial").substring(0, 100),
        quantity: 1
      },
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
        utmify_visitor_id: input.tracking?.utmify_visitor_id || null
      }
    };

    try {
      const response = await fetch('https://api.realtechdev.com.br/v1/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': userAgent,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('BuckPay API Error Response:', JSON.stringify(responseData, null, 2));
        throw new Error(responseData.error?.message || responseData.message || 'Erro na API BuckPay');
      }
      
      if (!responseData.data || !responseData.data.pix) {
        throw new Error('Resposta da API BuckPay em formato inesperado');
      }

      return {
        id: responseData.data.id, // Use the real BuckPay ID for polling
        status: responseData.data.status || 'pending',
        pix: {
          payload: responseData.data.pix.code,
          qr_code_base64: responseData.data.pix.qrcode_base64 || null,
        },
      };

    } catch (error: any) {
      console.error('Server Action Error (createTransaction):', error.message);
      throw new Error(error.message || 'Falha ao processar pagamento');
    }
}
