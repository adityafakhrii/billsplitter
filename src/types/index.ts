export type Participant = {
  id: string;
  name: string;
  initials: string;
};

export type Item = {
  id: string;
  name: string;
  quantity: number;
  price: number; // Total price for the line item
  unitPrice?: number; // Optional: unit price, useful for manual entries
  assignedTo: string[]; // Array of participant IDs
};

export type ManualItem = {
    id: string;
    name: string;
    quantity: number;
    price: number; // This will be unit price
};

export type Bill = {
  items: Item[];
  subtotal?: number;
  tax?: number;
  total: number;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
}

export type BillResult = {
  participantId: string;
  total: number;
  items: {
    name: string;
    price: number;
    splitPrice: number;
  }[];
  taxShare: number;
};

export type ManualParticipant = {
  id: string;
  name: string;
  initials: string;
  amount: number;
};
