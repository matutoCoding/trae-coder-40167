import { create } from 'zustand';
import { Speaker, TranscriptSegment, Topic, Meeting, ExportConfig } from '@/types';
import { 
  mockMeetings, 
  getSpeakersByMeetingId, 
  getTranscriptsByMeetingId, 
  getTopicsByMeetingId,
  getMeetingById 
} from '@/mock/meetingData';
import { generateId } from '@/utils/format';

interface MeetingState {
  meetings: Meeting[];
  currentMeetingId: string | null;
  speakers: Speaker[];
  transcripts: TranscriptSegment[];
  topics: Topic[];
  selectedSegmentId: string | null;
  isPlaying: boolean;
  currentTime: number;
  exportConfig: ExportConfig;
  
  setCurrentMeeting: (id: string) => void;
  updateSpeaker: (id: string, updates: Partial<Speaker>) => void;
  updateSegment: (id: string, updates: Partial<TranscriptSegment>) => void;
  mergeSegments: (segmentIds: string[]) => void;
  splitSegment: (segmentId: string, splitTime: number) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  setSelectedSegment: (id: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  updateExportConfig: (config: Partial<ExportConfig>) => void;
  addNewMeeting: (meeting: Partial<Meeting>) => Meeting;
  updateMeetingProgress: (id: string, progress: number) => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetings: mockMeetings,
  currentMeetingId: null,
  speakers: [],
  transcripts: [],
  topics: [],
  selectedSegmentId: null,
  isPlaying: false,
  currentTime: 0,
  exportConfig: {
    format: 'full',
    fileType: 'txt',
    includeTimestamp: true,
    anonymize: false,
    includeSpeakerInfo: true,
  },

  setCurrentMeeting: (id: string) => {
    const meeting = getMeetingById(id);
    if (meeting) {
      set({
        currentMeetingId: id,
        speakers: getSpeakersByMeetingId(id),
        transcripts: getTranscriptsByMeetingId(id),
        topics: getTopicsByMeetingId(id),
        selectedSegmentId: null,
        currentTime: 0,
      });
    }
  },

  updateSpeaker: (id: string, updates: Partial<Speaker>) => {
    set(state => ({
      speakers: state.speakers.map(s => 
        s.id === id ? { ...s, ...updates, isVerified: true } : s
      ),
    }));
  },

  updateSegment: (id: string, updates: Partial<TranscriptSegment>) => {
    set(state => ({
      transcripts: state.transcripts.map(t => 
        t.id === id ? { ...t, ...updates, isEdited: true } : t
      ),
    }));
  },

  mergeSegments: (segmentIds: string[]) => {
    set(state => {
      const segments = state.transcripts.filter(t => segmentIds.includes(t.id));
      if (segments.length < 2) return state;

      const sorted = [...segments].sort((a, b) => a.order - b.order);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const mergedText = sorted.map(s => s.text).join('');

      const mergedSegment: TranscriptSegment = {
        ...first,
        endTime: last.endTime,
        text: mergedText,
        isEdited: true,
      };

      const remaining = state.transcripts.filter(t => !segmentIds.includes(t.id));
      const result = [...remaining, mergedSegment].sort((a, b) => a.order - b.order);
      
      return { transcripts: result };
    });
  },

  splitSegment: (segmentId: string, splitTime: number) => {
    set(state => {
      const segment = state.transcripts.find(t => t.id === segmentId);
      if (!segment) return state;

      const midIndex = Math.floor(segment.text.length / 2);
      const text1 = segment.text.slice(0, midIndex);
      const text2 = segment.text.slice(midIndex);

      const seg1: TranscriptSegment = {
        ...segment,
        id: generateId(),
        endTime: splitTime,
        text: text1,
        isEdited: true,
      };

      const seg2: TranscriptSegment = {
        ...segment,
        id: generateId(),
        startTime: splitTime,
        text: text2,
        order: segment.order + 1,
        isEdited: true,
      };

      const result = state.transcripts
        .filter(t => t.id !== segmentId)
        .map(t => t.order > segment.order ? { ...t, order: t.order + 1 } : t);
      
      const final = [...result, seg1, seg2].sort((a, b) => a.order - b.order);

      return { transcripts: final };
    });
  },

  updateTopic: (id: string, updates: Partial<Topic>) => {
    set(state => ({
      topics: state.topics.map(t => 
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  setSelectedSegment: (id: string | null) => {
    set({ selectedSegmentId: id });
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
    const { transcripts, selectedSegmentId } = get();
    const currentSegment = transcripts.find(
      t => time >= t.startTime && time <= t.endTime
    );
    if (currentSegment && currentSegment.id !== selectedSegmentId) {
      set({ selectedSegmentId: currentSegment.id });
    }
  },

  updateExportConfig: (config: Partial<ExportConfig>) => {
    set(state => ({
      exportConfig: { ...state.exportConfig, ...config },
    }));
  },

  addNewMeeting: (meeting: Partial<Meeting>) => {
    const newMeeting: Meeting = {
      id: generateId(),
      title: meeting.title || '新会议',
      date: meeting.date || new Date().toISOString(),
      duration: meeting.duration || 0,
      status: meeting.status || 'uploading',
      audioUrl: meeting.audioUrl || '',
      audioFileName: meeting.audioFileName || '',
      audioFileSize: meeting.audioFileSize || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
    };
    set(state => ({
      meetings: [newMeeting, ...state.meetings],
    }));
    return newMeeting;
  },

  updateMeetingProgress: (id: string, progress: number) => {
    set(state => ({
      meetings: state.meetings.map(m => 
        m.id === id ? { ...m, progress, status: progress >= 100 ? 'proofreading' : m.status } : m
      ),
    }));
  },
}));
