import { useAudioDevices } from '../hooks/useAudioDevices';
import { Volume2, Mic } from 'lucide-react';

interface AudioDevicePickerProps {
  onInputChange?: (deviceId: string, stream: MediaStream) => Promise<void>;
  onOutputChange?: (deviceId: string) => Promise<void>;
  currentStream?: MediaStream;
  audioElement?: HTMLAudioElement | HTMLVideoElement;
}

export default function AudioDevicePicker({
  onInputChange,
  onOutputChange,
  currentStream,
  audioElement
}: AudioDevicePickerProps) {
  const {
    inputDevices,
    outputDevices,
    currentInputDevice,
    switchInput,
    switchOutput,
    loading
  } = useAudioDevices();

  const handleInputChange = async (deviceId: string) => {
    try {
      const newStream = await switchInput(deviceId, currentStream);
      if (onInputChange) {
        await onInputChange(deviceId, newStream);
      }
    } catch (error) {
      console.error('Failed to switch input device:', error);
    }
  };

  const handleOutputChange = async (deviceId: string) => {
    if (!audioElement) return;
    try {
      await switchOutput(audioElement, deviceId);
      if (onOutputChange) {
        await onOutputChange(deviceId);
      }
    } catch (error) {
      console.error('Failed to switch output device:', error);
    }
  };

  if (loading || (inputDevices.length === 0 && outputDevices.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
      {/* Input Devices */}
      {inputDevices.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2">
            <Mic className="h-3 w-3" />
            Microphone
          </label>
          <select
            value={currentInputDevice?.deviceId || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-white focus:ring-1 focus:ring-white/10"
          >
            {inputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Output Devices */}
      {outputDevices.length > 0 && audioElement && (
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2">
            <Volume2 className="h-3 w-3" />
            Speaker
          </label>
          <select
            onChange={(e) => handleOutputChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-white focus:ring-1 focus:ring-white/10"
          >
            <option value="">Default Speaker</option>
            {outputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
