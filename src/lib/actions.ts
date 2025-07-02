"use server";

import { extractItemsFromReceipt, ExtractItemsFromReceiptOutput } from "@/ai/flows/extract-items-from-receipt";

export async function processReceipt(receiptDataUri: string): Promise<{ data: ExtractItemsFromReceiptOutput | null; error: string | null }> {
  if (!receiptDataUri) {
    return { data: null, error: "No receipt image provided." };
  }

  try {
    const result = await extractItemsFromReceipt({ receiptDataUri });
    if (!result || result.length === 0) {
       return { data: null, error: "We couldn't find any items on this receipt. Please try a different image." };
    }
    return { data: result, error: null };
  } catch (e) {
    console.error("Error processing receipt:", e);
    return { data: null, error: "Failed to read items from the receipt. The image might be unclear or the format is not supported. Please try again with a clearer image." };
  }
}
