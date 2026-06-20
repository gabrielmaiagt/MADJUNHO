'use server';
/**
 * @fileOverview Analisa as interações do Tinder para fornecer feedback de namoro personalizado.
 *
 * - analyzeTinderInteractions - Uma função que analisa as interações do Tinder e fornece feedback.
 * - AnalyzeTinderInteractionsInput - O tipo de entrada para a função analyzeTinderInteractions.
 * - AnalyzeTinderInteractionsOutput - O tipo de retorno para a função analyzeTinderInteractions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTinderInteractionsInputSchema = z.object({
  tinderData: z
    .string()
    .describe(
      'Os dados de interação do Tinder fornecidos pelo usuário como uma string. Isso deve incluir mensagens e informações de perfil.'
    ),
});
export type AnalyzeTinderInteractionsInput = z.infer<
  typeof AnalyzeTinderInteractionsInputSchema
>;

const AnalyzeTinderInteractionsOutputSchema = z.object({
  overallImpression: z
    .string()
    .describe(
      'Uma visão geral e concisa (1-2 frases) da impressão geral da conversa.'
    ),
  strengths: z
    .array(z.string())
    .describe('Uma lista de 2 a 3 pontos fortes específicos da conversa.'),
  areasForImprovement: z
    .array(z.string())
    .describe(
      'Uma lista de 2 a 3 áreas específicas para melhoria na conversa.'
    ),
  concreteSuggestion: z
    .string()
    .describe(
      'Uma sugestão prática e acionável para o usuário aplicar na próxima conversa.'
    ),
});
export type AnalyzeTinderInteractionsOutput = z.infer<
  typeof AnalyzeTinderInteractionsOutputSchema
>;

export async function analyzeTinderInteractions(
  input: AnalyzeTinderInteractionsInput
): Promise<AnalyzeTinderInteractionsOutput> {
  return analyzeTinderInteractionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTinderInteractionsPrompt',
  input: {schema: AnalyzeTinderInteractionsInputSchema},
  output: {schema: AnalyzeTinderInteractionsOutputSchema},
  prompt: `Você é um coach de namoro especialista em comunicação, analisando as interações de um usuário no Tinder para fornecer feedback personalizado, construtivo e acionável. Seja encorajador e didático.

  Analise os seguintes dados do Tinder e forneça uma resposta estruturada.

  **Dados do Tinder Fornecidos pelo Usuário:**
  {{{tinderData}}}

  **Sua Análise Estruturada:**
  - **overallImpression**: Forneça uma impressão geral e rápida da conversa em 1 ou 2 frases.
  - **strengths**: Identifique de 2 a 3 pontos fortes claros. Ex: "Bom uso de perguntas abertas", "Mostrou humor de forma eficaz".
  - **areasForImprovement**: Identifique de 2 a 3 pontos fracos ou áreas para melhorar. Ex: "As respostas foram muito curtas", "Demorou para fazer uma pergunta de volta".
  - **concreteSuggestion**: Dê uma sugestão prática e específica que o usuário pode usar da próxima vez. Ex: "Tente espelhar o nível de detalhe da resposta dela e termine sempre com uma pergunta para manter a conversa fluindo".`,
});

const analyzeTinderInteractionsFlow = ai.defineFlow(
  {
    name: 'analyzeTinderInteractionsFlow',
    inputSchema: AnalyzeTinderInteractionsInputSchema,
    outputSchema: AnalyzeTinderInteractionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
