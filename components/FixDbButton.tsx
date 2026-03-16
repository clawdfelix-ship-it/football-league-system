'use client';

import { useState } from 'react';

export default function FixDbButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFixDb = async () => {
    if (!confirm('This will attempt to update the database schema. Continue?')) return;
    
    setStatus('loading');
    try {
      const res = await fetch('/api/init-db', { method: 'POST' });
      const raw = await res.text();
      const data = raw ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : {};
      if (!res.ok) throw new Error((data as any).message || raw || 'Failed to update DB');
      
      setStatus('success');
      setMessage('Database updated successfully! Please try adding a player now.');
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (e) {
      setStatus('error');
      setMessage((e as Error).message);
    }
  };

  if (status === 'idle') {
    return (
      <button
        onClick={handleFixDb}
        className="text-xs text-amber-500 hover:text-amber-400 underline underline-offset-2"
      >
        Fix Database Schema
      </button>
    );
  }

  return (
    <span className={`text-xs ${status === 'success' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
      {status === 'loading' ? 'Updating...' : message}
    </span>
  );
}
