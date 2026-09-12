
"use server";

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { forwardFrendzWebhookToUtmify } from '@/lib/utmify';

const WebhookInputSchema = z.object({
    body: z.any(),
    firebaseClientEmail: z.string().optional(),
    firebasePrivateKey: z.string().optional(),
});

export const processWebhook = ai.defineFlow(
    {
        name: 'processWebhook',
        inputSchema: WebhookInputSchema,
        outputSchema: z.void(),
    },
    async ({ body }) => {
        try {
            const { db } = getFirebaseAdmin();

            const webhookLogRef = db.collection('webhook_logs').doc();
            await webhookLogRef.set({
                payload: body,
                receivedAt: FieldValue.serverTimestamp()
            });

            // Frendz posta o próprio objeto da transação (sem envelope "event"/"data").
            const status = body.payment_status;
            const externalId = body.hash || body.id;
            const amountInBRL = body.amount ? body.amount / 100 : 0;

            console.log('Webhook Frendz recebido:', externalId, status);

            const analyticsRef = db.collection('analytics').doc('summary');

            if (status === 'waiting_payment') {
                await analyticsRef.set({ 'events.generate_pix': FieldValue.increment(1) }, { merge: true });
            } else if (status === 'paid') {
                console.log(`✅ Pagamento APROVADO: ${externalId} no valor de ${amountInBRL} BRL.`);

                const firestoreUpdate: { [key: string]: any } = {
                    'events.pix_paid': FieldValue.increment(1),
                    'events.pix_paid_amount': FieldValue.increment(amountInBRL),
                };

                await analyticsRef.set(firestoreUpdate, { merge: true });

                const paidTransactionRef = db.collection('paidTransactions').doc(String(externalId));
                await paidTransactionRef.set({
                    paidAt: FieldValue.serverTimestamp(),
                    amount: amountInBRL,
                    visitorId: null,
                });
            }

            // Relay the exact same payload to Utmify's Frendz-specific webhook
            // endpoint — it already knows how to parse this shape, UTMs included.
            await forwardFrendzWebhookToUtmify(body);
        } catch (error: any) {
            console.error('Erro no fluxo processWebhook:', error);
            throw error;
        }
    }
);
