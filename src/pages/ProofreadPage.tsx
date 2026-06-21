import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { formatTimeWithHour, formatDate, generateId } from '@/utils/format';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TranscriptItem from '@/components/meeting/TranscriptItem';
import SpeakerCard from '@/components/meeting/SpeakerCard';
import TopicList from '@/components/meeting/TopicList';
import WaveformPlayer from '@/components/meeting/WaveformPlayer';
import { 
  Users, 
  FileText, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  Palette,
  Save,
  X,
  Play,
  Pause,
  Sparkles,
  ArrowRight,
  Search,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function ProofreadPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const transcriptListRef = useRef<HTMLDivElement>(null);
  
  const {
    meetings,
    speakers,
    transcripts,
    topics,
    selectedSegmentId,
    isPlaying,
    currentTime,
    setCurrentMeeting,
    updateSpeaker,
    updateSegment,
    mergeSegments,
    splitSegment,
    setSelectedSegment,
    setPlaying,
    setCurrentTime,
  } = useMeetingStore();

  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [speakerForm, setSpeakerForm] = useState({
    name: '',
    department: '',
    role: '',
    color: '#4ecdc4',
  });
  
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  const [showTopicsPanel, setShowTopicsPanel] = useState(true);
  const [selectedSpeakerForMerge, setSelectedSpeakerForMerge] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  const meeting = meetings.find(m => m.id === meetingId);

  useEffect(() => {
    if (meetingId) {
      setCurrentMeeting(meetingId);
    }
  }, [meetingId, setCurrentMeeting]);

  useEffect(() => {
    if (selectedSegmentId && transcriptListRef.current) {
      const element = document.getElementById(`segment-${selectedSegmentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedSegmentId]);

  const getSpeakerById = (speakerId: string) => {
    return speakers.find(s => s.id === speakerId);
  };

  const handleEditSpeaker = (speaker: typeof speakers[0]) => {
    setEditingSpeakerId(speaker.id);
    setSpeakerForm({
      name: speaker.name,
      department: speaker.department,
      role: speaker.role,
      color: speaker.color,
    });
    setShowSpeakerModal(true);
  };

  const handleSaveSpeaker = () => {
    if (editingSpeakerId) {
      updateSpeaker(editingSpeakerId, speakerForm);
    }
    setShowSpeakerModal(false);
    setEditingSpeakerId(null);
  };

  const handleEditSegment = (segmentId: string) => {
    const segment = transcripts.find(t => t.id === segmentId);
    if (segment) {
      setEditingSegmentId(segmentId);
      setEditText(segment.text);
    }
  };

  const handleSaveSegmentEdit = () => {
    if (editingSegmentId) {
      updateSegment(editingSegmentId, { text: editText });
    }
    setEditingSegmentId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingSegmentId(null);
    setEditText('');
  };

  const handleMergeSegment = (segmentId: string) => {
    const currentIndex = transcripts.findIndex(t => t.id === segmentId);
    if (currentIndex > 0) {
      const prevId = transcripts[currentIndex - 1].id;
      mergeSegments([prevId, segmentId]);
    }
  };

  const handleSplitSegment = (segmentId: string) => {
    const segment = transcripts.find(t => t.id === segmentId);
    if (segment) {
      const midTime = (segment.startTime + segment.endTime) / 2;
      splitSegment(segmentId, midTime);
    }
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (confirm('确定要删除这个片段吗？')) {
      updateSegment(segmentId, { text: '[已删除]' });
    }
  };

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const colorOptions = [
    '#4ecdc4', '#ffd93d', '#6bcb77', '#b19cd9',
    '#ff8c69', '#74b9ff', '#fd79a8', '#a29bfe',
  ];

  const getSpeakerSegments = (speakerId: string) => {
    return transcripts.filter(t => t.speakerId === speakerId);
  };

  const searchMatches = transcripts.filter(t =>
    searchQuery.trim() && t.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const jumpToMatch = (direction: 'prev' | 'next') => {
    if (searchMatches.length === 0) return;
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (searchMatchIndex + 1) % searchMatches.length;
    } else {
      nextIndex = (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    }
    setSearchMatchIndex(nextIndex);
    const seg = searchMatches[nextIndex];
    setSelectedSegment(seg.id);
    setCurrentTime(seg.startTime);
    const el = document.getElementById(`segment-${seg.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    setSearchMatchIndex(0);
  }, [searchQuery]);

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">会议不存在</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-0.5">
              <span>{formatDate(meeting.date)}</span>
              <span>·</span>
              <span>{formatTimeWithHour(meeting.duration)}</span>
              <span>·</span>
              <span>{speakers.length} 位发言人</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate(`/export/${meetingId}`)}>
            <FileText className="w-4 h-4" />
            预览纪要
          </Button>
          <Button onClick={() => navigate(`/export/${meetingId}`)}>
            <Sparkles className="w-4 h-4" />
            生成纪要
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${showTopicsPanel ? '' : ''}`}>
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary-600" />
                  转写内容
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    （{transcripts.length} 段）
                  </span>
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索转写内容..."
                      className="pl-9 pr-20 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 w-64"
                    />
                    {searchQuery.trim() && searchMatches.length > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <span className="text-xs text-gray-400">
                          {searchMatchIndex + 1}/{searchMatches.length}
                        </span>
                        <button
                          onClick={() => jumpToMatch('prev')}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => jumpToMatch('next')}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">点击片段可编辑</span>
                </div>
              </div>
            </CardHeader>
            
            <CardBody className="flex-1 overflow-y-auto pt-0">
              <div ref={transcriptListRef} className="space-y-1 py-2">
                {transcripts.map((segment) => {
                  const speaker = getSpeakerById(segment.speakerId);
                  const isMatch = searchMatches.some(s => s.id === segment.id);
                  return (
                    <div key={segment.id} id={`segment-${segment.id}`}>
                      <TranscriptItem
                        segment={segment}
                        speaker={speaker}
                        isSelected={selectedSegmentId === segment.id}
                        isPlaying={isPlaying && selectedSegmentId === segment.id}
                        onSelect={() => {
                          setSelectedSegment(segment.id);
                          setCurrentTime(segment.startTime);
                        }}
                        onEdit={() => handleEditSegment(segment.id)}
                        onMerge={() => handleMergeSegment(segment.id)}
                        onSplit={() => handleSplitSegment(segment.id)}
                        onDelete={() => handleDeleteSegment(segment.id)}
                        editing={editingSegmentId === segment.id}
                        editText={editText}
                        onEditTextChange={setEditText}
                        onSaveEdit={handleSaveSegmentEdit}
                        onCancelEdit={handleCancelEdit}
                        searchQuery={searchQuery}
                        isSearchMatch={isMatch}
                      />
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <div className="mt-4 flex-shrink-0">
            <WaveformPlayer
              duration={meeting.duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onTimeUpdate={(time) => setCurrentTime(time)}
              speakers={speakers}
              transcripts={transcripts}
            />
          </div>
        </div>

        <div className={`w-80 flex-shrink-0 flex flex-col gap-4 transition-all duration-300 ${showTopicsPanel ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <Card className="flex-shrink-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary-600" />
                  说话人
                </h2>
                <button className="text-primary-600 hover:text-primary-700">
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="group relative">
                  <SpeakerCard
                    speaker={speaker}
                    onClick={() => handleEditSpeaker(speaker)}
                    showDetails={speaker.isVerified}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditSpeaker(speaker)}
                      className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 pl-1">
                    {getSpeakerSegments(speaker.id).length} 段发言
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  实时纪要
                </h2>
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  重新生成
                </button>
              </div>
            </CardHeader>
            <CardBody className="flex-1 overflow-y-auto">
              <TopicList topics={topics} />
            </CardBody>
          </Card>
        </div>

        <button
          onClick={() => setShowTopicsPanel(!showTopicsPanel)}
          className="flex-shrink-0 self-center w-6 h-16 -ml-2 bg-white rounded-r-lg border border-l-0 border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm z-10"
          title={showTopicsPanel ? '收起右侧面板' : '展开右侧面板'}
        >
          {showTopicsPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <Modal
        isOpen={showSpeakerModal}
        onClose={() => {
          setShowSpeakerModal(false);
          setEditingSpeakerId(null);
        }}
        title="编辑说话人信息"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSpeakerModal(false);
                setEditingSpeakerId(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleSaveSpeaker}>
              <Save className="w-4 h-4" />
              保存
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              姓名 <span className="text-accent-500">*</span>
            </label>
            <input
              type="text"
              value={speakerForm.name}
              onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
              placeholder="请输入姓名"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              部门
            </label>
            <input
              type="text"
              value={speakerForm.department}
              onChange={(e) => setSpeakerForm({ ...speakerForm, department: e.target.value })}
              placeholder="例如：技术部"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              职位/角色
            </label>
            <input
              type="text"
              value={speakerForm.role}
              onChange={(e) => setSpeakerForm({ ...speakerForm, role: e.target.value })}
              placeholder="例如：产品经理"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              标识颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setSpeakerForm({ ...speakerForm, color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    speakerForm.color === color
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-primary-500" />
              保存后，该声纹对应的所有发言将自动更新为新的姓名和信息
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
