'use client';

import { LineItem } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { parseNumber } from '@/lib/pricing';

interface InputSectionProps {
  lineItems: LineItem[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => void;
}

export function InputSection({
  lineItems,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: InputSectionProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Line Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lineItems.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Item {index + 1}
              </span>
              {lineItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Item Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Item Name
              </label>
              <Input
                type="text"
                placeholder="e.g., Custom Widget Model X"
                value={item.itemName}
                onChange={(e) =>
                  onUpdateItem(item.id, 'itemName', e.target.value)
                }
                className="mt-1.5"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Cost Price (Rands)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={item.costPrice || ''}
                onChange={(e) =>
                  onUpdateItem(
                    item.id,
                    'costPrice',
                    parseNumber(e.target.value)
                  )
                }
                className="mt-1.5"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Quantity
              </label>
              <Input
                type="number"
                placeholder="0"
                value={item.quantity || ''}
                onChange={(e) =>
                  onUpdateItem(
                    item.id,
                    'quantity',
                    parseNumber(e.target.value)
                  )
                }
                className="mt-1.5"
              />
            </div>
          </div>
        ))}

        <Button
          onClick={onAddItem}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Line Item
        </Button>
      </CardContent>
    </Card>
  );
}
