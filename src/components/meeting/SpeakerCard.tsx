import { Speaker } from '@/types';
import { User } from 'lucide-react';

interface SpeakerCardProps {
  speaker: Speaker;
  onClick?: () => void;
  selected?: boolean;
  showDetails?: boolean;
}

export default function SpeakerCard({ speaker, onClick, selected = false, showDetails = true }: SpeakerCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-primary-400 bg-primary-50/50 shadow-sm'
          : 'border-transparent bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
        style={{ backgroundColor: speaker.color }}
      >
        <User className="w-5 h-5" />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="font-medium text-gray-800 text-sm truncate">
          {speaker.name}
          {speaker.isVerified && (
            <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
          )}
        </div>
        {showDetails && (speaker.department || speaker.role) && (
          <div className="text-xs text-gray-500 truncate">
            {[speaker.department, speaker.role].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
