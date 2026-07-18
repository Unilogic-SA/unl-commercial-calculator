'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LineItem, QuoteMetadata, QuoteSettings, RecentItem, SavedQuote } from '@/lib/types';
import { DEFAULT_PRICING_TIERS, DEFAULT_APPROVAL_THRESHOLDS, validateLineItems } from '@/lib/pricing';
import { InputSection } from '@/components/input-section';
import { PrimaryOutput } from '@/components/primary-output';
import { SecondaryOutput } from '@/components/secondary-output';
import { ThemeToggle } from '@/components/theme-toggle';
import { SettingsPanel } from '@/components/settings-panel';
import { QuoteHistory } from '@/components/quote-history';
import { QuoteStatus, type SaveState } from '@/components/quote-status';
import { ValidationBanner } from '@/components/validation-banner';
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
import { Save } from 'lucide-react';

// ── Storage keys ──────────────────────────────────────────────────────────────
const DRAFT_KEY    = 'unl-pricing-draft-v2';
const RECENT_KEY   = 'unl-pricing-recent-v1';
const HISTORY_KEY  = 'unl-pricing-history-v1';
const SETTINGS_KEY = 'unl-pricing-settings-v1';

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: QuoteSettings = {
  roundingPolicy: 'nearest-rand',
  pricingTiers: DEFAULT_PRICING_TIERS.map((t) => ({ ...t })),
  approvalThresholds: { ...DEFAULT_APPROVAL_THRESHOLDS },
  quoteLevelDiscountPct: 0,
};

const EMPTY_METADATA: QuoteMetadata = {
  quoteReference: '',
  clientName: '',
  salesperson: '',
  rfqNumber: '',
  validityDays: '',
  notes: '',
};

const makeItem = (): LineItem => ({
  id: crypto.randomUUID(),
  itemName: '',
  costPrice: 0,
  quantity: 0,
  overrideMarkupPct: null,
  discountPct: 0,
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [lineItems, setLineItems]     = useState<LineItem[]>([makeItem()]);
  const [metadata, setMetadata]       = useState<QuoteMetadata>(EMPTY_METADATA);
  const [settings, setSettings]       = useState<QuoteSettings>(DEFAULT_SETTINGS);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [saveState, setSaveState]     = useState<SaveState>('unsaved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded]       = useState(false);

  // ── Load from localStorage ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const draft    = window.localStorage.getItem(DRAFT_KEY);
      const recent   = window.localStorage.getItem(RECENT_KEY);
      const history  = window.localStorage.getItem(HISTORY_KEY);
      const savedCfg = window.localStorage.getItem(SETTINGS_KEY);

      if (draft) {
        const parsed = JSON.parse(draft) as Partial<{ lineItems: LineItem[]; metadata: QuoteMetadata }>;
        if (parsed.lineItems?.length) setLineItems(parsed.lineItems);
        if (parsed.metadata) setMetadata(parsed.metadata);
      }
      if (recent)   setRecentItems(JSON.parse(recent));
      if (history)  setSavedQuotes(JSON.parse(history));
      if (savedCfg) setSettings(JSON.parse(savedCfg));
    } catch {
      [DRAFT_KEY, RECENT_KEY, HISTORY_KEY, SETTINGS_KEY].forEach((k) =>
        window.localStorage.removeItem(k)
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // ── Auto-save draft ───────────────────────────────────────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    setSaveState('unsaved');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ lineItems, metadata }));
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        // Update recent items
        const completed = lineItems.filter((i) => i.itemName.trim() && i.costPrice > 0);
        if (completed.length) {
          setRecentItems((current) => {
            const next = [...current];
            completed.forEach((item) => {
              const idx = next.findIndex(
                (r) => r.itemName.toLowerCase() === item.itemName.trim().toLowerCase()
              );
              if (idx >= 0) next.splice(idx, 1);
              next.unshift({ itemName: item.itemName.trim(), costPrice: item.costPrice });
            });
            const trimmed = next.slice(0, 12);
            window.localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
            return trimmed;
          });
        }

        setSaveState('saved');
        setLastSavedAt(new Date());
      } catch {
        setSaveState('error');
      }
    }, 600);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [isLoaded, lineItems, metadata, settings]);

  // ── Quote history helpers ─────────────────────────────────────────────────
  const saveToHistory = useCallback(() => {
    const quote: SavedQuote = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      lineItems: [...lineItems],
      metadata: { ...metadata },
      settings: { ...settings },
    };
    setSavedQuotes((prev) => {
      const next = [quote, ...prev].slice(0, 20);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, [lineItems, metadata, settings]);

  const openQuote = (quote: SavedQuote) => {
    setLineItems(quote.lineItems);
    setMetadata(quote.metadata);
    setSettings(quote.settings);
  };

  const duplicateQuote = (quote: SavedQuote) => {
    setLineItems(quote.lineItems.map((i) => ({ ...i, id: crypto.randomUUID() })));
    setMetadata({ ...quote.metadata, quoteReference: '', rfqNumber: '' });
    setSettings(quote.settings);
  };

  const deleteQuote = (id: string) => {
    setSavedQuotes((prev) => {
      const next = prev.filter((q) => q.id !== id);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── Line item helpers ─────────────────────────────────────────────────────
  const addLineItem = () => setLineItems((prev) => [...prev, makeItem()]);

  const removeLineItem = (id: string) =>
    setLineItems((prev) => prev.length > 1 ? prev.filter((i) => i.id !== id) : prev);

  const duplicateLineItem = (id: string) =>
    setLineItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: crypto.randomUUID() };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });

  const moveLineItem = (id: string, direction: 'up' | 'down') =>
    setLineItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number | null) =>
    setLineItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, [field]: value } : item)
    );

  const selectRecentItem = (id: string, name: string) => {
    const recent = recentItems.find((r) => r.itemName.toLowerCase() === name.toLowerCase());
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, itemName: name, costPrice: recent?.costPrice ?? item.costPrice }
          : item
      )
    );
  };

  const pasteRows = (rows: Array<{ itemName: string; costPrice: number; quantity: number }>) => {
    const newItems: LineItem[] = rows.map((r) => ({
      ...makeItem(),
      itemName: r.itemName,
      costPrice: r.costPrice,
      quantity: r.quantity,
    }));
    setLineItems((prev) => {
      // Replace any single blank row, otherwise append
      const hasOnlyBlank = prev.length === 1 && !prev[0].itemName && !prev[0].costPrice;
      return hasOnlyBlank ? newItems : [...prev, ...newItems];
    });
  };

  const updateMetadata = (field: keyof QuoteMetadata, value: string) =>
    setMetadata((prev) => ({ ...prev, [field]: value }));

  const clearAll = () => {
    setLineItems([makeItem()]);
    setMetadata(EMPTY_METADATA);
    window.localStorage.removeItem(DRAFT_KEY);
    setSaveState('unsaved');
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const filledItems = lineItems.filter((i) => i.itemName || i.costPrice > 0 || i.quantity > 0);
  const warnings = filledItems.length > 0
    ? validateLineItems(
        filledItems.map((i) => ({ ...i })),
        settings.approvalThresholds,
        settings.pricingTiers,
        settings.roundingPolicy,
        settings.quoteLevelDiscountPct
      )
    : [];
  const lineItemNames = Object.fromEntries(lineItems.map((i) => [i.id, i.itemName]));

  // ── Keyboard shortcut: Ctrl/Cmd+S → save to history ──────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToHistory();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveToHistory]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-balance text-4xl font-bold text-foreground">
              UNL Pricing Calculator
            </h1>
            <QuoteStatus saveState={saveState} lastSavedAt={lastSavedAt} />
          </div>
          <div className="flex items-center gap-2">
            <QuoteHistory
              quotes={savedQuotes}
              onOpen={openQuote}
              onDuplicate={duplicateQuote}
              onDelete={deleteQuote}
            />
            <SettingsPanel settings={settings} onSettingsChange={setSettings} />
            <Button variant="outline" size="sm" onClick={saveToHistory}>
              <Save data-icon="inline-start" />
              Save to history
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* ── Validation warnings ──────────────────────────────────── */}
        {warnings.length > 0 && (
          <div className="mb-6">
            <ValidationBanner warnings={warnings} lineItemNames={lineItemNames} />
          </div>
        )}

        {/* ── Main grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Left: inputs */}
          <div className="flex flex-col gap-6">
            <InputSection
              lineItems={lineItems}
              metadata={metadata}
              settings={settings}
              recentItems={recentItems}
              onMetadataChange={updateMetadata}
              onAddItem={addLineItem}
              onRemoveItem={removeLineItem}
              onDuplicateItem={duplicateLineItem}
              onMoveItem={moveLineItem}
              onUpdateItem={updateLineItem}
              onSelectRecentItem={selectRecentItem}
              onPasteRows={pasteRows}
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
                    All line items, metadata, and the current draft will be removed. Your quote
                    history and recent item suggestions will remain available.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep quote</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll}>Clear quote</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Right: outputs */}
          <div className="flex flex-col gap-8">
            <PrimaryOutput lineItems={lineItems} settings={settings} />
            <SecondaryOutput
              lineItems={lineItems}
              metadata={metadata}
              settings={settings}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
