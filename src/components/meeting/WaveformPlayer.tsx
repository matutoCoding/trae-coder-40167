import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Gauge } from 'lucide-react';
import { formatTimeWithHour } from '@/utils/format';
import { Speaker, TranscriptSegment } from '@/types';

interface WaveformPlayerProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  speakers?: Speaker[];
  transcripts?: TranscriptSegment[];
}

export default function WaveformPlayer({
  duration,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  onTimeUpdate,
  speakers = [],
  transcripts = [],
}: WaveformPlayerProps) {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const internalTimeRef = useRef<number>(currentTime);
  const playbackRateRef = useRef<number>(playbackRate);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    internalTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        const nextTime = Math.min(
          duration,
          internalTimeRef.current + playbackRateRef.current * 0.5
        );
        internalTimeRef.current = nextTime;
        onTimeUpdate(nextTime);
        if (nextTime >= duration) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          onPlayPause();
        }
      }, 500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, duration, onTimeUpdate, onPlayPause]);

  const handleSkipBack = () => {
    const newTime = Math.max(0, internalTimeRef.current - 5);
    internalTimeRef.current = newTime;
    onSeek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, internalTimeRef.current + 5);
    internalTimeRef.current = newTime;
    onSeek(newTime);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newTime = ratio * duration;
    internalTimeRef.current = newTime;
    onSeek(newTime);
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  const currentSegment = transcripts.find(
    t => currentTime >= t.startTime && currentTime <= t.endTime
  );
  const currentSpeaker = currentSegment
    ? speakers.find(s => s.id === currentSegment.speakerId)
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            {speakers.slice(0, 5).map((speaker, index) => (
              <div
                key={speaker.id}
                className={`w-6 h-6 rounded-full border-2 border-white -ml-2 first:ml-0 flex items-center justify-center text-white text-xs font-medium transition-all duration-200 ${
                  currentSpeaker?.id === speaker.id ? 'scale-125 ring-2 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: speaker.color,
                  zIndex: speakers.length - index,
                }}
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
          {currentSpeaker && (
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: currentSpeaker.color }}
            >
              {currentSpeaker.name}
            </span>
          )}
        </div>
        <div className="text-sm font-mono text-gray-600">
          {formatTimeWithHour(currentTime)} / {formatTimeWithHour(duration)}
        </div>
      </div>

      <div
        ref={progressBarRef}
        className="w-full h-12 bg-gray-50 rounded-lg mb-4 cursor-pointer relative overflow-hidden"
        onClick={handleProgressClick}
      >
        {transcripts.map((seg) => {
          const speaker = speakers.find(s => s.id === seg.speakerId);
          const left = duration > 0 ? (seg.startTime / duration) * 100 : 0;
          const width = duration > 0 ? ((seg.endTime - seg.startTime) / duration) * 100 : 0;
          return (
            <div
              key={seg.id}
              className="absolute top-1 bottom-1 rounded opacity-40"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: speaker?.color || '#9ca3af',
              }}
            ></div>
          );
        })}
        <div
          className="absolute top-0 bottom-0 left-0 bg-primary-500/10 rounded-l-lg transition-all duration-200"
          style={{ width: `${progressRatio * 100}%` }}
        ></div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary-500 transition-all duration-200"
          style={{ left: `${progressRatio * 100}%` }}
        ></div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-600 rounded-full shadow-sm border-2 border-white transition-all duration-200"
          style={{ left: `calc(${progressRatio * 100}% - 6px)` }}
        ></div>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleSkipBack}
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
          title="后退5秒"
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
          title="快进5秒"
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
