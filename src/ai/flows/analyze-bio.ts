
"use server";
/**
 * @fileOverview Analyzes a dating app bio.
 *
 * - analyzeBio - A function that evaluates a user's bio.
 * - AnalyzeBioInput - The input type for the function.
 * - AnalyzeBioOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeBioInputSchema = z.object({
  bio: z.string().describe("The user's dating app bio."),
});
export type AnalyzeBioInput = z.infer<typeof AnalyzeBioInputSchema>;

const AnalyzeBioOutputSchema = z.object({
  score: z.number().min(0).max(10).describe('A score from 0 to 10 for the bio, where 10 is best.'),
  feedback: z.string().describe("A short, constructive analysis of the bio's strengths and weaknesses."),
  suggestion: z.string().describe('A concrete, improved bio suggestion.'),
});
export type AnalyzeBioOutput = z.infer<typeof AnalyzeBioOutputSchema>;

export async function analyzeBio(input: AnalyzeBioInput): Promise<AnalyzeBioOutput> {
  return analyzeBioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBioPrompt',
  input: { schema: AnalyzeBioInputSchema },
  output: { schema: AnalyzeBioOutputSchema },
  prompt: `You are a witty and sharp dating coach specializing in crafting compelling dating app bios. Analyze the user's bio based on its ability to attract interest.

  User's Bio: "{{{bio}}}"

  Your task is to provide:
  1.  **score**: A score from 0 to 10. Consider factors like intrigue, humor, clarity, confidence, and whether it encourages conversation. A generic "I like travel, food, and movies" is a 2. A bio with a unique hook is an 8 or higher.
  2.  **feedback**: Short, direct feedback (2-3 sentences). Explain *why* it got that score. Be encouraging but honest.
  3.  **suggestion**: A rewritten, improved bio. It should be creative, show personality, and include an open-ended hook to spark a conversation.`,
});

const analyzeBioFlow = ai.defineFlow(
  {
    name: 'analyzeBioFlow',
    inputSchema: AnalyzeBioInputSchema,
    outputSchema: AnalyzeBioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
