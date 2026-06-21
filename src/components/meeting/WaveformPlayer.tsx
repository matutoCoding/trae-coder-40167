import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, SkipBack, SkipForward, Volume2, Gauge } from 'lucide-react';
import { formatTimeWithHour } from '@/utils/format';
import { Speaker } from '@/types';

interface WaveformPlayerProps {
  audioUrl?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  speakers?: Speaker[];
  onTimeUpdate?: (time: number) => void;
}

export default function WaveformPlayer({
  audioUrl,
  duration,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  speakers = [],
  onTimeUpdate,
}: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#d1d5db',
      progressColor: '#3a6aa3',
      cursorColor: '#ff6b6b',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
    });

    wavesurferRef.current = ws;

    ws.on('click', (relativeX: number) => {
      const time = relativeX * duration;
      onSeek(time);
    });

    ws.on('audioprocess', (time: number) => {
      onTimeUpdate?.(time);
    });

    return () => {
      ws.destroy();
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  const handleSkipBack = () => {
    onSeek(Math.max(0, currentTime - 5));
  };

  const handleSkipForward = () => {
    onSeek(Math.min(duration, currentTime + 5));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {speakers.slice(0, 5).map((speaker, index) => (
              <div
                key={speaker.id}
                className="w-6 h-6 rounded-full border-2 border-white -ml-2 first:ml-0 flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: speaker.color, zIndex: speakers.length - index }}
                title={speaker.name}
              >
                {speaker.name.charAt(0)}
              </div>
            ))}
            {speakers.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white -ml-2 flex items-center justify-center text-gray-600 text-xs">
                +{speakers.length - 5}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {speakers.length} 位发言人
          </span>
        </div>
        <div className="text-sm font-mono text-gray-600">
          {formatTimeWithHour(currentTime)} / {formatTimeWithHour(duration)}
        </div>
      </div>

      <div ref={waveformRef} className="w-full rounded-lg overflow-hidden bg-gray-50 mb-4"></div>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleSkipBack}
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        
        <button
          onClick={onPlayPause}
          className="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-200 transition-all hover:scale-105 active:scale-95"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        
        <button
          onClick={handleSkipForward}
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2"></div>

        <div className="relative">
          <button
            onClick={() => setShowRateMenu(!showRateMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-600 transition-colors"
          >
            <Gauge className="w-4 h-4" />
            <span>{playbackRate}x</span>
          </button>
          
          {showRateMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-elevated border border-gray-100 py-1 z-10">
              {playbackRates.map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    setShowRateMenu(false);
                  }}
                  className={`block w-full px-4 py-1.5 text-sm text-left hover:bg-gray-50 ${
                    playbackRate === rate ? 'text-primary-600 bg-primary-50' : 'text-gray-600'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
