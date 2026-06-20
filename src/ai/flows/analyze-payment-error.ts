
"use server";
/**
 * @fileOverview Analyzes a payment error message from the BuckPay API.
 *
 * - analyzePaymentError - A function that interprets the error and suggests a solution.
 * - AnalyzePaymentErrorInput - The input type for the function.
 * - AnalyzePaymentErrorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzePaymentErrorInputSchema = z.object({
  errorMessage: z.string().describe("The full error message returned by the BuckPay API integration."),
});
export type AnalyzePaymentErrorInput = z.infer<typeof AnalyzePaymentErrorInputSchema>;

const AnalyzePaymentErrorOutputSchema = z.object({
  analysis: z.string().describe("A clear, concise analysis of what the error message means in the context of the application."),
  possibleCause: z.string().describe("The most likely root cause of the error."),
  suggestion: z.string().describe("A concrete, actionable suggestion for the developer to fix the issue."),
});
export type AnalyzePaymentErrorOutput = z.infer<typeof AnalyzePaymentErrorOutputSchema>;

export async function analyzePaymentError(input: AnalyzePaymentErrorInput): Promise<AnalyzePaymentErrorOutput> {
  return analyzePaymentErrorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePaymentErrorPrompt',
  input: { schema: AnalyzePaymentErrorInputSchema },
  output: { schema: AnalyzePaymentErrorOutputSchema },
  prompt: `You are an expert developer specializing in the "BuckPay" payment gateway API. You are debugging an integration within a Next.js application.

Your task is to analyze the provided error message and give a clear, actionable diagnosis for another developer.

**Context of the Application:**
- The application uses the BuckPay API to create PIX transactions.
- Authentication uses 'Authorization: Bearer <token>' and a specific 'User-Agent: Buckpay API'.
- The code sends 'external_id', 'amount' (in cents), and a 'buyer' object.
- The 'buyer' object must have 'name' (min 3 chars), 'email'. 'phone' must be 12-13 digits starting with 55.
- Tracking fields (ref, src, sck, etc.) are also sent and must follow string/null constraints.

**Error Message to Analyze:**
'''
{{{errorMessage}}}
'''

**Analysis Steps:**
1.  **Analyze the Error:** Based on the message, what happened? Is it "Unauthorized" (401), "Bad Request" (400) - like 'transaction_already_exists', or a validation error in 'buyer' or 'tracking'?
2.  **Identify the Likely Cause:**
    *   If the error is **"Unauthorized" (401)**: The Bearer token is likely wrong, or the User-Agent header is missing/incorrect.
    *   If the error is **"Bad Request" (400)**: Check if 'amount' is an integer, if 'phone' has the correct format (55 + DDD + number), or if the 'buyer.name' is at least 3 characters.
    *   If the error is **"Forbidden" (403)**: The account status might be blocked or pending.
3.  **Formulate a Suggestion:** Provide a clear, step-by-step action the developer should take.

**Your Output (in Portuguese):**
Provide a structured response. Be direct and helpful.

- **analysis**: Explique o que o erro significa em termos simples.
- **possibleCause**: Indique a causa mais provável para o erro.
- **suggestion**: Dê um próximo passo concreto. Exemplo: "O erro 400 indica que o nome do comprador é muito curto. Garanta que o campo 'buyer.name' tenha pelo menos 3 caracteres." ou "O token Bearer pode estar incorreto ou expirado."
`,
});

const analyzePaymentErrorFlow = ai.defineFlow(
  {
    name: 'analyzePaymentErrorFlow',
    inputSchema: AnalyzePaymentErrorInputSchema,
    outputSchema: AnalyzePaymentErrorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
