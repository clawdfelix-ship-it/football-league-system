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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Venue Announcements</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancel' : 'Add New'}
        </button>
      </div>

      {isAdding && (
        <form action={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Title (Optional)</label>
            <input 
              name="title" 
              defaultValue="Venue Arrangement"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input 
                name="date" 
                type="date"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Time</label>
              <input 
                name="time" 
                type="time"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Venue Address / Details</label>
            <input 
              name="content" 
              list="venues"
              required
              placeholder="Select or type venue"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <datalist id="venues">
              {VENUES.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary w-full h-11"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No announcements yet.</p>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <div className="font-semibold text-sm text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-slate-400 hover:text-red-500 p-1"
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
