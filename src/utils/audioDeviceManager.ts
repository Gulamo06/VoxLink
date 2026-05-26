/**
 * Audio Device Manager - Handle audio input/output device switching
 * Provides seamless device switching for microphone and speaker selection
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export const audioDeviceManager = {
  /**
   * Get all available audio devices
   */
  async getAudioDevices(): Promise<{
    inputDevices: AudioDevice[];
    outputDevices: AudioDevice[];
  }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const inputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId}`,
          kind: 'audioinput' as const
        }));

      const outputDevices = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId}`,
          kind: 'audiooutput' as const
        }));

      return { inputDevices, outputDevices };
    } catch (error) {
      console.error('Error getting audio devices:', error);
      return { inputDevices: [], outputDevices: [] };
    }
  },

  /**
   * Get current active audio input device
   */
  async getCurrentInputDevice(): Promise<AudioDevice | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      
      if (!track) return null;

      const settings = track.getSettings();
      const devices = await navigator.mediaDevices.enumerateDevices();
      const device = devices.find(d => d.deviceId === settings.deviceId);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      return device ? {
        deviceId: device.deviceId,
        label: device.label || 'Default Microphone',
        kind: 'audioinput'
      } : null;
    } catch (error) {
      console.error('Error getting current input device:', error);
      return null;
    }
  },

  /**
   * Switch audio input device
   */
  async switchInputDevice(deviceId: string, stream?: MediaStream): Promise<MediaStream> {
    try {
      // Stop existing stream if provided
      if (stream) {
        stream.getAudioTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId }
        }
      });

      return newStream;
    } catch (error) {
      console.error('Error switching input device:', error);
      throw new Error(`Failed to switch to audio device: ${deviceId}`);
    }
  },

  /**
   * Switch audio output device (speaker)
   */
  async switchOutputDevice(audioElement: HTMLAudioElement | HTMLVideoElement, deviceId: string): Promise<void> {
    try {
      // Check if setSinkId is available
      if (!audioElement.setSinkId) {
        throw new Error('Audio output device selection not supported in this browser');
      }

      await audioElement.setSinkId(deviceId);
    } catch (error) {
      console.error('Error switching output device:', error);
      throw new Error(`Failed to switch to speaker device: ${deviceId}`);
    }
  },

  /**
   * Test audio device - play a test tone
   */
  async testAudioDevice(deviceId: string): Promise<boolean> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple test tone (440 Hz sine wave for 0.5 seconds)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      return true;
    } catch (error) {
      console.error('Error testing audio device:', error);
      return false;
    }
  },

  /**
   * Listen for device changes
   */
  onDeviceChange(callback: () => void): void {
    if (!navigator.mediaDevices) return;
    
    navigator.mediaDevices.addEventListener('devicechange', callback);
  },

  /**
   * Remove device change listener
   */
  offDeviceChange(callback: () => void): void {
    if (!navigator.mediaDevices) return;
    
    navigator.mediaDevices.removeEventListener('devicechange', callback);
  }
};
