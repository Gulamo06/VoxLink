import { useState } from 'react';
import { useContactsStore } from '../store/useContactsStore';
import { contactService } from '../services/contactService';
import { useQRScanner } from '../hooks/useQRScanner';
import { parseVoxLinkInvite } from '../utils/generateLink';
import { Loader2 } from 'lucide-react';

interface AddContactModalProps {
  onClose: () => void;
}

export default function AddContactModal({ onClose }: AddContactModalProps) {
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const addContact = useContactsStore((state) => state.addContact);

  const { containerId } = useQRScanner((decodedText) => {
    if (!decodedText) return;
    handleQRScan(decodedText);
  }, scanning);

  async function handleQRScan(decodedText: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse the QR code data
      const inviteData = parseVoxLinkInvite(decodedText);

      if (!inviteData) {
        throw new Error('Invalid VoxLink QR code. Please try again.');
      }

      // Add the contact
      const contact = await contactService.addContact({ 
        deepLink: JSON.stringify(inviteData)
      });
      
      addContact(contact);
      setSuccess(`Added ${contact.username} to your contacts!`);
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        setScanning(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('QR code add contact error:', err);
      setError(err?.message || err?.details || 'Failed to add contact from QR code. Please try again.');
      setScanning(false);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contact = await contactService.addContact({ username: query.trim() });
      addContact(contact);
      setSuccess(`Added ${contact.username} to your contacts!`);
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Manual add contact error:', err);
      setError(err?.message || err?.details || 'Failed to add contact. Please check the username and try again.');
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

      {/* Manual entry */}
      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-widest text-text-secondary">Search by username</label>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submit()}
            placeholder="Enter username or voxlink ID"
            className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text outline-none focus:border-white focus:ring-1 focus:ring-white/10"
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            ✓ {success}
          </p>
        ) : null}

        <button
          className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-primary/90 disabled:opacity-50"
          onClick={submit}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </span>
          ) : (
            'Add Contact'
          )}
        </button>
      </div>

      {/* QR Scanner */}
      <div className="mt-6 border-t border-border pt-6">
        <button
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text transition hover:bg-surface disabled:opacity-50"
          onClick={() => setScanning(!scanning)}
          disabled={loading}
        >
          {scanning ? '✕ Stop scanning' : '📱 Scan QR code'}
        </button>
        
        {scanning ? (
          <div className="mt-4">
            <p className="mb-3 text-center text-xs text-text-secondary">
              Position the QR code in the frame
            </p>
            <div 
              id={containerId} 
              className="mx-auto h-64 w-64 rounded-2xl border border-border bg-background"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
