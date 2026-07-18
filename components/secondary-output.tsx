'use client';

import type { LineItem } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import {
  calculateUnitPrice,
  calculateLineTotal,
  formatRands,
  getMarkupPercentage,
  getMarkupTierDescription,
} from '@/lib/pricing';
import { useState } from 'react';

interface SecondaryOutputProps {
  lineItems: LineItem[];
  quoteReference: string;
}

export function SecondaryOutput({
  lineItems,
  quoteReference,
}: SecondaryOutputProps) {
  const [copied, setCopied] = useState(false);

  const validItems = lineItems.filter(
    (item) => item.itemName && item.costPrice > 0 && item.quantity > 0
  );

  const grandTotal = validItems.reduce((sum, item) => {
    const unitPrice = calculateUnitPrice(item.costPrice);
    return sum + calculateLineTotal(unitPrice, item.quantity);
  }, 0);

  const generateClickUpText = () => {
    const dateStr = new Date().toLocaleDateString('en-ZA');
    let text = `Quote Date: ${dateStr}\n`;
    if (quoteReference.trim()) {
      text += `Client / Quote Reference: ${quoteReference.trim()}\n`;
    }
    text += '\n';

    validItems.forEach((item) => {
      const markup = getMarkupPercentage(item.costPrice);
      const tier = getMarkupTierDescription(item.costPrice);
      const unitPrice = calculateUnitPrice(item.costPrice);
      const lineTotal = calculateLineTotal(unitPrice, item.quantity);

      text += `${item.itemName}\n`;
      text += `• Cost Price: ${formatRands(item.costPrice)}\n`;
      text += `• Markup: ${markup}% (${tier})\n`;
      text += `• Unit Price: ${formatRands(unitPrice)}\n`;
      text += `• Quantity: ${item.quantity}x\n`;
      text += `• Line Total: ${formatRands(lineTotal)}\n\n`;
    });

    return `${text}Grand Total: ${formatRands(grandTotal)}`;
  };

  const clickUpText = generateClickUpText();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(clickUpText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (validItems.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">ClickUp Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enter line items to generate ClickUp export
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">ClickUp Export</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Copy and paste this into ClickUp for a detailed breakdown
        </p>
        <div className="rounded-lg border border-border bg-background p-4">
          <pre className="max-h-64 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
            {clickUpText}
          </pre>
        </div>
        <Button onClick={copyToClipboard} className="w-full" size="lg">
          {copied ? (
            <>
              <Check data-icon="inline-start" />
              Copied!
            </>
          ) : (
            <>
              <Copy data-icon="inline-start" />
              Copy to Clipboard
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
