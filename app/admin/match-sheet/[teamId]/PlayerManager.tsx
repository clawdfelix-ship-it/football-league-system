'use client';

import { useState, useRef } from 'react';
import { addPlayer, deletePlayer, uploadPlayerPhoto } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import type { Player } from '@/lib/schema';

export function PlayerManager({ teamName, players = [] }: { teamName: string, players?: Player[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get('name') as string;
      const number = parseInt(formData.get('number') as string);
      const position = formData.get('position') as string;
      const identityPrefix = formData.get('identityPrefix') as string;
      const photoFile = formData.get('photo') as File;

      // 1. Add player first
      const newPlayerArray = await addPlayer({
        name,
        team: teamName,
        number,
        position,
        identityPrefix
      });

      const newPlayer = newPlayerArray[0];

      // 2. Upload photo if exists
      if (photoFile && photoFile.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', photoFile);
        uploadFormData.append('playerId', newPlayer.id.toString());
        await uploadPlayerPhoto(uploadFormData);
      }

      setIsAdding(false);
      router.refresh();
    } catch (error) {
      alert('Failed to add player: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Player List */}
      {players.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-sm">Team Roster ({players.length})</h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 relative group">
                    {player.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        {player.name.charAt(0)}
                      </div>
                    )}
                    {/* Small upload overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <UploadPhotoButton playerId={player.id} iconOnly />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-gray-500">#{player.jerseyNumber} • {player.position}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DeletePlayerButton playerId={player.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Button */}
      <div className="print:hidden flex justify-center w-full">
        {isAdding ? (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <form 
              onSubmit={handleSubmit}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl max-w-md w-full space-y-5 text-white"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-bold text-white">Add New Player</h3>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Name</label>
                <input 
                  name="name" 
                  required 
                  className="w-full border border-zinc-700 bg-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  placeholder="Player Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Jersey No.</label>
                  <input 
                    name="number" 
                    type="number" 
                    required 
                    min="0"
                    max="99"
                    className="w-full border border-zinc-700 bg-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    placeholder="0-99"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Position</label>
                  <select 
                    name="position" 
                    required 
                    className="w-full border border-zinc-700 bg-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 appearance-none"
                  >
                    <option value="FW">Forward (FW)</option>
                    <option value="MF">Midfielder (MF)</option>
                    <option value="DF">Defender (DF)</option>
                    <option value="GK">Goalkeeper (GK)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">HKID (First 3 chars)</label>
                <input 
                  name="identityPrefix"
                  required
                  maxLength={3}
                  className="w-full border border-zinc-700 bg-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 uppercase"
                  placeholder="e.g. A12"
                />
                <p className="text-xs text-zinc-500">Only the first 3 characters are required for verification.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Photo (Optional)</label>
                <input 
                  name="photo"
                  type="file" 
                  accept="image/*"
                  className="w-full border border-zinc-700 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-700 bg-transparent text-white rounded-lg hover:bg-zinc-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50 font-bold transition-colors"
                >
                  {isLoading ? 'Adding...' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded-xl font-bold shadow hover:bg-zinc-800 flex items-center justify-center gap-2 transition-colors border border-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add New Player
          </button>
        )}
      </div>
    </div>
  );
}

export function DeletePlayerButton({ playerId }: { playerId: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (confirm('Are you sure you want to remove this player?')) {
      try {
        const result = await deletePlayer(playerId);
        if (result && !result.success) {
             alert('Failed to delete player: ' + result.message);
        } else {
             router.refresh();
        }
      } catch (error) {
        alert('Failed to delete player: ' + (error as Error).message);
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title="Remove Player"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  );
}

export function UploadPhotoButton({ playerId, iconOnly = false }: { playerId: number, iconOnly?: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('playerId', playerId.toString());
      
      await uploadPlayerPhoto(formData);
      router.refresh();
    } catch (error) {
      alert('Failed to upload photo');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={iconOnly 
          ? "text-white hover:text-blue-200 transition-colors"
          : "absolute bottom-0 right-0 p-1 text-blue-500 opacity-0 group-hover:opacity-100 hover:bg-blue-50 rounded print:hidden transition-opacity z-10 bg-white shadow-sm border border-blue-100"
        }
        title="Upload Photo"
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" x2="12" y1="3" y2="15"/>
          </svg>
        )}
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </>
  );
}
