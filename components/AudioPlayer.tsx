
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface AudioPlayerProps {
  base64Audio: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
        try {
            sourceRef.current.stop();
        } catch (e) {
            // Ignore error if already stopped
        }
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    return () => {
      stopPlayback();
      audioContextRef.current?.close();
    };
  }, [stopPlayback]);

  useEffect(() => {
    const prepareAudio = async () => {
      setIsReady(false);
      stopPlayback();
      if (base64Audio && audioContextRef.current) {
        try {
          const decodedData = decode(base64Audio);
          const buffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);
          audioBufferRef.current = buffer;
          setIsReady(true);
        } catch (error) {
          console.error("Failed to decode audio data", error);
          audioBufferRef.current = null;
        }
      }
    };
    prepareAudio();
  }, [base64Audio, stopPlayback]);
  
  const handlePlayPause = () => {
    if (!isReady || !audioBufferRef.current || !audioContextRef.current) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
      source.start();
      sourceRef.current = source;
      setIsPlaying(true);
    }
  };

  return (
    <div className="mt-2 flex items-center space-x-2">
      <button 
        onClick={handlePlayPause} 
        disabled={!isReady}
        aria-label={isPlaying ? 'Pause voiceover' : 'Play voiceover'}
        className="bg-gray-200 dark:bg-gray-600 p-2 rounded-full disabled:opacity-50 enabled:hover:bg-gray-300 dark:enabled:hover:bg-gray-500 transition"
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
        )}
      </button>
      <span className="text-xs text-gray-500 dark:text-gray-400">{isReady ? "Voiceover ready" : "Preparing audio..."}</span>
    </div>
  );
};

export default AudioPlayer;
