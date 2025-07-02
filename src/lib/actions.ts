"use server";

import { extractItemsFromReceipt, ExtractItemsFromReceiptOutput as AIReceiptOutput } from "@/ai/flows/extract-items-from-receipt";
import type { Item } from "@/types";

type ProcessedBill = {
    items: Omit<Item, 'id' | 'assignedTo'>[];
    subtotal?: number;
    tax?: number;
    total: number;
}

/**
 * Parses an Indonesian currency string (e.g., "1.234,56") into a number.
 * It removes dots (thousands separators) and replaces the comma (decimal separator) with a dot.
 * @param value The currency string to parse.
 * @returns The parsed number.
 */
const parseRupiahString = (value?: string): number => {
    if (!value || typeof value !== 'string') return 0;
    
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');

    const number = parseFloat(cleanValue);
    return isNaN(number) ? 0 : number;
}

export async function processReceipt(receiptDataUri: string): Promise<{ data: ProcessedBill | null; error: string | null }> {
  if (!receiptDataUri) {
    return { data: null, error: "Ga ada struknya, bos. Upload dulu lah." };
  }

  try {
    const resultFromAI: AIReceiptOutput = await extractItemsFromReceipt({ receiptDataUri });

    if (!resultFromAI || !resultFromAI.items || resultFromAI.items.length === 0) {
       return { data: null, error: "Duh, AI-nya bingung nih. Gak nemu item di struk. Coba pake foto yang lebih jelas, kuy." };
    }
    
    const parsedItems = resultFromAI.items.map(item => ({
        name: item.item,
        quantity: item.quantity,
        price: parseRupiahString(item.price),
    }));

    const subtotalFromAI = parseRupiahString(resultFromAI.subtotal);
    const taxFromAI = parseRupiahString(resultFromAI.tax);
    const totalFromAI = parseRupiahString(resultFromAI.total);

    const calculatedSubtotal = parsedItems.reduce((acc, item) => acc + item.price, 0);

    // Prioritize AI-extracted values, but fall back to calculations if needed.
    const finalSubtotal = subtotalFromAI > 0 ? subtotalFromAI : calculatedSubtotal;
    const finalTax = taxFromAI > 0 ? taxFromAI : (finalSubtotal * 0.10); // Calculate 10% tax if not found
    const finalTotal = totalFromAI > 0 ? totalFromAI : (finalSubtotal + finalTax);

    const billData: ProcessedBill = {
        items: parsedItems,
        subtotal: finalSubtotal,
        tax: finalTax,
        total: finalTotal,
    };

    return { data: billData, error: null };

  } catch (e) {
    console.error("Error processing receipt:", e);
    return { data: null, error: "Gagal baca struknya nih. Fotonya burem kali atau formatnya aneh. Coba lagi pake foto yang lebih oke." };
  }
}
