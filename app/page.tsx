'use client';

import { useEffect, useState } from 'react';
import { InputSection } from '@/components/input-section';
import { PrimaryOutput } from '@/components/primary-output';
import { SecondaryOutput } from '@/components/secondary-output';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface LineItem {
  id: string;
  itemName: string;
  costPrice: number;
  quantity: number;
}

export interface RecentItem {
  itemName: string;
  costPrice: number;
}

const EMPTY_ITEM: LineItem = {
  id: '1',
  itemName: '',
  costPrice: 0,
  quantity: 0,
};
const DRAFT_KEY = 'unl-quoting-draft-v1';
const RECENT_KEY = 'unl-quoting-recent-items-v1';

export default function Home() {
  const [lineItems, setLineItems] = useState<LineItem[]>([EMPTY_ITEM]);
  const [quoteReference, setQuoteReference] = useState('');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(DRAFT_KEY);
      const savedRecent = window.localStorage.getItem(RECENT_KEY);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as {
          lineItems?: LineItem[];
          quoteReference?: string;
        };
        if (draft.lineItems?.length) setLineItems(draft.lineItems);
        if (typeof draft.quoteReference === 'string') {
          setQuoteReference(draft.quoteReference);
        }
      }
      if (savedRecent) setRecentItems(JSON.parse(savedRecent));
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
      window.localStorage.removeItem(RECENT_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ lineItems, quoteReference })
    );

    const completedItems = lineItems.filter(
      (item) => item.itemName.trim() && item.costPrice > 0
    );
    if (!completedItems.length) return;

    setRecentItems((current) => {
      const next = [...current];
      completedItems.forEach((item) => {
        const existingIndex = next.findIndex(
          (recent) =>
            recent.itemName.toLowerCase() === item.itemName.trim().toLowerCase()
        );
        if (existingIndex >= 0) next.splice(existingIndex, 1);
        next.unshift({
          itemName: item.itemName.trim(),
          costPrice: item.costPrice,
        });
      });
      const trimmed = next.slice(0, 12);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
      return JSON.stringify(trimmed) === JSON.stringify(current)
        ? current
        : trimmed;
    });
  }, [isLoaded, lineItems, quoteReference]);

  const addLineItem = () => {
    setLineItems((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        itemName: '',
        costPrice: 0,
        quantity: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((items) =>
      items.length > 1 ? items.filter((item) => item.id !== id) : items
    );
  };

  const updateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const selectRecentItem = (id: string, selectedName: string) => {
    const recent = recentItems.find(
      (item) => item.itemName.toLowerCase() === selectedName.toLowerCase()
    );
    setLineItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              itemName: selectedName,
              costPrice: recent?.costPrice ?? item.costPrice,
            }
          : item
      )
    );
  };

  const clearAll = () => {
    setLineItems([{ ...EMPTY_ITEM }]);
    setQuoteReference('');
    window.localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-12 flex items-center justify-between gap-4">
          <h1 className="text-balance text-4xl font-bold text-foreground">
            UNL Pricing Calculator
          </h1>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <InputSection
              lineItems={lineItems}
              quoteReference={quoteReference}
              recentItems={recentItems}
              onQuoteReferenceChange={setQuoteReference}
              onAddItem={addLineItem}
              onRemoveItem={removeLineItem}
              onUpdateItem={updateLineItem}
              onSelectRecentItem={selectRecentItem}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear this quote?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the current reference and all line items. Your
                    recent item suggestions will remain available.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep quote</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll}>
                    Clear quote
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex flex-col gap-8">
            <PrimaryOutput lineItems={lineItems} />
            <SecondaryOutput
              lineItems={lineItems}
              quoteReference={quoteReference}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
