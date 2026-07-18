// ─── Rounding policies ───────────────────────────────────────────────────────

export type RoundingPolicy = 'nearest-rand' | 'nearest-10' | 'nearest-100' | 'psychological';

export function applyRounding(value: number, policy: RoundingPolicy): number {
  switch (policy) {
    case 'nearest-rand':
      return Math.round(value);
    case 'nearest-10':
      return Math.round(value / 10) * 10;
    case 'nearest-100':
      return Math.round(value / 100) * 100;
    case 'psychological': {
      // Round to nearest R10 then subtract R1 (e.g. 1 260 -> 1 259)
      const base = Math.round(value / 10) * 10;
      return base > 0 ? base - 1 : base;
    }
  }
}

export const ROUNDING_LABELS: Record<RoundingPolicy, string> = {
  'nearest-rand': 'Nearest rand',
  'nearest-10': 'Nearest R10',
  'nearest-100': 'Nearest R100',
  psychological: 'Psychological (–R1)',
};

// ─── Pricing rules ────────────────────────────────────────────────────────────

export interface PricingTier {
  maxCost: number | null; // null = no upper bound
  markup: number;         // percentage, e.g. 25
  label: string;
}

export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  { maxCost: 10000,   markup: 25, label: 'Under R10,000' },
  { maxCost: 50000,   markup: 20, label: 'R10,000 – R50,000' },
  { maxCost: 250000,  markup: 15, label: 'R50,000 – R250,000' },
  { maxCost: null,    markup: 12, label: 'Above R250,000' },
];

export function getMarkupTier(
  costPrice: number,
  tiers: PricingTier[] = DEFAULT_PRICING_TIERS
): PricingTier {
  return (
    tiers.find((t) => t.maxCost === null || costPrice < t.maxCost) ??
    tiers[tiers.length - 1]
  );
}

/** @deprecated Use getMarkupTier instead */
export function getMarkupPercentage(costPrice: number, tiers = DEFAULT_PRICING_TIERS): number {
  return getMarkupTier(costPrice, tiers).markup;
}

/** @deprecated Use getMarkupTier instead */
export function getMarkupTierDescription(costPrice: number, tiers = DEFAULT_PRICING_TIERS): string {
  return getMarkupTier(costPrice, tiers).label;
}

// ─── Unit price calculation ───────────────────────────────────────────────────

export interface UnitPriceResult {
  rawPrice: number;
  roundedPrice: number;
  markupPct: number;
  tierLabel: string;
  isOverridden: boolean;
  grossProfit: number;
  marginPct: number;
}

export function calculateUnitPriceResult(
  costPrice: number,
  opts: {
    tiers?: PricingTier[];
    overrideMarkupPct?: number | null;
    roundingPolicy?: RoundingPolicy;
    discountPct?: number;
  } = {}
): UnitPriceResult {
  const tiers = opts.tiers ?? DEFAULT_PRICING_TIERS;
  const tier = getMarkupTier(costPrice, tiers);
  const markupPct = opts.overrideMarkupPct ?? tier.markup;
  const isOverridden = opts.overrideMarkupPct != null;
  const policy = opts.roundingPolicy ?? 'nearest-rand';

  const rawBeforeDiscount = costPrice * (1 + markupPct / 100);
  const rawPrice = rawBeforeDiscount * (1 - (opts.discountPct ?? 0) / 100);
  const roundedPrice = applyRounding(rawPrice, policy);

  const grossProfit = roundedPrice - costPrice;
  const marginPct = roundedPrice > 0 ? (grossProfit / roundedPrice) * 100 : 0;

  return {
    rawPrice,
    roundedPrice,
    markupPct,
    tierLabel: tier.label,
    isOverridden,
    grossProfit,
    marginPct,
  };
}

/** Convenience wrapper – returns rounded unit price */
export function calculateUnitPrice(
  costPrice: number,
  opts: Parameters<typeof calculateUnitPriceResult>[1] = {}
): number {
  return calculateUnitPriceResult(costPrice, opts).roundedPrice;
}

export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

// ─── Approval thresholds ──────────────────────────────────────────────────────

export interface ApprovalThresholds {
  minMarginPct: number;   // flag if margin is below this
  maxTotalAmount: number; // flag if grand total exceeds this
}

export const DEFAULT_APPROVAL_THRESHOLDS: ApprovalThresholds = {
  minMarginPct: 10,
  maxTotalAmount: 1_000_000,
};

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationWarning {
  lineItemId: string | null; // null = quote-level
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidatedLineItem {
  id: string;
  itemName: string;
  costPrice: number;
  quantity: number;
  overrideMarkupPct?: number | null;
}

export function validateLineItems(
  items: ValidatedLineItem[],
  thresholds: ApprovalThresholds = DEFAULT_APPROVAL_THRESHOLDS,
  tiers: PricingTier[] = DEFAULT_PRICING_TIERS,
  roundingPolicy: RoundingPolicy = 'nearest-rand',
  discountPct = 0
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const seenNames = new Map<string, string>();

  items.forEach((item) => {
    const key = item.itemName.trim().toLowerCase();
    if (!item.itemName.trim()) {
      warnings.push({ lineItemId: item.id, message: 'Item name is required.', severity: 'error' });
    }
    if (item.costPrice <= 0) {
      warnings.push({ lineItemId: item.id, message: 'Cost price must be greater than zero.', severity: 'error' });
    }
    if (item.quantity <= 0) {
      warnings.push({ lineItemId: item.id, message: 'Quantity must be greater than zero.', severity: 'error' });
    }
    if (item.costPrice > 10_000_000) {
      warnings.push({ lineItemId: item.id, message: 'Unusually high cost price — please verify.', severity: 'warning' });
    }
    if (key && seenNames.has(key)) {
      warnings.push({ lineItemId: item.id, message: `Duplicate item name: "${item.itemName.trim()}"`, severity: 'warning' });
    }
    if (key) seenNames.set(key, item.id);

    if (item.costPrice > 0 && item.quantity > 0) {
      const result = calculateUnitPriceResult(item.costPrice, {
        tiers,
        overrideMarkupPct: item.overrideMarkupPct,
        roundingPolicy,
        discountPct,
      });
      if (result.marginPct < thresholds.minMarginPct) {
        warnings.push({
          lineItemId: item.id,
          message: `Low margin: ${result.marginPct.toFixed(1)}% (threshold ${thresholds.minMarginPct}%)`,
          severity: 'warning',
        });
      }
    }
  });

  // Quote-level: total
  const grandTotal = items
    .filter((i) => i.costPrice > 0 && i.quantity > 0)
    .reduce((sum, item) => {
      const unitPrice = calculateUnitPrice(item.costPrice, {
        tiers,
        overrideMarkupPct: item.overrideMarkupPct,
        roundingPolicy,
        discountPct,
      });
      return sum + calculateLineTotal(unitPrice, item.quantity);
    }, 0);

  if (grandTotal > thresholds.maxTotalAmount) {
    warnings.push({
      lineItemId: null,
      message: `Grand total ${formatRands(grandTotal)} exceeds the approval threshold of ${formatRands(thresholds.maxTotalAmount)}.`,
      severity: 'warning',
    });
  }

  return warnings;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatRands(value: number): string {
  return `R${value.toLocaleString('en-ZA')}`;
}

export function parseNumber(value: string): number {
  const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}
