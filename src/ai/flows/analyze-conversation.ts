"use server";
/**
 * @fileOverview Analyzes a screenshot of a dating app conversation.
 *
 * - analyzeConversation - A function that evaluates a conversation screenshot and provides advice.
 * - AnalyzeConversationInput - The input type for the function.
 * - AnalyzeConversationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeConversationInputSchema = z.object({
  screenshotDataUri: z
    .string()
    .describe(
      "A screenshot of a conversation, as a data URI that must include a MIME type and use Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeConversationInput = z.infer<typeof AnalyzeConversationInputSchema>;

const AnalyzeConversationOutputSchema = z.object({
  analysis: z.string().describe("Uma análise curta e direta do estado atual da conversa. Identifique o tom, o nível de interesse e possíveis oportunidades ou erros."),
  suggestion: z.string().describe("Uma sugestão concreta e acionável para a próxima mensagem do usuário. Forneça uma frase ou pergunta específica para enviar."),
  nextStep: z.string().describe("Explique o objetivo de curto prazo da sugestão. Ex: 'Para reengajar o interesse dela', 'Para levar a conversa para marcar um encontro'."),
});
export type AnalyzeConversationOutput = z.infer<typeof AnalyzeConversationOutputSchema>;


export async function analyzeConversation(input: AnalyzeConversationInput): Promise<AnalyzeConversationOutput> {
  return analyzeConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeConversationPrompt',
  input: { schema: AnalyzeConversationInputSchema },
  output: { schema: AnalyzeConversationOutputSchema },
  prompt: `Você é um coach de namoro e especialista em comunicação, com uma pegada casual e direta, como um amigo experiente. Sua tarefa é analisar um screenshot de uma conversa de aplicativo de namoro (como o Tinder) e fornecer um conselho rápido, humano e eficaz.

  O usuário que pede ajuda é quem envia as mensagens na direita (geralmente em balões azuis ou verdes).

  Analise a imagem, prestando atenção no ritmo, no conteúdo das mensagens e no interesse demonstrado por ambas as partes.

  Forneça uma resposta estruturada com um tom casual e encorajador:
  1.  **analysis**: Dê um diagnóstico rápido e sincero da situação (2-3 frases). Use uma linguagem de amigo para amigo. Ex: "Cara, a conversa deu uma esfriada, parece que ela tá respondendo só por educação. Bora virar esse jogo." ou "Boa! Você fez ela rir e a conexão tá rolando. Ela tá na sua."
  2.  **suggestion**: Dê uma sugestão de mensagem PRONTA, criativa e que gere curiosidade. Fuja do óbvio. Ex: "Ao invés do 'tudo bem?', manda: 'Passei por um lugar hoje que me lembrou na hora o seu sorriso. Chuta onde foi.'" ou "Manda essa: 'Seu perfil tem um detalhe que 99% dos caras não notaram. Quer saber qual é?'"
  3.  **nextStep**: Explique a estratégia por trás da sua sugestão de forma simples (1-2 frases). Ex: "O objetivo aqui é quebrar o piloto automático e fazer ela pensar em você." ou "Isso cria um gancho perfeito pra aprofundar o papo e sair do superficial."

  Screenshot para analisar:
  {{media url=screenshotDataUri}}`,
});

const analyzeConversationFlow = ai.defineFlow(
  {
    name: 'analyzeConversationFlow',
    inputSchema: AnalyzeConversationInputSchema,
    outputSchema: AnalyzeConversationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
