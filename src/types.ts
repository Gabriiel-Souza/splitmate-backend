export interface Participant {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  priceCents: number; // e.g., R$ 29.90 = 2990
  quantity: number;
  consumedByIds: string[]; // IDs of participants sharing this item
}

export interface Table {
  id: string;
  code: string; // 4 characters (e.g., "B4K9")
  venueName: string;
  serviceFeeEnabled: boolean; // 10% tip toggle
  participants: Participant[];
  items: Item[];
}

export interface ConsumedItemDetail {
  itemId: string;
  name: string;
  quantity: number;
  shareCents: number;
}

export interface ParticipantSummary {
  participantId: string;
  name: string;
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
  consumedItems: ConsumedItemDetail[];
}

export interface TableSummary {
  code: string;
  venueName: string;
  serviceFeeEnabled: boolean;
  subtotalCents: number;
  serviceFeeCents: number;
  grandTotalCents: number;
  participants: ParticipantSummary[];
}