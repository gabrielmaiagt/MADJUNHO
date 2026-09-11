// Reports orders to Utmify's server-side Orders API, so paid PIX transactions
// show up as tracked/attributed conversions — the client-side pixel alone
// can't do this since PIX confirmation happens asynchronously, often after
// the visitor has closed the tab.
// Docs: https://docs.utmify.com.br/envio-de-vendas

export type UtmifyOrderStatus = 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback';

export type UtmifyTracking = {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
    src?: string | null;
    sck?: string | null;
};

export type UtmifyOrderInput = {
    orderId: string;
    status: UtmifyOrderStatus;
    createdAt: Date;
    approvedDate?: Date | null;
    customer: {
        name: string;
        email: string;
        phone?: string | null;
        document?: string | null;
    };
    productName: string;
    amountInCents: number;
    ip?: string | null;
    tracking?: UtmifyTracking | null;
};

function formatUtmifyDate(date: Date): string {
    // Utmify expects "YYYY-MM-DD HH:MM:SS" in UTC.
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function reportOrderToUtmify(input: UtmifyOrderInput): Promise<void> {
    const token = process.env.UTMIFY_API_TOKEN;
    if (!token) {
        console.warn('UTMIFY_API_TOKEN não configurado — pulando envio do pedido para a Utmify.');
        return;
    }

    const payload = {
        orderId: input.orderId,
        platform: 'Madames Online VIP',
        paymentMethod: 'pix',
        status: input.status,
        createdAt: formatUtmifyDate(input.createdAt),
        approvedDate: input.approvedDate ? formatUtmifyDate(input.approvedDate) : null,
        refundedAt: null,
        customer: {
            name: input.customer.name,
            email: input.customer.email,
            phone: input.customer.phone || null,
            document: input.customer.document || null,
            country: 'BR',
            ip: input.ip || '0.0.0.0',
        },
        products: [
            {
                id: 'default',
                name: input.productName,
                planId: null,
                planName: null,
                quantity: 1,
                priceInCents: input.amountInCents,
            },
        ],
        trackingParameters: {
            src: input.tracking?.src || null,
            sck: input.tracking?.sck || null,
            utm_source: input.tracking?.utm_source || null,
            utm_campaign: input.tracking?.utm_campaign || null,
            utm_medium: input.tracking?.utm_medium || null,
            utm_content: input.tracking?.utm_content || null,
            utm_term: input.tracking?.utm_term || null,
        },
        commission: {
            totalPriceInCents: input.amountInCents,
            gatewayFeeInCents: 0,
            userCommissionInCents: input.amountInCents,
            currency: 'BRL',
        },
        isTest: false,
    };

    try {
        const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-token': token,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            console.error('Erro ao reportar pedido para a Utmify:', response.status, errorBody);
        }
    } catch (error) {
        console.error('Falha ao conectar com a API da Utmify:', error);
    }
}

// Maps Frendz's payment_status values to Utmify's accepted order statuses.
// Frendz has a couple of extra states (processing, canceled) Utmify doesn't
// model directly — treat those as not worth reporting yet/at all.
export function mapFrendzStatusToUtmify(frendzStatus: string): UtmifyOrderStatus | null {
    switch (frendzStatus) {
        case 'waiting_payment':
            return 'waiting_payment';
        case 'paid':
            return 'paid';
        case 'refused':
            return 'refused';
        case 'refunded':
            return 'refunded';
        case 'chargedback':
            return 'chargedback';
        default:
            return null;
    }
}
