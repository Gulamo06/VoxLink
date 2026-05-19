import { useState } from 'react';
import { useContactsStore } from '../store/useContactsStore';
import { contactService } from '../services/contactService';
import { useQRScanner } from '../hooks/useQRScanner';

interface AddContactModalProps {
  onClose: () => void;
}

export default function AddContactModal({ onClose }: AddContactModalProps) {
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addContact = useContactsStore((state) => state.addContact);

  const { containerId } = useQRScanner((decodedText) => {
    if (!decodedText) return;
    setLoading(true);
    contactService
      .addContact({ deepLink: decodedText })
      .then((contact) => {
        addContact(contact);
        onClose();
      })
      .catch(() => setError('Failed to add contact from QR code.'))
      .finally(() => {
        setScanning(false);
        setLoading(false);
      });
  }, scanning);

  async function submit() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const contact = await contactService.addContact({ username: query.trim() });
      addContact(contact);
      onClose();
    } catch {
      setError('Failed to add contact. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:rounded-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Add a contact</h3>
        <button
          className="rounded-full bg-surface px-3 py-2 text-sm text-text-secondary transition hover:bg-background"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="username or voxlink:// link"
        className="w-full rounded-3xl border border-border bg-background px-4 py-4 text-sm text-text outline-none focus:border-white"
      />
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      <button
        className="mt-4 w-full rounded-3xl bg-primary px-4 py-4 text-sm font-semibold text-primary-text transition hover:bg-surface disabled:opacity-50"
        onClick={submit}
        disabled={loading || !query.trim()}
      >
        {loading ? 'Adding…' : 'Add Contact'}
      </button>
      <button
        className="mt-3 w-full rounded-3xl border border-border bg-background px-4 py-4 text-sm text-text transition hover:bg-surface"
        onClick={() => setScanning(!scanning)}
      >
        {scanning ? 'Stop scanning' : 'Scan QR code'}
      </button>
      {scanning ? <div id={containerId} className="mt-4 h-72 rounded-3xl bg-surface" /> : null}
    </div>
  );
}
