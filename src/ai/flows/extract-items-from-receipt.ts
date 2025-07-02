'use server';

/**
 * @fileOverview Extracts items, quantity, prices, and totals from a receipt image using AI.
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

const ReceiptItemSchema = z.object({
  item: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The quantity of the item.'),
  price: z.number().describe('The total price for the quantity of this item.'),
});

const ExtractItemsFromReceiptOutputSchema = z.object({
  items: z.array(ReceiptItemSchema),
  subtotal: z
    .number()
    .optional()
    .describe('The subtotal of all items before tax and other charges.'),
  tax: z
    .number()
    .optional()
    .describe('The total tax amount (e.g., PPN, PB1).'),
  total: z.number().describe('The final total amount on the receipt.'),
});
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
  prompt: `You are an expert receipt parser. Your job is to extract detailed information from a receipt image in Indonesian Rupiah (Rp).

Using the receipt image, identify the following:
1.  Each individual item, including its name, quantity, and total price for that line item.
2.  The subtotal of all items.
3.  The tax amount (often labeled as PPN or PB1).
4.  The final total amount.

Return a JSON object with the fields 'items', 'subtotal', 'tax', and 'total'. The 'items' field should be an array of objects, where each object has 'item', 'quantity', and 'price' fields. If a value is not present on the receipt (like subtotal or tax), you can omit it. The total amount is mandatory.

Important: All monetary values (price, subtotal, tax, total) must be returned as pure JSON numbers, without currency symbols or thousands separators. Use a period (.) as the decimal separator. For example, a value of "Rp 15.000,50" must be returned as the number 15000.50.

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
