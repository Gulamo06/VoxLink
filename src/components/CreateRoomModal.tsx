import { useState } from 'react';
import { groupService } from '../services/groupService';
import { Group } from '../types';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreated: (group: Group) => void;
}

export default function CreateRoomModal({ onClose, onCreated }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const group = await groupService.createGroup(name.trim(), []);
      onCreated(group);
      onClose();
    } catch (err: any) {
      console.error('Create room error:', err);
      const message = err?.message || err?.details || (typeof err === 'string' ? err : 'Failed to create room.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:rounded-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Create a room</h3>
        <button
          className="rounded-full bg-surface px-3 py-2 text-sm text-text-secondary transition hover:bg-background"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Room name"
        className="w-full rounded-3xl border border-border bg-background px-4 py-4 text-sm text-text outline-none focus:border-white"
      />

      <p className="mt-3 text-sm text-text-secondary">
        Create a shared room for voice notes and messages.
      </p>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

      <button
        className="mt-4 w-full rounded-3xl bg-primary px-4 py-4 text-sm font-semibold text-primary-text transition hover:bg-surface disabled:opacity-50"
        onClick={submit}
        disabled={loading || !name.trim()}
      >
        {loading ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  );
}
