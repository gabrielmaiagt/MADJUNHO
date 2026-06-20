import {genkit, FlowContext} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // O model 'gemini-pro' foi descontinuado. Usando um modelo mais recente.
  model: 'googleai/gemini-1.5-flash-latest',
});
