'use client';

import { useState } from 'react';
import { InputSection } from '@/components/input-section';
import { PrimaryOutput } from '@/components/primary-output';
import { SecondaryOutput } from '@/components/secondary-output';
import { Button } from '@/components/ui/button';

export interface LineItem {
  id: string;
  itemName: string;
  costPrice: number;
  quantity: number;
}

export default function Home() {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', itemName: '', costPrice: 0, quantity: 0 },
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Math.random().toString(36).substr(2, 9),
        itemName: '',
        costPrice: 0,
        quantity: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const clearAll = () => {
    setLineItems([{ id: '1', itemName: '', costPrice: 0, quantity: 0 }]);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-balance text-4xl font-bold text-foreground">
            UNL Pricing Calculator
          </h1>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: Input Section */}
          <div>
            <InputSection
              lineItems={lineItems}
              onAddItem={addLineItem}
              onRemoveItem={removeLineItem}
              onUpdateItem={updateLineItem}
            />
            <Button
              onClick={clearAll}
              variant="outline"
              className="mt-6 w-full"
            >
              Clear All
            </Button>
          </div>

          {/* Right: Output Sections */}
          <div className="space-y-8">
            <PrimaryOutput lineItems={lineItems} />
            <SecondaryOutput lineItems={lineItems} />
          </div>
        </div>
      </div>
    </main>
  );
}
