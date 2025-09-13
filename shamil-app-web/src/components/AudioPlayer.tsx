import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import type { Message } from '../types';

interface AudioPlayerProps {
  message: Message;
  isOwnMessage: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ message, isOwnMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  // const progressBarRef = useRef<HTMLDivElement>(null); // Not used currently
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        cancelAnimationFrame(animationRef.current);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('loadedmetadata', () => {});
        audioRef.current.removeEventListener('timeupdate', () => {});
        audioRef.current.removeEventListener('ended', () => {});
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      requestAnimationFrame(animateProgress);
    }
  };

  const animateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    animationRef.current = requestAnimationFrame(animateProgress);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;

    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
      <div className={`p-3 rounded-lg ${isOwnMessage ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlayback}
            className="p-1 rounded-full hover:bg-indigo-400 transition-colors"
          >
            {isPlaying ? (
              <Pause size={20} />
            ) : (
              <Play size={20} />
            )}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {(message as any).caption && (
          <div className="mt-2 text-xs opacity-80">
            {(message as any).caption}
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={(message as any).signedUrl || ''}
        preload="metadata"
        // إضافة خصائص لضمان تشغيل جميع أنواع الملفات الصوتية
        controls={false}
      />
    </div>
  );
};
