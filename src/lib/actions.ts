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
 * It intelligently handles both dots and commas as potential thousands or decimal separators.
 * @param value The currency string to parse.
 * @returns The parsed integer.
 */
const parseRupiahString = (value?: string): number => {
  if (!value || typeof value !== 'string') return 0;

  let numberString = value;

  // Indonesian locale typically uses '.' for thousands and ',' for decimals.
  // However, receipts can be inconsistent. A common pattern for decimals is a separator followed by 1 or 2 digits.
  // Let's check if the last comma is likely a decimal separator.
  const lastCommaIndex = numberString.lastIndexOf(',');
  if (lastCommaIndex > -1) {
      const decimalPart = numberString.substring(lastCommaIndex + 1);
      if (decimalPart.length <= 2) {
          // This looks like a decimal separator (e.g., ",00" or ",50").
          // We'll take the part before it and ignore the decimals as per requirements.
          numberString = numberString.substring(0, lastCommaIndex);
      }
  }

  // Now, remove all remaining dots and commas, which should be thousands separators.
  const cleanNumberString = numberString.replace(/[.,]/g, '');

  const number = parseInt(cleanNumberString, 10);

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
