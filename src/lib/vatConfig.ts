export const VAT_RATE = 0.075;
export const VAT_LABEL = 'VAT (7.5%)';
export const VAT_EXEMPT = false;

export function calculateVAT(subtotal: number): number {
  if (VAT_EXEMPT) return 0;
  return Math.round(subtotal * VAT_RATE * 100) / 100;
}

export function calculateGrandTotal(subtotal: number): number {
  return subtotal + calculateVAT(subtotal);
}
