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

const integrateLogoAndNameFlow = ai.defineFlow(
  {
    name: 'integrateLogoAndNameFlow',
    inputSchema: IntegrateLogoAndNameInputSchema,
    outputSchema: IntegrateLogoAndNameOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          {media: {url: input.templateDataUri}},
          {text: "Integrate this logo:"},
          {media: {url: input.logoDataUri}},
          {text: `and business name: ${input.businessName} into the template in a clean, professional way.`},
        ],
        config: {
          responseModalities: ['IMAGE'],
        },
      });
    
    if (!media) {
      throw new Error('Asset integration failed.');
    }

    return {integratedAssetDataUri: media.url};
  }
);
