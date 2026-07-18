'use client';

import { useState } from 'react';
import type { LineItem, QuoteSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check } from 'lucide-react';
import {
  calculateUnitPriceResult,
  calculateLineTotal,
  formatRands,
} from '@/lib/pricing';

interface PrimaryOutputProps {
  lineItems: LineItem[];
  settings: QuoteSettings;
}

export function PrimaryOutput({ lineItems, settings }: PrimaryOutputProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const validItems = lineItems.filter(
    (item) => item.itemName && item.costPrice > 0 && item.quantity > 0
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyBtn = ({ value, id }: { value: number; id: string }) => (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={() => copyToClipboard(value.toString(), id)}
      aria-label="Copy value"
    >
      {copiedId === id ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
    </Button>
  );

  if (validItems.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quoted Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enter line items to see quoted prices here
          </p>
        </CardContent>
      </Card>
    );
  }

  // Aggregate totals
  let grandTotal = 0;
  let totalCost = 0;
  let totalGrossProfit = 0;

  const computedItems = validItems.map((item) => {
    const effectiveDiscount = item.discountPct + settings.quoteLevelDiscountPct;
    const result = calculateUnitPriceResult(item.costPrice, {
      tiers: settings.pricingTiers,
      overrideMarkupPct: item.overrideMarkupPct,
      roundingPolicy: settings.roundingPolicy,
      discountPct: effectiveDiscount,
    });
    const lineTotal = calculateLineTotal(result.roundedPrice, item.quantity);
    const lineCost = item.costPrice * item.quantity;
    const lineGP = lineTotal - lineCost;

    grandTotal += lineTotal;
    totalCost += lineCost;
    totalGrossProfit += lineGP;

    return { item, result, lineTotal, lineCost, lineGP };
  });

  const effectiveMarginPct = grandTotal > 0 ? (totalGrossProfit / grandTotal) * 100 : 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Quoted Prices</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {computedItems.map(({ item, result, lineTotal, lineGP }) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{item.itemName}</p>
              {result.isOverridden && (
                <Badge variant="secondary" className="shrink-0 text-xs">Override</Badge>
              )}
            </div>

            {/* Unit price row */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Unit Price</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatRands(result.roundedPrice)}
                </p>
              </div>
              <CopyBtn value={result.roundedPrice} id={`unit-${item.id}`} />
            </div>

            {/* Line total row */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Line Total ({item.quantity}x)
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatRands(lineTotal)}
                </p>
              </div>
              <CopyBtn value={lineTotal} id={`line-${item.id}`} />
            </div>

            {/* Margin / GP summary */}
            <div className="flex flex-wrap gap-3 border-t border-border pt-3">
              <Stat label="Gross Profit" value={formatRands(lineGP)} />
              <Stat label="Margin" value={`${result.marginPct.toFixed(1)}%`} />
              <Stat label="Markup" value={`${result.markupPct}%${result.isOverridden ? ' *' : ''}`} />
              {(item.discountPct > 0 || settings.quoteLevelDiscountPct > 0) && (
                <Stat
                  label="Discount applied"
                  value={`${item.discountPct + settings.quoteLevelDiscountPct}%`}
                />
              )}
            </div>
          </div>
        ))}

        <Separator />

        {/* Grand total */}
        <div className="flex flex-col gap-3 rounded-lg border-2 border-foreground bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Grand Total</p>
              <p className="text-3xl font-bold text-foreground">{formatRands(grandTotal)}</p>
            </div>
            <CopyBtn value={grandTotal} id="grand-total" />
          </div>
          <div className="flex flex-wrap gap-3 border-t border-border pt-3">
            <Stat label="Total Cost" value={formatRands(totalCost)} />
            <Stat label="Total GP" value={formatRands(totalGrossProfit)} />
            <Stat label="Effective Margin" value={`${effectiveMarginPct.toFixed(1)}%`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
