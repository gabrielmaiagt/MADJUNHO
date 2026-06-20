"use server";
/**
 * @fileOverview Analisa uma foto de perfil para um aplicativo de namoro.
 *
 * - analyzeProfilePhoto - Uma função que avalia a foto de um usuário.
 * - AnalyzeProfilePhotoInput - O tipo de entrada para a função.
 * - AnalyzeProfilePhotoOutput - O tipo de retorno para a função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ProfilePhotoAnalysis } from '@/lib/types';

const AnalyzeProfilePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto de perfil, como um data URI que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeProfilePhotoInput = z.infer<typeof AnalyzeProfilePhotoInputSchema>;

const AnalyzeProfilePhotoOutputSchema = z.object({
  isGoodPhoto: z.boolean().describe('Se a foto é ou não uma boa escolha para um perfil de namoro.'),
  feedback: z.string().describe('Uma análise curta dos pontos fortes e fracos da foto.'),
  suggestion: z.string().describe('Uma sugestão prática de como melhorar a foto ou que tipo de foto usar em vez dela.'),
});
export type AnalyzeProfilePhotoOutput = z.infer<typeof AnalyzeProfilePhotoOutputSchema>;

export async function analyzeProfilePhoto(input: AnalyzeProfilePhotoInput): Promise<ProfilePhotoAnalysis> {
  return analyzeProfilePhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeProfilePhotoPrompt',
  input: { schema: AnalyzeProfilePhotoInputSchema },
  output: { schema: AnalyzeProfilePhotoOutputSchema },
  prompt: `Você é um especialista em fotografia e coach de namoro. Sua tarefa é analisar uma foto de perfil para um aplicativo de namoro como o Tinder.

  Analise a foto fornecida e determine se ela é uma boa escolha. Considere fatores como:
  - Qualidade da imagem (iluminação, clareza, foco)
  - Composição (plano de fundo, enquadramento)
  - Expressão facial (sorriso, contato visual)
  - O que a foto comunica (hobbies, personalidade, se é uma foto em grupo, etc.)
  - Vibrações gerais (amigável, intimidador, misterioso, etc.)

  Forneça uma resposta estruturada:
  1.  **isGoodPhoto**: Um booleano (true/false). Defina como 'true' se for uma foto decente a ótima, e 'false' se for ruim ou tiver grandes problemas.
  2.  **feedback**: Um feedback curto (2-3 frases) explicando por que você deu essa avaliação. Seja direto e construtivo.
  3.  **suggestion**: Uma sugestão curta e prática (1-2 frases) para o usuário. Se a foto for ruim, sugira uma alternativa clara (ex: "Tente uma foto bem iluminada sorrindo diretamente para a câmera"). Se a foto for boa, sugira como torná-la ainda melhor ou que outra foto complementar ela poderia ter.

  Foto para analisar:
  {{media url=photoDataUri}}`,
});

const analyzeProfilePhotoFlow = ai.defineFlow(
  {
    name: 'analyzeProfilePhotoFlow',
    inputSchema: AnalyzeProfilePhotoInputSchema,
    outputSchema: AnalyzeProfilePhotoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
