'use client';

import { useRef, useState } from 'react';
import type { LineItem, QuoteMetadata, QuoteSettings, RecentItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Trash2, Plus, Copy, ChevronsUpDown, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import {
  getMarkupTier,
  calculateUnitPriceResult,
  formatRands,
  parseNumber,
} from '@/lib/pricing';

interface InputSectionProps {
  lineItems: LineItem[];
  metadata: QuoteMetadata;
  settings: QuoteSettings;
  recentItems: RecentItem[];
  onMetadataChange: (field: keyof QuoteMetadata, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onMoveItem: (id: string, direction: 'up' | 'down') => void;
  onUpdateItem: (id: string, field: keyof LineItem, value: string | number | null) => void;
  onSelectRecentItem: (id: string, itemName: string) => void;
  onPasteRows: (rows: Array<{ itemName: string; costPrice: number; quantity: number }>) => void;
}

export function InputSection({
  lineItems,
  metadata,
  settings,
  recentItems,
  onMetadataChange,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onMoveItem,
  onUpdateItem,
  onSelectRecentItem,
  onPasteRows,
}: InputSectionProps) {
  const [metaOpen, setMetaOpen] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return; // single value — let the field handle it normally

    e.preventDefault();
    const rows = lines.map((line) => {
      const cols = line.split('\t');
      return {
        itemName: cols[0]?.trim() ?? '',
        costPrice: parseNumber(cols[1] ?? ''),
        quantity: parseNumber(cols[2] ?? '1'),
      };
    });
    onPasteRows(rows);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Line Items</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">

        {/* ── Quote metadata ─────────────────────────────────────── */}
        <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              Quote Details
              <ChevronsUpDown data-icon="inline-end" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Client Name" htmlFor="meta-client">
                <Input
                  id="meta-client"
                  placeholder="ACME Corp"
                  value={metadata.clientName}
                  onChange={(e) => onMetadataChange('clientName', e.target.value)}
                />
              </Field>
              <Field label="Salesperson" htmlFor="meta-sales">
                <Input
                  id="meta-sales"
                  placeholder="Your name"
                  value={metadata.salesperson}
                  onChange={(e) => onMetadataChange('salesperson', e.target.value)}
                />
              </Field>
              <Field label="RFQ Number" htmlFor="meta-rfq">
                <Input
                  id="meta-rfq"
                  placeholder="RFQ-1042"
                  value={metadata.rfqNumber}
                  onChange={(e) => onMetadataChange('rfqNumber', e.target.value)}
                />
              </Field>
              <Field label="Quote Reference" htmlFor="meta-ref">
                <Input
                  id="meta-ref"
                  placeholder="QT-2026-001"
                  value={metadata.quoteReference}
                  onChange={(e) => onMetadataChange('quoteReference', e.target.value)}
                />
              </Field>
              <Field label="Validity (days)" htmlFor="meta-validity">
                <Input
                  id="meta-validity"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={metadata.validityDays}
                  onChange={(e) => onMetadataChange('validityDays', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Notes" htmlFor="meta-notes">
              <Textarea
                id="meta-notes"
                placeholder="Any additional notes for the quote..."
                rows={2}
                value={metadata.notes}
                onChange={(e) => onMetadataChange('notes', e.target.value)}
              />
            </Field>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* ── Paste hint ─────────────────────────────────────────── */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Upload className="size-3" aria-hidden />
          Paste rows copied from Excel or Sheets into any Item Name field (columns: Name, Cost Price, Quantity)
        </p>

        {/* ── Line items ─────────────────────────────────────────── */}
        {lineItems.map((item, index) => {
          const listId = `recent-${item.id}`;
          const tier = item.costPrice > 0
            ? getMarkupTier(item.costPrice, settings.pricingTiers)
            : null;
          const effectiveMarkup = item.overrideMarkupPct ?? tier?.markup ?? null;
          const priceResult = item.costPrice > 0
            ? calculateUnitPriceResult(item.costPrice, {
                tiers: settings.pricingTiers,
                overrideMarkupPct: item.overrideMarkupPct,
                roundingPolicy: settings.roundingPolicy,
                discountPct: item.discountPct + settings.quoteLevelDiscountPct,
              })
            : null;

          return (
            <section
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
              aria-labelledby={`item-label-${item.id}`}
            >
              {/* Row header */}
              <div className="flex items-center justify-between gap-2">
                <span
                  id={`item-label-${item.id}`}
                  className="text-sm font-medium text-muted-foreground"
                >
                  Item {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onMoveItem(item.id, 'up')}
                    disabled={index === 0}
                    aria-label={`Move item ${index + 1} up`}
                  >
                    <ArrowUp data-icon="inline-start" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onMoveItem(item.id, 'down')}
                    disabled={index === lineItems.length - 1}
                    aria-label={`Move item ${index + 1} down`}
                  >
                    <ArrowDown data-icon="inline-start" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDuplicateItem(item.id)}
                    aria-label={`Duplicate item ${index + 1}`}
                  >
                    <Copy data-icon="inline-start" />
                  </Button>
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
              </div>

              {/* Item name with autocomplete */}
              <Field label="Item Name" htmlFor={`item-name-${item.id}`}>
                <Input
                  id={`item-name-${item.id}`}
                  type="text"
                  list={listId}
                  autoComplete="off"
                  placeholder="e.g., Custom Widget Model X"
                  value={item.itemName}
                  onPaste={handlePaste}
                  onChange={(e) => onSelectRecentItem(item.id, e.target.value)}
                />
                <datalist id={listId}>
                  {recentItems.map((r) => (
                    <option key={r.itemName} value={r.itemName}>
                      {formatRands(r.costPrice)}
                    </option>
                  ))}
                </datalist>
              </Field>

              {/* Cost price + quantity */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cost Price (R)" htmlFor={`cost-${item.id}`}>
                  <Input
                    id={`cost-${item.id}`}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="0"
                    value={item.costPrice || ''}
                    onPaste={handlePaste}
                    onChange={(e) => onUpdateItem(item.id, 'costPrice', parseNumber(e.target.value))}
                  />
                </Field>
                <Field label="Quantity" htmlFor={`qty-${item.id}`}>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="0"
                    value={item.quantity || ''}
                    onChange={(e) => onUpdateItem(item.id, 'quantity', parseNumber(e.target.value))}
                  />
                </Field>
              </div>

              {/* Inline tier badge + markup override */}
              {tier && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {tier.label} — {effectiveMarkup}% markup
                  </Badge>
                  {item.overrideMarkupPct != null && (
                    <Badge variant="secondary" className="text-xs">
                      Override active
                    </Badge>
                  )}
                  {priceResult && (
                    <span className="text-xs text-muted-foreground">
                      Unit: {formatRands(priceResult.roundedPrice)} &middot; Margin: {priceResult.marginPct.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}

              {/* Markup override + line discount */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                    Advanced pricing
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 grid grid-cols-2 gap-3">
                  <Field label="Markup override (%)" htmlFor={`override-${item.id}`}>
                    <Input
                      id={`override-${item.id}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder={`Default: ${tier?.markup ?? '—'}%`}
                      value={item.overrideMarkupPct ?? ''}
                      onChange={(e) =>
                        onUpdateItem(
                          item.id,
                          'overrideMarkupPct',
                          e.target.value === '' ? null : parseFloat(e.target.value)
                        )
                      }
                    />
                  </Field>
                  <Field label="Line discount (%)" htmlFor={`disc-${item.id}`}>
                    <Input
                      id={`disc-${item.id}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={item.discountPct || ''}
                      onChange={(e) =>
                        onUpdateItem(item.id, 'discountPct', parseFloat(e.target.value) || 0)
                      }
                    />
                  </Field>
                </CollapsibleContent>
              </Collapsible>
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

// ── Small helper ──────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
