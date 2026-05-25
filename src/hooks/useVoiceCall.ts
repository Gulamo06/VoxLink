import { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  IRemoteAudioTrack
} from 'agora-rtc-sdk-ng';
import { useAuthStore } from '../store/useAuthStore';
import { useCallStore } from '../store/useCallStore';

// Singleton client — created once for the entire app lifetime
let sharedClient: IAgoraRTCClient | null = null;

function getAgoraClient(): IAgoraRTCClient {
  if (!sharedClient) {
    sharedClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }
  return sharedClient;
}

export function useVoiceCall() {
  const localTrackRef = useRef<ILocalAudioTrack | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<string[]>([]);
  const { currentUser } = useAuthStore();
  const { startCall, endCall, setParticipants, toggleMute, muted } = useCallStore();

  const client = getAgoraClient();

  useEffect(() => {
    const handlePublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
      setRemoteStreams((current) => [...current, user.uid.toString()]);
    };

    const handleLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteStreams((current) => current.filter((uid) => uid !== user.uid.toString()));
    };

    client.on('user-published', handlePublished);
    client.on('user-left', handleLeft);

    return () => {
      client.off('user-published', handlePublished);
      client.off('user-left', handleLeft);
    };
  }, [client]);

  async function joinChannel(channel: string, token: string, uid: string) {
    if (!currentUser) return;

    await client.join(import.meta.env.VITE_AGORA_APP_ID as string, channel, token, uid);
    const track = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish([track]);
    localTrackRef.current = track;

    startCall(channel, currentUser.id);
    setParticipants({ [currentUser.id]: 'online' });
  }

  function leaveChannel() {
    localTrackRef.current?.close();
    localTrackRef.current = null;
    client.leave();
    endCall();
  }

  function toggleLocalMute() {
    if (!localTrackRef.current) return;
    localTrackRef.current.setEnabled(!muted);
    toggleMute();
  }

  return {
    joinChannel,
    leaveChannel,
    toggleLocalMute,
    muted,
    remoteStreams,
    client
  };
}
