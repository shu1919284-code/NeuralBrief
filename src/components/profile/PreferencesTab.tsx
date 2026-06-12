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
    <div className="space-y-4">
      <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Digest Preferences</h4>

      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={wantsNewsletter}
          onChange={(e) => setWantsNewsletter(e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        <span className="text-sm group-hover:opacity-70 transition-colors">Receive Daily Digest</span>
      </label>

      <div className="space-y-2">
        <label className="text-xs text-text-muted block">Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          disabled={!wantsNewsletter}
          className="w-full bg-surface-dim border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-text-main disabled:opacity-50 cursor-pointer"
        >
          <option value="daily">Daily (7:00 AM IST)</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-text-muted block">Telegram Username (for notifications)</label>
        <div className="flex items-center gap-2 border border-border-subtle rounded px-3 py-2 focus-within:border-text-main transition-colors">
          <span className="text-text-muted text-sm">@</span>
          <input
            type="text"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
            placeholder="your_telegram_username"
            className="bg-transparent border-none outline-none w-full text-sm text-text-main placeholder-text-muted"
          />
        </div>
        <div className="text-[10px] text-text-muted">Optional — for instant Telegram ping when digest is ready</div>
      </div>
    </div>
  );
}
