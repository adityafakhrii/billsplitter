// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview Extracts items and prices from a receipt image using AI.
 *
 * - extractItemsFromReceipt - A function that handles the item extraction process.
 * - ExtractItemsFromReceiptInput - The input type for the extractItemsFromReceipt function.
 * - ExtractItemsFromReceiptOutput - The return type for the extractItemsFromReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractItemsFromReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractItemsFromReceiptInput = z.infer<typeof ExtractItemsFromReceiptInputSchema>;

const ExtractItemsFromReceiptOutputSchema = z.array(
  z.object({
    item: z.string().describe('The name of the item.'),
    price: z.number().describe('The price of the item.'),
  })
);
export type ExtractItemsFromReceiptOutput = z.infer<typeof ExtractItemsFromReceiptOutputSchema>;

export async function extractItemsFromReceipt(
  input: ExtractItemsFromReceiptInput
): Promise<ExtractItemsFromReceiptOutput> {
  return extractItemsFromReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractItemsFromReceiptPrompt',
  input: {schema: ExtractItemsFromReceiptInputSchema},
  output: {schema: ExtractItemsFromReceiptOutputSchema},
  prompt: `You are an expert receipt parser.

You will use the receipt image to identify each item and its price.

Return a JSON array of objects, where each object has an "item" field and a "price" field.

Receipt Image: {{media url=receiptDataUri}}
`,
});

const extractItemsFromReceiptFlow = ai.defineFlow(
  {
    name: 'extractItemsFromReceiptFlow',
    inputSchema: ExtractItemsFromReceiptInputSchema,
    outputSchema: ExtractItemsFromReceiptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
