'use server';

/**
 * @fileOverview Validates if a photo is a valid proof of purchase.
 *
 * - validateProofPhoto - A function that handles the photo validation process.
 * - ValidateProofPhotoInput - The input type for the validateProofPhoto function.
 * - ValidateProofPhotoOutput - The return type for the validateProofPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateProofPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo for proof of purchase, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidateProofPhotoInput = z.infer<typeof ValidateProofPhotoInputSchema>;


const ValidateProofPhotoOutputSchema = z.object({
    isValid: z.boolean().describe("Whether or not the image is a valid proof of purchase."),
    reason: z.string().describe("The reason why the image is not valid, in Indonesian."),
});
export type ValidateProofPhotoOutput = z.infer<typeof ValidateProofPhotoOutputSchema>;

export async function validateProofPhoto(
    input: ValidateProofPhotoInput
): Promise<ValidateProofPhotoOutput> {
    return validateProofPhotoFlow(input);
}

const prompt = ai.definePrompt({
    name: 'validateProofPhotoPrompt',
    input: {schema: ValidateProofPhotoInputSchema},
    output: {schema: ValidateProofPhotoOutputSchema},
    prompt: `You are an expert image classifier. Your task is to determine if the provided image is suitable as proof of purchase from a store. 
    
The image is valid if it clearly shows one of the following: a storefront, the inside of a shop, a collection of grocery items, or a shopping cart/basket with products. An image of a receipt is NOT valid for this task. An image of a random object, person, or landscape is NOT valid. 

Respond in JSON format. Your response must include a boolean field 'isValid' and a string field 'reason' explaining your decision in Indonesian, especially if it's not valid.

Image: {{media url=photoDataUri}}`
});


const validateProofPhotoFlow = ai.defineFlow(
    {
        name: 'validateProofPhotoFlow',
        inputSchema: ValidateProofPhotoInputSchema,
        outputSchema: ValidateProofPhotoOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        return output!;
    }
);
