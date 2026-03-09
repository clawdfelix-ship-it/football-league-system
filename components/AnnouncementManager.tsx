'use client';

import { useState } from 'react';
import { addAnnouncement, deleteAnnouncement } from '@/lib/actions';
import type { Announcement } from '@/lib/schema';

export function AnnouncementManager({ 
  announcements = [] 
}: { 
  announcements: Announcement[] 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert('Failed to delete announcement');
      }
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const dateStr = formData.get('date')?.toString();
      const timeStr = formData.get('time')?.toString();
      const content = formData.get('content')?.toString();
      const title = formData.get('title')?.toString();

      if (!dateStr || !timeStr || !content) {
        alert('Please fill in all required fields');
        return;
      }

      const date = new Date(`${dateStr}T${timeStr}`);

      const result = await addAnnouncement({
        title: title || 'Venue Arrangement',
        content,
        date,
      });

      if (result.success) {
        setIsAdding(false);
        window.location.reload();
      } else {
        alert('Failed to add announcement: ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const VENUES = [
    '跑馬地遊樂場 8 號場 (Happy Valley Recreation Ground No. 8)',
    '中山紀念公園 (Sun Yat Sen Memorial Park)',
    '鰂魚涌公園 1 號場 (Quarry Bay Park No. 1, near Taikoo Shing)',
    '鰂魚涌公園 2 號場 (Quarry Bay Park No. 2, near Quarry Bay Station)',
    'TBC'
  ];

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-4 shadow-sm sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Venue Announcements</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancel' : 'Add New'}
        </button>
      </div>

      {isAdding && (
        <form action={handleSubmit} className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title (Optional)</label>
            <input 
              name="title" 
              defaultValue="Venue Arrangement"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Date</label>
              <input 
                name="date" 
                type="date"
                required
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time</label>
              <input 
                name="time" 
                type="time"
                required
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Venue Address / Details</label>
            <input 
              name="content" 
              list="venues"
              required
              placeholder="Select or type venue"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
            <datalist id="venues">
              {VENUES.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No announcements yet.</p>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="flex justify-between items-start p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{item.title}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-zinc-400 hover:text-red-500 p-1"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
