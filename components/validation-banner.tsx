'use client';

import type { ValidationWarning } from '@/lib/pricing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, XCircle } from 'lucide-react';

interface ValidationBannerProps {
  warnings: ValidationWarning[];
  lineItemNames: Record<string, string>; // id -> itemName
}

export function ValidationBanner({ warnings, lineItemNames }: ValidationBannerProps) {
  if (warnings.length === 0) return null;

  const errors = warnings.filter((w) => w.severity === 'error');
  const cautions = warnings.filter((w) => w.severity === 'warning');

  return (
    <div className="flex flex-col gap-2" role="alert" aria-label="Quote warnings">
      {errors.map((w, i) => (
        <Alert key={`e-${i}`} variant="destructive" className="py-2">
          <XCircle className="size-4" aria-hidden />
          <AlertDescription className="text-xs">
            {w.lineItemId && lineItemNames[w.lineItemId]
              ? <><span className="font-medium">{lineItemNames[w.lineItemId]}:</span> {w.message}</>
              : w.message}
          </AlertDescription>
        </Alert>
      ))}
      {cautions.map((w, i) => (
        <Alert key={`w-${i}`} className="border-muted-foreground/30 py-2">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertDescription className="text-xs">
            {w.lineItemId && lineItemNames[w.lineItemId]
              ? <><span className="font-medium">{lineItemNames[w.lineItemId]}:</span> {w.message}</>
              : w.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
