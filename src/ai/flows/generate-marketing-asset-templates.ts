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
  imageDescription: z.string().describe('A description of what the image should be about.'),
  customText: z.string().optional().describe('Optional custom text to include in the asset.'),
  colorPalette: z.string().optional().describe('Optional color palette to use for the asset.'),
  referenceImage1DataUri: z.string().optional().describe('Optional reference image 1 as a data URI.'),
  referenceImage2DataUri: z.string().optional().describe('Optional reference image 2 as a data URI.'),
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

const generateMarketingAssetTemplatesFlow = ai.defineFlow(
  {
    name: 'generateMarketingAssetTemplatesFlow',
    inputSchema: GenerateMarketingAssetTemplatesInputSchema,
    outputSchema: GenerateMarketingAssetTemplatesOutputSchema,
  },
  async (input) => {
    const promptText = `You are a professional graphic designer AI assistant that creates high-quality, modern, and creative marketing assets for businesses.

Generate a ${input.assetType} based on the following description: "${input.imageDescription}".

Incorporate the user’s provided business logo and name in a clean, visually appealing way. Use the custom text and color palette if provided.

If reference images are provided, use them for general inspiration only. Do not copy any text or graphics from the reference images.

Business Name: ${input.businessName}
Custom Text: ${input.customText || ''}
Color Palette: ${input.colorPalette || ''}
`;

    const prompt: any[] = [{text: promptText}, {media: {url: input.businessLogoDataUri}}];

    if (input.referenceImage1DataUri) {
      prompt.push({text: 'Reference Image 1:'});
      prompt.push({media: {url: input.referenceImage1DataUri}});
    }
    if (input.referenceImage2DataUri) {
      prompt.push({text: 'Reference Image 2:'});
      prompt.push({media: {url: input.referenceImage2DataUri}});
    }

    const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media) {
      throw new Error('Image generation failed.');
    }

    return {assetDataUri: media.url};
  }
);
