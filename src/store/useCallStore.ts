import { create } from 'zustand';
import { CallState } from '../types';

interface CallStore extends CallState {
  startCall: (channel: string, hostId: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  setParticipants: (participants: Record<string, CallState['participants'][string]>) => void;
}

export const useCallStore = create<CallStore>((set) => ({
  active: false,
  muted: false,
  speakerEnabled: true,
  participants: {},
  startCall: (channel, hostId) =>
    set({ active: true, channel, hostId, startedAt: Date.now(), participants: {}, muted: false, speakerEnabled: true }),
  endCall: () => set({ active: false, channel: undefined, hostId: undefined, startedAt: undefined, participants: {} }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  toggleSpeaker: () => set((state) => ({ speakerEnabled: !state.speakerEnabled })),
  setParticipants: (participants) => set({ participants })
}));
