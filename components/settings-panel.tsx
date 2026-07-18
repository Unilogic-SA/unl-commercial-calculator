'use client';

import type { QuoteSettings, PricingTier } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { ROUNDING_LABELS, DEFAULT_PRICING_TIERS, DEFAULT_APPROVAL_THRESHOLDS } from '@/lib/pricing';
import type { RoundingPolicy } from '@/lib/pricing';
import { formatRands, parseNumber } from '@/lib/pricing';

interface SettingsPanelProps {
  settings: QuoteSettings;
  onSettingsChange: (settings: QuoteSettings) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const update = <K extends keyof QuoteSettings>(key: K, value: QuoteSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const updateTier = (index: number, field: keyof PricingTier, raw: string) => {
    const tiers = settings.pricingTiers.map((t, i) => {
      if (i !== index) return t;
      if (field === 'markup') return { ...t, markup: parseFloat(raw) || 0 };
      if (field === 'maxCost') return { ...t, maxCost: raw === '' ? null : parseNumber(raw) };
      return t;
    });
    update('pricingTiers', tiers);
  };

  const resetTiers = () => update('pricingTiers', DEFAULT_PRICING_TIERS.map((t) => ({ ...t })));
  const resetThresholds = () => update('approvalThresholds', { ...DEFAULT_APPROVAL_THRESHOLDS });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Open settings">
          <Settings data-icon="inline-start" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Pricing Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6">

          {/* Rounding policy */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Rounding Policy</h3>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Rounding policy">
              {(Object.keys(ROUNDING_LABELS) as RoundingPolicy[]).map((policy) => (
                <Button
                  key={policy}
                  size="sm"
                  variant={settings.roundingPolicy === policy ? 'default' : 'outline'}
                  onClick={() => update('roundingPolicy', policy)}
                >
                  {ROUNDING_LABELS[policy]}
                </Button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Quote-level discount */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Quote-Level Discount</h3>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="quote-discount" className="text-xs text-muted-foreground">
                Applied to every line item (%)
              </label>
              <Input
                id="quote-discount"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0"
                value={settings.quoteLevelDiscountPct || ''}
                onChange={(e) => update('quoteLevelDiscountPct', parseFloat(e.target.value) || 0)}
              />
            </div>
          </section>

          <Separator />

          {/* Markup tiers */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Markup Tiers</h3>
              <Button variant="ghost" size="sm" onClick={resetTiers}>Reset to defaults</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tiers are applied in order. The last tier has no upper limit.
            </p>
            <div className="flex flex-col gap-3">
              {settings.pricingTiers.map((tier, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Max cost (R)</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="No limit"
                      value={tier.maxCost ?? ''}
                      disabled={i === settings.pricingTiers.length - 1}
                      onChange={(e) => updateTier(i, 'maxCost', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Markup %</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={tier.markup}
                      onChange={(e) => updateTier(i, 'markup', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Approval thresholds */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Approval Thresholds</h3>
              <Button variant="ghost" size="sm" onClick={resetThresholds}>Reset</Button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="min-margin" className="text-xs text-muted-foreground">
                  Flag when margin is below (%)
                </label>
                <Input
                  id="min-margin"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settings.approvalThresholds.minMarginPct}
                  onChange={(e) =>
                    update('approvalThresholds', {
                      ...settings.approvalThresholds,
                      minMarginPct: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="max-total" className="text-xs text-muted-foreground">
                  Flag when grand total exceeds (R)
                  {' '}
                  <span className="text-foreground font-medium">
                    {formatRands(settings.approvalThresholds.maxTotalAmount)}
                  </span>
                </label>
                <Input
                  id="max-total"
                  type="number"
                  min="0"
                  step="1000"
                  value={settings.approvalThresholds.maxTotalAmount}
                  onChange={(e) =>
                    update('approvalThresholds', {
                      ...settings.approvalThresholds,
                      maxTotalAmount: parseNumber(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
}
