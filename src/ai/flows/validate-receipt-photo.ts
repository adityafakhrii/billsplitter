'use server';

/**
 * @fileOverview Validates if a photo is a valid receipt.
 *
 * - validateReceiptPhoto - A function that handles the photo validation process.
 * - ValidateReceiptPhotoInput - The input type for the validateReceiptPhoto function.
 * - ValidateReceiptPhotoOutput - The return type for the validateReceiptPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateReceiptPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to validate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidateReceiptPhotoInput = z.infer<typeof ValidateReceiptPhotoInputSchema>;


const ValidateReceiptPhotoOutputSchema = z.object({
    isReceipt: z.boolean().describe("Whether or not the image is a valid receipt/invoice/bill."),
    reason: z.string().describe("The reason why the image is not a valid receipt, in Indonesian."),
});
export type ValidateReceiptPhotoOutput = z.infer<typeof ValidateReceiptPhotoOutputSchema>;

export async function validateReceiptPhoto(
    input: ValidateReceiptPhotoInput
): Promise<ValidateReceiptPhotoOutput> {
    return validateReceiptPhotoFlow(input);
}

const prompt = ai.definePrompt({
    name: 'validateReceiptPhotoPrompt',
    input: {schema: ValidateReceiptPhotoInputSchema},
    output: {schema: ValidateReceiptPhotoOutputSchema},
    prompt: `You are an expert image classifier. Your task is to determine if the provided image is a receipt, invoice, or bill from a store or service.

The image is valid if it clearly shows a list of items with prices, a total amount, and usually a store name. An image of a storefront, grocery items, or a random object is NOT a valid receipt for this purpose.

Respond in JSON format. Your response must include a boolean field 'isReceipt' and a string field 'reason' explaining your decision in Indonesian, especially if it's not valid.

Image: {{media url=photoDataUri}}`
});


const validateReceiptPhotoFlow = ai.defineFlow(
    {
        name: 'validateReceiptPhotoFlow',
        inputSchema: ValidateReceiptPhotoInputSchema,
        outputSchema: ValidateReceiptPhotoOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        return output!;
    }
);
