import { config } from 'dotenv';
config();

import '@/ai/flows/extract-items-from-receipt.ts';
import '@/ai/flows/validate-proof-photo.ts';
import '@/ai/flows/validate-receipt-photo.ts';
