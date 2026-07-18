'use client';

import { useState } from 'react';
import type { LineItem, QuoteMetadata, QuoteSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import {
  calculateUnitPriceResult,
  calculateLineTotal,
  formatRands,
} from '@/lib/pricing';

export type ExportFormat = 'concise' | 'detailed' | 'csv' | 'email';

const FORMAT_LABELS: Record<ExportFormat, string> = {
  concise: 'Concise',
  detailed: 'Detailed',
  csv: 'CSV',
  email: 'Email',
};

interface SecondaryOutputProps {
  lineItems: LineItem[];
  metadata: QuoteMetadata;
  settings: QuoteSettings;
}

export function SecondaryOutput({ lineItems, metadata, settings }: SecondaryOutputProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('detailed');

  const validItems = lineItems.filter(
    (item) => item.itemName && item.costPrice > 0 && item.quantity > 0
  );

  const dateStr = new Date().toLocaleDateString('en-ZA');

  const computedItems = validItems.map((item) => {
    const effectiveDiscount = item.discountPct + settings.quoteLevelDiscountPct;
    const result = calculateUnitPriceResult(item.costPrice, {
      tiers: settings.pricingTiers,
      overrideMarkupPct: item.overrideMarkupPct,
      roundingPolicy: settings.roundingPolicy,
      discountPct: effectiveDiscount,
    });
    const lineTotal = calculateLineTotal(result.roundedPrice, item.quantity);
    return { item, result, lineTotal };
  });

  const grandTotal = computedItems.reduce((s, c) => s + c.lineTotal, 0);

  // ── Format generators ─────────────────────────────────────────────────────

  const metaBlock = () => {
    const lines: string[] = [`Quote Date: ${dateStr}`];
    if (metadata.clientName) lines.push(`Client: ${metadata.clientName}`);
    if (metadata.salesperson) lines.push(`Salesperson: ${metadata.salesperson}`);
    if (metadata.rfqNumber) lines.push(`RFQ: ${metadata.rfqNumber}`);
    if (metadata.quoteReference) lines.push(`Reference: ${metadata.quoteReference}`);
    if (metadata.validityDays) lines.push(`Valid for: ${metadata.validityDays} days`);
    return lines.join('\n');
  };

  const generateConcise = () => {
    const lines = [metaBlock(), ''];
    computedItems.forEach(({ item, result, lineTotal }) => {
      lines.push(`${item.itemName}`);
      lines.push(`  ${formatRands(result.roundedPrice)} x ${item.quantity} = ${formatRands(lineTotal)}`);
    });
    lines.push('', `Grand Total: ${formatRands(grandTotal)}`);
    return lines.join('\n');
  };

  const generateDetailed = () => {
    const lines = [metaBlock(), ''];
    computedItems.forEach(({ item, result, lineTotal }) => {
      lines.push(item.itemName);
      lines.push(`• Cost Price: ${formatRands(item.costPrice)}`);
      lines.push(`• Markup: ${result.markupPct}% (${result.tierLabel})${result.isOverridden ? ' [override]' : ''}`);
      if (item.discountPct > 0 || settings.quoteLevelDiscountPct > 0) {
        lines.push(`• Discount: ${item.discountPct + settings.quoteLevelDiscountPct}%`);
      }
      lines.push(`• Unit Price: ${formatRands(result.roundedPrice)}`);
      lines.push(`• Quantity: ${item.quantity}x`);
      lines.push(`• Line Total: ${formatRands(lineTotal)}`);
      lines.push(`• Gross Profit: ${formatRands(result.grossProfit * item.quantity)} | Margin: ${result.marginPct.toFixed(1)}%`);
      lines.push('');
    });
    lines.push(`Grand Total: ${formatRands(grandTotal)}`);
    if (metadata.notes) lines.push('', `Notes: ${metadata.notes}`);
    return lines.join('\n');
  };

  const generateCSV = () => {
    const rows = [
      ['Item Name', 'Cost Price', 'Markup %', 'Unit Price', 'Quantity', 'Line Total', 'Gross Profit', 'Margin %'].join(','),
    ];
    computedItems.forEach(({ item, result, lineTotal }) => {
      rows.push([
        `"${item.itemName.replace(/"/g, '""')}"`,
        item.costPrice,
        result.markupPct,
        result.roundedPrice,
        item.quantity,
        lineTotal,
        (result.grossProfit * item.quantity).toFixed(0),
        result.marginPct.toFixed(2),
      ].join(','));
    });
    rows.push(['', '', '', '', 'Grand Total', grandTotal, '', ''].join(','));
    return rows.join('\n');
  };

  const generateEmail = () => {
    const validity = metadata.validityDays ? ` This quotation is valid for ${metadata.validityDays} days.` : '';
    const ref = metadata.quoteReference ? ` (Ref: ${metadata.quoteReference})` : '';
    const client = metadata.clientName ? ` for ${metadata.clientName}` : '';
    const lines = [
      `Please find our quotation${client}${ref} dated ${dateStr}.${validity}`,
      '',
    ];
    computedItems.forEach(({ item, result, lineTotal }) => {
      lines.push(`${item.itemName}`);
      lines.push(`  Unit Price: ${formatRands(result.roundedPrice)}   Qty: ${item.quantity}   Total: ${formatRands(lineTotal)}`);
    });
    lines.push('', `Grand Total: ${formatRands(grandTotal)}`);
    if (metadata.notes) lines.push('', metadata.notes);
    lines.push('', 'All prices exclude VAT unless otherwise stated.');
    return lines.join('\n');
  };

  const exportText = (() => {
    switch (format) {
      case 'concise': return generateConcise();
      case 'detailed': return generateDetailed();
      case 'csv': return generateCSV();
      case 'email': return generateEmail();
    }
  })();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (validItems.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Text Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enter line items to generate a text export
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Text Export</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Format selector */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Export format">
          {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
            <Button
              key={f}
              variant={format === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormat(f)}
            >
              {FORMAT_LABELS[f]}
            </Button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
            {exportText}
          </pre>
        </div>

        <Button onClick={copyToClipboard} className="w-full" size="lg">
          {copied ? (
            <><Check data-icon="inline-start" />Copied!</>
          ) : (
            <><Copy data-icon="inline-start" />Copy to Clipboard</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
