import type { RoundingPolicy, PricingTier, ApprovalThresholds } from './pricing';

export type { RoundingPolicy, PricingTier, ApprovalThresholds };

export interface LineItem {
  id: string;
  itemName: string;
  costPrice: number;
  quantity: number;
  overrideMarkupPct: number | null; // null = use tier default
  discountPct: number;              // 0 = no discount
}

export interface QuoteMetadata {
  quoteReference: string;
  clientName: string;
  salesperson: string;
  rfqNumber: string;
  validityDays: string; // stored as string to allow empty
  notes: string;
}

export interface QuoteSettings {
  roundingPolicy: RoundingPolicy;
  pricingTiers: PricingTier[];
  approvalThresholds: ApprovalThresholds;
  quoteLevelDiscountPct: number;
}

export interface SavedQuote {
  id: string;
  savedAt: string;       // ISO date string
  lineItems: LineItem[];
  metadata: QuoteMetadata;
  settings: QuoteSettings;
}

export interface RecentItem {
  itemName: string;
  costPrice: number;
}
