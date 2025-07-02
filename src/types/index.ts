export type Participant = {
  id: string;
  name: string;
  initials: string;
};

export type Item = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  assignedTo: string[]; // Array of participant IDs
};

export type Bill = {
  items: Item[];
  subtotal?: number;
  tax?: number;
  total: number;
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
