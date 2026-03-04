'use client';

import { useState } from 'react';
import { addPlayer, deletePlayer } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export function PlayerManager({ teamName }: { teamName: string }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const name = formData.get('name') as string;
      const number = parseInt(formData.get('number') as string);
      const position = formData.get('position') as string;

      await addPlayer({
        name,
        team: teamName,
        number,
        position
      });

      setIsAdding(false);
      router.refresh();
    } catch (error) {
      alert('Failed to add player: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="print:hidden mb-6 flex justify-center">
      {isAdding ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form 
            action={handleSubmit}
            className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full space-y-4"
          >
            <h3 className="text-lg font-bold">Add New Player</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input 
                name="name" 
                required 
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Player Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Jersey Number</label>
              <input 
                name="number" 
                type="number" 
                required 
                min="0"
                max="99"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0-99"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <select 
                name="position" 
                required 
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="FW">Forward (FW)</option>
                <option value="MF">Midfielder (MF)</option>
                <option value="DF">Defender (DF)</option>
                <option value="GK">Goalkeeper (GK)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-green-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add New Player
        </button>
      )}
    </div>
  );
}

export function DeletePlayerButton({ playerId }: { playerId: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (confirm('Are you sure you want to remove this player?')) {
      try {
        await deletePlayer(playerId);
        router.refresh();
      } catch (error) {
        alert('Failed to delete player');
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="absolute top-0 right-0 p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded print:hidden transition-opacity"
      title="Remove Player"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  );
}
