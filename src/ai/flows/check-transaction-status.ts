
"use server";
/**
 * @fileOverview Checks the status of a PIX transaction using the BuckPay API.
 */

export type CheckTransactionStatusInput = {
  transactionId: string;
};

export type CheckTransactionStatusOutput = {
  status: string;
};

export async function checkTransactionStatus(input: CheckTransactionStatusInput): Promise<CheckTransactionStatusOutput> {
    const token = process.env.BUCKPAY_API_KEY!;
    const userAgent = "Buckpay API";
    
    // Using the external_id endpoint as per BuckPay documentation
    const queryUrl = `https://api.realtechdev.com.br/v1/transactions/external_id/${input.transactionId}`;

    try {
      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': userAgent,
        },
      });

      if (!response.ok) {
        if (response.status === 404) return { status: 'pending' };
        return { status: 'error' };
      }

      const responseData = await response.json();
      return {
        status: responseData.data?.status || 'pending',
      };

    } catch (error: any) {
      console.error('Check status error:', error.message);
      return { status: 'pending' };
    }
}
