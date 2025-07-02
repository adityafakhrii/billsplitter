"use server";

import { extractItemsFromReceipt, ExtractItemsFromReceiptOutput } from "@/ai/flows/extract-items-from-receipt";

export async function processReceipt(receiptDataUri: string): Promise<{ data: ExtractItemsFromReceiptOutput | null; error: string | null }> {
  if (!receiptDataUri) {
    return { data: null, error: "Ga ada struknya, bos. Upload dulu lah." };
  }

  try {
    const result = await extractItemsFromReceipt({ receiptDataUri });
    if (!result || !result.items || result.items.length === 0) {
       return { data: null, error: "Duh, AI-nya bingung nih. Gak nemu item di struk. Coba pake foto yang lebih jelas, kuy." };
    }
    return { data: result, error: null };
  } catch (e) {
    console.error("Error processing receipt:", e);
    return { data: null, error: "Gagal baca struknya nih. Fotonya burem kali atau formatnya aneh. Coba lagi pake foto yang lebih oke." };
  }
}
