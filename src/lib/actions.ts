'use server';

import {
  extractItemsFromReceipt,
  ExtractItemsFromReceiptOutput as AIReceiptOutput,
} from '@/ai/flows/extract-items-from-receipt';
import {
  validateProofPhoto,
  ValidateProofPhotoOutput,
} from '@/ai/flows/validate-proof-photo';
import {
  validateReceiptPhoto,
  ValidateReceiptPhotoOutput,
} from '@/ai/flows/validate-receipt-photo';
import type { Item } from '@/types';

type ProcessedBill = {
  items: Omit<Item, 'id' | 'assignedTo'>[];
  subtotal?: number;
  tax?: number;
  total: number;
};

/**
 * Parses an Indonesian currency string (e.g., "1.234,56" or "5.000" or "5,000") into an integer.
 * It removes dots and commas as thousand separators and truncates any decimal part.
 * @param value The currency string to parse.
 * @returns The parsed integer.
 */
const parseRupiahString = (value?: string): number => {
  if (!value || typeof value !== 'string') return 0;

  // Handles "5.000" and "5,000" and "5.000,00" by removing separators and decimals
  const cleanValue = value.replace(/[.,]/g, '');

  // Since decimals are now removed, we might have extra "00" at the end if the original had decimals.
  // The AI prompt is inconsistent, so we need a robust way to guess.
  // Let's assume if the number looks too big by a factor of 100 and the original had a comma, it was probably a decimal.
  // A better long-term fix is a more consistent AI prompt.
  // For now, let's try a simpler approach based on user feedback to just remove decimals.
  
  // New simplified logic: remove dots, then split by comma and take the integer part.
  const integerPart = value.replace(/\./g, '').split(',')[0];
  const number = parseInt(integerPart, 10);

  return isNaN(number) ? 0 : number;
};

export async function processReceipt(
  receiptDataUri: string
): Promise<{ data: ProcessedBill | null; error: string | null }> {
  if (!receiptDataUri) {
    return { data: null, error: 'Ga ada struknya, bos. Upload dulu lah.' };
  }

  try {
    const resultFromAI: AIReceiptOutput = await extractItemsFromReceipt({
      receiptDataUri,
    });

    if (
      !resultFromAI ||
      !resultFromAI.items ||
      resultFromAI.items.length === 0
    ) {
      return {
        data: null,
        error:
          'Duh, AI-nya bingung nih. Gak nemu item di struk. Coba pake foto yang lebih jelas, kuy.',
      };
    }

    const parsedItems = resultFromAI.items.map((item) => ({
      name: item.item,
      quantity: item.quantity,
      price: parseRupiahString(item.price),
    }));

    const subtotalFromAI = parseRupiahString(resultFromAI.subtotal);
    const taxFromAI = parseRupiahString(resultFromAI.tax);
    const totalFromAI = parseRupiahString(resultFromAI.total);
    
    // If tax is not found on the receipt, it will be 0 and won't be added to the total.
    const finalTax = taxFromAI > 0 ? taxFromAI : 0;
    
    // Prioritize subtotal and total from the receipt if they exist and are valid.
    // Otherwise, calculate them from the items.
    const calculatedSubtotal = parsedItems.reduce(
      (acc, item) => acc + item.price,
      0
    );
    const finalSubtotal = subtotalFromAI > 0 ? subtotalFromAI : calculatedSubtotal;
    const finalTotal = totalFromAI > 0 ? totalFromAI : finalSubtotal + finalTax;


    const billData: ProcessedBill = {
      items: parsedItems,
      subtotal: finalSubtotal,
      tax: finalTax,
      total: finalTotal,
    };

    return { data: billData, error: null };
  } catch (e) {
    console.error('Error processing receipt:', e);
    return {
      data: null,
      error:
        'Gagal baca struknya nih. Fotonya burem kali atau formatnya aneh. Coba lagi pake foto yang lebih oke.',
    };
  }
}


export async function validateProofPhotoAction(
  photoDataUri: string
): Promise<{ data: ValidateProofPhotoOutput | null; error: string | null }> {
  if (!photoDataUri) {
    return { data: null, error: 'Fotonya mana, bestie? Upload dulu, dong.' };
  }

  try {
    const result = await validateProofPhoto({ photoDataUri });
    return { data: result, error: null };
  } catch (e) {
    console.error('Error validating photo:', e);
    return {
      data: null,
      error: 'Waduh, AI-nya lagi pusing. Gagal validasi foto, coba lagi nanti ya.',
    };
  }
}


export async function validateReceiptPhotoAction(
  photoDataUri: string
): Promise<{ data: ValidateReceiptPhotoOutput | null; error:string | null }> {
  if (!photoDataUri) {
    return { data: null, error: 'Fotonya mana, bestie? Upload dulu, dong.' };
  }

  try {
    const result = await validateReceiptPhoto({ photoDataUri });
    return { data: result, error: null };
  } catch (e) {
    console.error('Error validating receipt photo:', e);
    return {
      data: null,
      error: 'Waduh, AI-nya lagi pusing. Gagal validasi foto struk, coba lagi nanti ya.',
    };
  }
}
