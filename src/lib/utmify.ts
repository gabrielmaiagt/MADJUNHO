// Relays Frendz's own webhook payload to Utmify's dedicated Frendz webhook
// endpoint, so paid PIX transactions show up as tracked/attributed
// conversions. Utmify built this endpoint specifically to parse Frendz's
// webhook shape (including the UTM fields Frendz already stores per
// transaction), so we don't need to reconstruct an order payload ourselves —
// just forward the exact same body Frendz sent us.

export async function forwardFrendzWebhookToUtmify(body: unknown): Promise<void> {
    const url = process.env.UTMIFY_FRENDZ_WEBHOOK_URL;
    if (!url) {
        console.warn('UTMIFY_FRENDZ_WEBHOOK_URL não configurado — pulando repasse do webhook para a Utmify.');
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            console.error('Erro ao repassar webhook para a Utmify:', response.status, errorBody);
        }
    } catch (error) {
        console.error('Falha ao conectar com o webhook da Utmify:', error);
    }
}
