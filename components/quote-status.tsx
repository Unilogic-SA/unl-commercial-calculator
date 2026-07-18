'use client';

import { Clock, Save, AlertCircle } from 'lucide-react';

export type SaveState = 'unsaved' | 'saved' | 'error';

interface QuoteStatusProps {
  saveState: SaveState;
  lastSavedAt: Date | null;
}

export function QuoteStatus({ saveState, lastSavedAt }: QuoteStatusProps) {
  const timeLabel = lastSavedAt
    ? lastSavedAt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
      {saveState === 'saved' && (
        <>
          <Save className="size-3" aria-hidden />
          <span>Saved locally{timeLabel ? ` at ${timeLabel}` : ''}</span>
        </>
      )}
      {saveState === 'unsaved' && (
        <>
          <Clock className="size-3" aria-hidden />
          <span>Unsaved draft</span>
        </>
      )}
      {saveState === 'error' && (
        <>
          <AlertCircle className="size-3" aria-hidden />
          <span>Save failed — storage may be unavailable</span>
        </>
      )}
    </div>
  );
}
