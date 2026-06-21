import { TranscriptSegment, Speaker } from '@/types';
import { formatTime } from '@/utils/format';
import { Clock, Edit3, Merge, Split, Trash2 } from 'lucide-react';

interface TranscriptItemProps {
  segment: TranscriptSegment;
  speaker: Speaker | undefined;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMerge?: () => void;
  onSplit?: () => void;
  onDelete?: () => void;
  editing?: boolean;
  editText?: string;
  onEditTextChange?: (text: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

export default function TranscriptItem({
  segment,
  speaker,
  isSelected,
  isPlaying,
  onSelect,
  onEdit,
  onMerge,
  onSplit,
  onDelete,
  editing = false,
  editText = '',
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
}: TranscriptItemProps) {
  const speakerColor = speaker?.color || '#9ca3af';
  const speakerName = speaker?.name || '未知发言人';

  return (
    <div
      className={`group relative pl-4 pr-2 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-primary-50/70 ring-1 ring-primary-200'
          : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
        style={{ backgroundColor: speakerColor }}
      ></div>
      
      <div className="flex items-start justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: speakerColor }}
          >
            {speakerName.charAt(0)}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-800">{speakerName}</span>
              <span className="text-xs text-gray-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(segment.startTime)}
              </span>
              {segment.isEdited && (
                <span className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                  已编辑
                </span>
              )}
            </div>
            
            {editing ? (
              <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={(e) => onEditTextChange?.(e.target.value)}
                  className="w-full p-2 text-sm text-gray-700 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={onSaveEdit}
                    className="text-xs px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-600 leading-relaxed line-clamp-2">
                {segment.text}
              </p>
            )}
          </div>
        </div>
        
        {isSelected && !editing && (
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0 opacity-100" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
              title="编辑"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onMerge}
              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
              title="合并"
            >
              <Merge className="w-4 h-4" />
            </button>
            <button
              onClick={onSplit}
              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
              title="拆分"
            >
              <Split className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-accent-500 transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {isPlaying && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full overflow-hidden">
          <div className="w-full h-full animate-pulse bg-white/50"></div>
        </div>
      )}
    </div>
  );
}
