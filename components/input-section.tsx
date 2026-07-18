'use client';

import type { LineItem, RecentItem } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { parseNumber } from '@/lib/pricing';

interface InputSectionProps {
  lineItems: LineItem[];
  quoteReference: string;
  recentItems: RecentItem[];
  onQuoteReferenceChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => void;
  onSelectRecentItem: (id: string, itemName: string) => void;
}

export function InputSection({
  lineItems,
  quoteReference,
  recentItems,
  onQuoteReferenceChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSelectRecentItem,
}: InputSectionProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Line Items</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="quote-reference"
            className="text-xs font-medium text-muted-foreground"
          >
            Client / Quote Reference
          </label>
          <Input
            id="quote-reference"
            type="text"
            placeholder="e.g., ACME / RFQ-1042"
            value={quoteReference}
            onChange={(event) => onQuoteReferenceChange(event.target.value)}
          />
        </div>

        {lineItems.map((item, index) => {
          const listId = `recent-items-${item.id}`;
          return (
            <section
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
              aria-labelledby={`item-label-${item.id}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  id={`item-label-${item.id}`}
                  className="text-sm font-medium text-muted-foreground"
                >
                  Item {index + 1}
                </span>
                {lineItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 data-icon="inline-start" />
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`item-name-${item.id}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Item Name
                </label>
                <Input
                  id={`item-name-${item.id}`}
                  type="text"
                  list={listId}
                  autoComplete="off"
                  placeholder="e.g., Custom Widget Model X"
                  value={item.itemName}
                  onChange={(event) =>
                    onSelectRecentItem(item.id, event.target.value)
                  }
                />
                <datalist id={listId}>
                  {recentItems.map((recent) => (
                    <option key={recent.itemName} value={recent.itemName}>
                      R {recent.costPrice.toLocaleString('en-ZA')}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`cost-price-${item.id}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Cost Price (Rands)
                </label>
                <Input
                  id={`cost-price-${item.id}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  value={item.costPrice || ''}
                  onChange={(event) =>
                    onUpdateItem(
                      item.id,
                      'costPrice',
                      parseNumber(event.target.value)
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`quantity-${item.id}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Quantity
                </label>
                <Input
                  id={`quantity-${item.id}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  value={item.quantity || ''}
                  onChange={(event) =>
                    onUpdateItem(
                      item.id,
                      'quantity',
                      parseNumber(event.target.value)
                    )
                  }
                />
              </div>
            </section>
          );
        })}

        <Button onClick={onAddItem} variant="outline" size="lg">
          <Plus data-icon="inline-start" />
          Add Line Item
        </Button>
      </CardContent>
    </Card>
  );
}
