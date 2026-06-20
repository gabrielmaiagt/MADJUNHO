'use server';
/**
 * @fileOverview Analisa a resposta de um usuário em um desafio de conversa gamificado.
 *
 * - analyzeChallengeResponse - Uma função que avalia a resposta de um usuário a uma mensagem de cenário.
 * - AnalyzeChallengeResponseInput - O tipo de entrada para a função.
 * - AnalyzeChallengeResponseOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeChallengeResponseInputSchema = z.object({
  message: z.string().describe('A mensagem original do "match" no cenário.'),
  response: z.string().describe('A resposta que o usuário escolheu.'),
});
export type AnalyzeChallengeResponseInput = z.infer<
  typeof AnalyzeChallengeResponseInputSchema
>;

const AnalyzeChallengeResponseOutputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe(
      'Uma pontuação de 0 a 10 para a resposta, onde 10 é a melhor.'
    ),
  analysis: z
    .string()
    .describe(
      'Uma análise curta e construtiva da resposta, explicando a pontuação. Seja direto, use uma linguagem encorajadora e atue como um mentor. Explique o *porquê* da pontuação e sugira uma alternativa melhor, se aplicável.'
    ),
});
export type AnalyzeChallengeResponseOutput = z.infer<
  typeof AnalyzeChallengeResponseOutputSchema
>;

export async function analyzeChallengeResponse(
  input: AnalyzeChallengeResponseInput
): Promise<AnalyzeChallengeResponseOutput> {
  return analyzeChallengeResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeChallengeResponsePrompt',
  input: {schema: AnalyzeChallengeResponseInputSchema},
  output: {schema: AnalyzeChallengeResponseOutputSchema},
  prompt: `Você é um coach de namoro e está atuando como um mentor, avaliando a resposta de um usuário em um cenário de um aplicativo de namoro. Seja solidário, direto ao ponto e didático.

  Cenário:
  - Mensagem do Match: "{{{message}}}"
  - Resposta do Usuário: "{{{response}}}"

  Sua tarefa é analisar a "Resposta do Usuário" e fornecer:
  1.  Uma pontuação de 0 a 10. Considere fatores como: manter a conversa fluindo, mostrar personalidade, fazer perguntas abertas, ser genérico vs. específico, e o nível de esforço.
  2.  Uma análise curta (2-4 frases) explicando a pontuação. Foque no *porquê* a resposta foi boa ou ruim e, se for o caso, ofereça uma alternativa clara e explique por que ela seria melhor. O objetivo é ajudar o usuário a aprender o conceito, não apenas dizer se ele acertou ou errou.`,
});

const analyzeChallengeResponseFlow = ai.defineFlow(
  {
    name: 'analyzeChallengeResponseFlow',
    inputSchema: AnalyzeChallengeResponseInputSchema,
    outputSchema: AnalyzeChallengeResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
