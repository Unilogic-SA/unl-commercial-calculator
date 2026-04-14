/**
 * Determines the markup percentage based on cost price
 */
export function getMarkupPercentage(costPrice: number): number {
  if (costPrice < 10000) return 25;
  if (costPrice < 50000) return 20;
  if (costPrice < 250000) return 15;
  return 12;
}

/**
 * Gets the tier description for a given cost price
 */
export function getMarkupTierDescription(costPrice: number): string {
  if (costPrice < 10000) return 'Under R10,000';
  if (costPrice < 50000) return 'R10,000 - R50,000';
  if (costPrice < 250000) return 'R50,000 - R250,000';
  return 'Above R250,000';
}

/**
 * Calculates the unit quoted price for a line item
 */
export function calculateUnitPrice(costPrice: number): number {
  const markup = getMarkupPercentage(costPrice);
  const multiplier = 1 + markup / 100;
  return Math.round(costPrice * multiplier);
}

/**
 * Calculates the line total for a line item
 */
export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

/**
 * Formats a number as South African Rands
 */
export function formatRands(value: number): string {
  return `R${value.toLocaleString('en-ZA')}`;
}

/**
 * Parses a number from user input
 */
export function parseNumber(value: string): number {
  const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}
