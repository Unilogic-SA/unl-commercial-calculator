'use client';

import type { SavedQuote } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { History, FolderOpen, Copy, Trash2 } from 'lucide-react';
import { calculateUnitPrice, calculateLineTotal, formatRands } from '@/lib/pricing';

interface QuoteHistoryProps {
  quotes: SavedQuote[];
  onOpen: (quote: SavedQuote) => void;
  onDuplicate: (quote: SavedQuote) => void;
  onDelete: (id: string) => void;
}

export function QuoteHistory({ quotes, onOpen, onDuplicate, onDelete }: QuoteHistoryProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Quote history">
          <History data-icon="inline-start" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Quote History</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved quotes yet. Quotes are saved automatically while you work.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {quotes.map((quote) => {
                const validItems = quote.lineItems.filter(
                  (i) => i.costPrice > 0 && i.quantity > 0
                );
                const grandTotal = validItems.reduce((sum, item) => {
                  const u = calculateUnitPrice(item.costPrice, {
                    tiers: quote.settings.pricingTiers,
                    overrideMarkupPct: item.overrideMarkupPct,
                    roundingPolicy: quote.settings.roundingPolicy,
                    discountPct: item.discountPct + quote.settings.quoteLevelDiscountPct,
                  });
                  return sum + calculateLineTotal(u, item.quantity);
                }, 0);

                const savedDate = new Date(quote.savedAt).toLocaleDateString('en-ZA', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const label =
                  quote.metadata.quoteReference ||
                  quote.metadata.rfqNumber ||
                  quote.metadata.clientName ||
                  `Quote ${savedDate}`;

                return (
                  <div
                    key={quote.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground">
                          {validItems.length} item{validItems.length !== 1 ? 's' : ''} &middot; {formatRands(grandTotal)}
                        </span>
                        <span className="text-xs text-muted-foreground">{savedDate}</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpen(quote)}
                      >
                        <FolderOpen data-icon="inline-start" />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onDuplicate(quote)}
                      >
                        <Copy data-icon="inline-start" />
                        Duplicate
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" aria-label="Delete quote">
                            <Trash2 data-icon="inline-start" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this quote?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove &ldquo;{label}&rdquo; from your history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(quote.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
