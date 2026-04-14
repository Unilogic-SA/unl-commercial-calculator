'use client';

import { LineItem } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import {
  calculateUnitPrice,
  calculateLineTotal,
  formatRands,
} from '@/lib/pricing';
import { useState } from 'react';

interface PrimaryOutputProps {
  lineItems: LineItem[];
}

export function PrimaryOutput({ lineItems }: PrimaryOutputProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const validItems = lineItems.filter(
    (item) => item.itemName && item.costPrice > 0 && item.quantity > 0
  );

  const grandTotal = validItems.reduce((sum, item) => {
    const unitPrice = calculateUnitPrice(item.costPrice);
    const lineTotal = calculateLineTotal(unitPrice, item.quantity);
    return sum + lineTotal;
  }, 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Quoted Prices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validItems.map((item) => {
          const unitPrice = calculateUnitPrice(item.costPrice);
          const lineTotal = calculateLineTotal(unitPrice, item.quantity);

          return (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {item.itemName}
              </p>

              {/* Unit Price */}
              <div className="mb-3 space-y-2">
                <p className="text-xs text-muted-foreground">Unit Price</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {formatRands(unitPrice)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(unitPrice.toString(), `unit-${item.id}`)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedId === `unit-${item.id}` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Line Total */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Line Total ({item.quantity}x)
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {formatRands(lineTotal)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(lineTotal.toString(), `line-${item.id}`)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedId === `line-${item.id}` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Grand Total */}
        <div className="mt-6 rounded-lg border-2 border-foreground bg-card p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Grand Total
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-3xl font-bold text-foreground">
              {formatRands(grandTotal)}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(grandTotal.toString(), 'grand-total')}
              className="h-8 w-8 p-0"
            >
              {copiedId === 'grand-total' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
