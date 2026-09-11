
"use server";

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { reportOrderToUtmify, mapFrendzStatusToUtmify } from '@/lib/utmify';

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

            // Report the status change to Utmify, using the tracking/customer
            // context saved when the transaction was created (Frendz's webhook
            // payload itself carries no UTM data).
            const utmifyStatus = mapFrendzStatusToUtmify(status);
            if (externalId && utmifyStatus) {
                try {
                    const pendingRef = db.collection('pendingTransactions').doc(String(externalId));
                    const pendingSnap = await pendingRef.get();
                    if (pendingSnap.exists) {
                        const pending = pendingSnap.data()!;
                        await reportOrderToUtmify({
                            orderId: String(externalId),
                            status: utmifyStatus,
                            createdAt: pending.createdAt?.toDate ? pending.createdAt.toDate() : new Date(),
                            approvedDate: status === 'paid' ? new Date() : null,
                            customer: pending.customer || { name: 'Cliente', email: 'cliente@mail.com' },
                            productName: pending.productName || 'Produto',
                            amountInCents: pending.amount || Math.round(amountInBRL * 100),
                            ip: pending.ip || null,
                            tracking: pending.tracking || null,
                        });
                    } else {
                        console.warn('Nenhuma pendingTransaction encontrada para reportar à Utmify:', externalId);
                    }
                } catch (utmifyError: any) {
                    console.error('Falha ao reportar status para a Utmify:', utmifyError.message);
                }
            }
        } catch (error: any) {
            console.error('Erro no fluxo processWebhook:', error);
            throw error;
        }
    }
);
