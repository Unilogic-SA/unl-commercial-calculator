'use client';

import { LineItem } from '@/app/page';
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
}

export function SecondaryOutput({ lineItems }: SecondaryOutputProps) {
  const [copied, setCopied] = useState(false);

  const validItems = lineItems.filter(
    (item) => item.itemName && item.costPrice > 0 && item.quantity > 0
  );

  const grandTotal = validItems.reduce((sum, item) => {
    const unitPrice = calculateUnitPrice(item.costPrice);
    const lineTotal = calculateLineTotal(unitPrice, item.quantity);
    return sum + lineTotal;
  }, 0);

  const generateClickUpText = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-ZA');

    let text = `Quote Date: ${dateStr}\n\n`;

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

    text += `Grand Total: ${formatRands(grandTotal)}`;

    return text;
  };

  const clickUpText = generateClickUpText();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clickUpText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Copy and paste this into ClickUp for detailed breakdown
        </p>

        {/* Text Display */}
        <div className="rounded-lg border border-border bg-background p-4">
          <pre className="text-xs leading-relaxed text-foreground overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
            {clickUpText}
          </pre>
        </div>

        {/* Copy Button */}
        <Button
          onClick={copyToClipboard}
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          size="lg"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
