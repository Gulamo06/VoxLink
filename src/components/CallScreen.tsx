import { useMemo } from 'react';
import { Mic, MicOff, Volume2, PhoneOff, Users } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useVoiceCall } from '../hooks/useVoiceCall';
import Waveform from './Waveform';

export default function CallScreen() {
  const { active, channel, muted, speakerEnabled, participants, startedAt } = useCallStore();
  const { toggleLocalMute, leaveChannel } = useVoiceCall();

  const duration = useMemo(() => {
    if (!startedAt) return '00:00';
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, [startedAt]);

  if (!active) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-border bg-surface p-5 text-text sm:relative sm:bottom-auto sm:inset-auto">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">Live voice call</p>
          <h2 className="text-xl font-semibold text-text">{channel}</h2>
        </div>
        <div className="rounded-3xl bg-background px-3 py-2 text-sm text-text-secondary">{duration}</div>
      </div>
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2 rounded-3xl bg-background p-4 text-text-secondary">
          <Users className="text-text" />
          <span>{Object.keys(participants).length} participant(s)</span>
        </div>
        <Waveform />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={toggleLocalMute} className="rounded-2xl bg-background px-4 py-3 text-sm text-text transition hover:bg-surface">
          {muted ? <MicOff className="inline h-5 w-5" /> : <Mic className="inline h-5 w-5" />}<span className="ml-2">{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button className="rounded-2xl bg-background px-4 py-3 text-sm text-text transition hover:bg-surface">
          <Volume2 className="inline h-5 w-5" /><span className="ml-2">{speakerEnabled ? 'Speaker On' : 'Speaker Off'}</span>
        </button>
        <button onClick={leaveChannel} className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-surface">
          <PhoneOff className="inline h-5 w-5" /><span className="ml-2">End</span>
        </button>
      </div>
    </div>
  );
}
