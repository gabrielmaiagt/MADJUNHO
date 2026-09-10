
"use server";
/**
 * @fileOverview Checks the status of a PIX transaction using the Frendz API.
 */

export type CheckTransactionStatusInput = {
  transactionId: string;
};

export type CheckTransactionStatusOutput = {
  status: string;
};

// Normalizes Frendz's `payment_status` values to the status vocabulary the
// checkout UI understands ('pending' | 'paid' | 'failed' | 'refunded').
function normalizeStatus(paymentStatus: string | undefined): string {
  switch (paymentStatus) {
    case 'paid':
      return 'paid';
    case 'refunded':
      return 'refunded';
    case 'refused':
    case 'canceled':
    case 'chargedback':
      return 'failed';
    default:
      return 'pending';
  }
}

export async function checkTransactionStatus(input: CheckTransactionStatusInput): Promise<CheckTransactionStatusOutput> {
    const token = process.env.FRENDZ_API_TOKEN!;

    const queryUrl = `https://api.frendz.com.br/api/public/v1/transactions/${input.transactionId}?api_token=${token}`;

    try {
      const response = await fetch(queryUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) return { status: 'pending' };
        return { status: 'error' };
      }

      const responseData = await response.json();
      return {
        status: normalizeStatus(responseData.payment_status),
      };

    } catch (error: any) {
      console.error('Check status error:', error.message);
      return { status: 'pending' };
    }
}
