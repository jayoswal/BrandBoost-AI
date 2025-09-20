'use server';
/**
 * @fileOverview Integrates the user's logo and business name into a marketing asset template.
 *
 * - integrateLogoAndName - A function that integrates the logo and business name into the template.
 * - IntegrateLogoAndNameInput - The input type for the integrateLogoAndName function.
 * - IntegrateLogoAndNameOutput - The return type for the integrateLogoAndName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntegrateLogoAndNameInputSchema = z.object({
  templateDataUri: z
    .string()
    .describe(
      "A marketing asset template, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  logoDataUri: z
    .string()
    .describe(
      "The user's logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  businessName: z.string().describe("The user's business name."),
});
export type IntegrateLogoAndNameInput = z.infer<typeof IntegrateLogoAndNameInputSchema>;

const IntegrateLogoAndNameOutputSchema = z.object({
  integratedAssetDataUri: z
    .string()
    .describe("The marketing asset with the integrated logo and business name, as a data URI."),
});
export type IntegrateLogoAndNameOutput = z.infer<typeof IntegrateLogoAndNameOutputSchema>;

export async function integrateLogoAndName(input: IntegrateLogoAndNameInput): Promise<IntegrateLogoAndNameOutput> {
  return integrateLogoAndNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'integrateLogoAndNamePrompt',
  input: {schema: IntegrateLogoAndNameInputSchema},
  output: {schema: IntegrateLogoAndNameOutputSchema},
  prompt: `You are a graphic designer AI assistant.  Generate high-quality, modern, and creative marketing assets for businesses.  Incorporate the user’s provided business logo and name template in a clean, visually appealing way.

Business Name: {{{businessName}}}
Logo: {{media url=logoDataUri}}
Template: {{media url=templateDataUri}}`,
});

const integrateLogoAndNameFlow = ai.defineFlow(
  {
    name: 'integrateLogoAndNameFlow',
    inputSchema: IntegrateLogoAndNameInputSchema,
    outputSchema: IntegrateLogoAndNameOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          {media: {url: input.templateDataUri}},
          {text: `Integrate this logo: {{media url=${input.logoDataUri}}}, and business name: ${input.businessName} into the template`},
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
        },
      });
    return {integratedAssetDataUri: media!.url};
  }
);
