import React from 'react';

interface PreferencesTabProps {
  wantsNewsletter: boolean;
  setWantsNewsletter: (val: boolean) => void;
  frequency: string;
  setFrequency: (val: string) => void;
  telegramUsername: string;
  setTelegramUsername: (val: string) => void;
}

export function PreferencesTab({
  wantsNewsletter,
  setWantsNewsletter,
  frequency,
  setFrequency,
  telegramUsername,
  setTelegramUsername,
}: PreferencesTabProps) {
  return (
    <div className="space-y-5">
      <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Digest Preferences</h4>

      {/* Custom toggle — replaces browser native checkbox */}
      <label className="flex items-center gap-3 cursor-pointer group select-none">
        {/* Hidden native input for accessibility */}
        <input
          type="checkbox"
          checked={wantsNewsletter}
          onChange={(e) => setWantsNewsletter(e.target.checked)}
          className="sr-only"
          id="digest-toggle"
        />
        {/* Visual toggle track */}
        <span
          className="relative inline-flex items-center flex-shrink-0"
          style={{ width: 32, height: 18 }}
        >
          <span
            className="block rounded-full border transition-all duration-200"
            style={{
              width: 32,
              height: 18,
              background: wantsNewsletter ? 'var(--color-text-main)' : 'transparent',
              borderColor: wantsNewsletter ? 'var(--color-text-main)' : 'var(--color-border-subtle)',
            }}
          />
          <span
            className="absolute top-[2px] rounded-full transition-all duration-200"
            style={{
              width: 14,
              height: 14,
              left: wantsNewsletter ? 16 : 2,
              background: wantsNewsletter ? 'var(--color-surface)' : 'var(--color-text-muted)',
            }}
          />
        </span>
        <span className="text-sm group-hover:opacity-70 transition-opacity">Receive Weekly Digest</span>
      </label>

      {/* Custom styled frequency select */}
      <div className="space-y-2">
        <label htmlFor="digest-frequency" className="text-[10px] uppercase tracking-widest font-bold text-text-muted block">
          Frequency
        </label>
        <div className="relative">
          <select
            id="digest-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            disabled={!wantsNewsletter}
            className="w-full appearance-none bg-transparent border border-border-subtle px-3 py-2 pr-8 text-sm text-text-main focus:outline-none focus:border-text-main/50 disabled:opacity-50 cursor-pointer transition-colors"
            style={{ WebkitAppearance: 'none' }}
          >
            <option value="daily" style={{ background: 'var(--color-surface)', color: 'var(--color-text-main)' }}>Daily (07:00 UTC)</option>
            <option value="weekly" style={{ background: 'var(--color-surface)', color: 'var(--color-text-main)' }}>Weekly (Monday)</option>
          </select>
          {/* Custom dropdown chevron */}
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
            width="10" height="6" viewBox="0 0 10 6" fill="none"
          >
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Telegram input */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted block">
          Telegram Username <span className="opacity-50 normal-case">(optional)</span>
        </label>
        <div className="flex items-center gap-2 border border-border-subtle px-3 py-2 focus-within:border-text-main/50 transition-colors">
          <span className="text-text-muted text-sm select-none">@</span>
          <input
            type="text"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
            placeholder="your_telegram_username"
            className="bg-transparent border-none outline-none w-full text-sm text-text-main placeholder-text-muted/40"
          />
        </div>
        <div className="text-[10px] text-text-muted">Instant ping when your digest is ready</div>
      </div>
    </div>
  );
}
