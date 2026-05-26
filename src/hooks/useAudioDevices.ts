import { useState, useEffect, useCallback } from 'react';
import { audioDeviceManager, AudioDevice } from '../utils/audioDeviceManager';

interface UseAudioDevicesReturn {
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  currentInputDevice: AudioDevice | null;
  switchInput: (deviceId: string, currentStream?: MediaStream) => Promise<MediaStream>;
  switchOutput: (audioElement: HTMLAudioElement | HTMLVideoElement, deviceId: string) => Promise<void>;
  testDevice: (deviceId: string) => Promise<boolean>;
  loading: boolean;
}

/**
 * Hook to manage audio device switching during calls
 */
export function useAudioDevices(): UseAudioDevicesReturn {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [currentInputDevice, setCurrentInputDevice] = useState<AudioDevice | null>(null);
  const [loading, setLoading] = useState(true);

  // Load available devices on mount and when they change
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const { inputDevices, outputDevices } = await audioDeviceManager.getAudioDevices();
        setInputDevices(inputDevices);
        setOutputDevices(outputDevices);

        const current = await audioDeviceManager.getCurrentInputDevice();
        setCurrentInputDevice(current);
      } catch (error) {
        console.error('Error loading audio devices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      loadDevices();
    };

    audioDeviceManager.onDeviceChange(handleDeviceChange);

    return () => {
      audioDeviceManager.offDeviceChange(handleDeviceChange);
    };
  }, []);

  const switchInput = useCallback(async (deviceId: string, currentStream?: MediaStream) => {
    try {
      const newStream = await audioDeviceManager.switchInputDevice(deviceId, currentStream);
      
      const devices = await audioDeviceManager.getAudioDevices();
      const device = devices.inputDevices.find(d => d.deviceId === deviceId);
      if (device) {
        setCurrentInputDevice(device);
      }

      return newStream;
    } catch (error) {
      console.error('Error switching input device:', error);
      throw error;
    }
  }, []);

  const switchOutput = useCallback(async (audioElement: HTMLAudioElement | HTMLVideoElement, deviceId: string) => {
    try {
      await audioDeviceManager.switchOutputDevice(audioElement, deviceId);
    } catch (error) {
      console.error('Error switching output device:', error);
      throw error;
    }
  }, []);

  const testDevice = useCallback(async (deviceId: string) => {
    return audioDeviceManager.testAudioDevice(deviceId);
  }, []);

  return {
    inputDevices,
    outputDevices,
    currentInputDevice,
    switchInput,
    switchOutput,
    testDevice,
    loading
  };
}
