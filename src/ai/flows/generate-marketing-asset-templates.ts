'use server';

/**
 * @fileOverview Generates marketing asset templates (banners, social media posts, etc.) using the Gemini image model.
 *
 * - generateMarketingAssetTemplates - A function that generates marketing asset templates.
 * - GenerateMarketingAssetTemplatesInput - The input type for the generateMarketingAssetTemplates function.
 * - GenerateMarketingAssetTemplatesOutput - The return type for the generateMarketingAssetTemplates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarketingAssetTemplatesInputSchema = z.object({
  businessLogoDataUri: z
    .string()
    .describe(
      "A photo of the business logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  businessName: z.string().describe('The name of the business.'),
  assetType: z.string().describe('The type of marketing asset to generate (e.g., banner, social media post).'),
  customText: z.string().optional().describe('Optional custom text to include in the asset.'),
  colorPalette: z.string().optional().describe('Optional color palette to use for the asset.'),
});
export type GenerateMarketingAssetTemplatesInput = z.infer<typeof GenerateMarketingAssetTemplatesInputSchema>;

const GenerateMarketingAssetTemplatesOutputSchema = z.object({
  assetDataUri: z
    .string()
    .describe(
      'The generated marketing asset as a data URI (image).'
    ),
});
export type GenerateMarketingAssetTemplatesOutput = z.infer<typeof GenerateMarketingAssetTemplatesOutputSchema>;

export async function generateMarketingAssetTemplates(input: GenerateMarketingAssetTemplatesInput): Promise<GenerateMarketingAssetTemplatesOutput> {
  return generateMarketingAssetTemplatesFlow(input);
}

const generationPrompt = ai.definePrompt({
    name: 'generateMarketingAssetTemplatesPrompt',
    input: {schema: GenerateMarketingAssetTemplatesInputSchema},
    output: {schema: GenerateMarketingAssetTemplatesOutputSchema},
    prompt: `You are a professional graphic designer AI assistant that creates high-quality, modern, and creative marketing assets for businesses.

Generate a {{{assetType}}} that incorporates the user’s provided business logo and name in a clean, visually appealing way. Use the custom text and color palette if provided.

Business Name: {{{businessName}}}
Business Logo: {{media url=businessLogoDataUri}}
Custom Text: {{#if customText}}'{{{customText}}}'{{/if}}
Color Palette: {{#if colorPalette}}'{{{colorPalette}}}'{{/if}}
`,
    model: 'googleai/gemini-2.5-flash-image-preview',
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
});

const generateMarketingAssetTemplatesFlow = ai.defineFlow(
  {
    name: 'generateMarketingAssetTemplatesFlow',
    inputSchema: GenerateMarketingAssetTemplatesInputSchema,
    outputSchema: GenerateMarketingAssetTemplatesOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: generationPrompt.model,
        prompt: await generationPrompt.render({input}),
        config: generationPrompt.config,
    });

    if (!media) {
      throw new Error('Image generation failed.');
    }

    return {assetDataUri: media.url};
  }
);
