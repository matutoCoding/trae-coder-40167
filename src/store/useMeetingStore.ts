import { create } from 'zustand';
import { Speaker, TranscriptSegment, Topic, ActionItem, Meeting, ExportConfig } from '@/types';
import { mockMeetings, mockSpeakers, mockTranscripts, mockTopics } from '@/mock/meetingData';
import { generateId, getSpeakerColor } from '@/utils/format';

const speakerColors = ['#4ecdc4', '#ffd93d', '#6bcb77', '#b19cd9', '#ff8c69', '#74b9ff'];

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

  allSpeakers: Speaker[];
  allTranscripts: TranscriptSegment[];
  allTopics: Topic[];

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
  generateMeetingData: (meetingId: string) => void;
  regenerateTopics: () => void;
}

function buildTopicsFromTranscripts(
  meetingId: string,
  speakers: Speaker[],
  transcripts: TranscriptSegment[]
): Topic[] {
  const allText = transcripts.map(t => t.text).join(' ');
  const speakerMap = new Map(speakers.map(s => [s.id, s]));

  const topics: Topic[] = [];
  const actionItems: ActionItem[] = [];

  let topicOrder = 1;

  const hasQPattern = /Q\d|季度|销售|目标|完成率|增长/i;
  const hasDiscussPattern = /讨论|计划|建议|重点|方向|节奏|扩张/i;
  const hasClosingPattern = /就这么定|没问题|散会|安排|提交|发出来/i;

  const qSegments = transcripts.filter(t => hasQPattern.test(t.text));
  if (qSegments.length > 0) {
    const summaryParts = qSegments.slice(0, 3).map(t => {
      const speaker = speakerMap.get(t.speakerId);
      const name = speaker?.name || '未知';
      return `${name}：${t.text.slice(0, 40)}...`;
    });
    topics.push({
      id: generateId(),
      meetingId,
      title: '工作数据汇报',
      order: topicOrder++,
      summary: summaryParts.join('；'),
      actionItems: [],
    });
  }

  const discussSegments = transcripts.filter(t => hasDiscussPattern.test(t.text));
  if (discussSegments.length > 0) {
    const actionPattern = /(\S+目标?\S*?)(\d[\d.]+[万亿]?)/g;
    const personPattern = /招聘|增加|招(\d+)/g;

    const summaryParts = discussSegments.slice(0, 3).map(t => {
      const speaker = speakerMap.get(t.speakerId);
      const name = speaker?.name || '未知';
      return `${name}：${t.text.slice(0, 40)}...`;
    });

    const items: ActionItem[] = [];

    transcripts.forEach(seg => {
      const am = actionPattern.exec(seg.text);
      if (am) {
        const sp = speakerMap.get(seg.speakerId);
        items.push({
          id: generateId(),
          topicId: '',
          content: am[0],
          assignee: sp?.name || '相关人员',
          deadline: '待定',
          status: 'pending' as const,
        });
      }
      actionPattern.lastIndex = 0;

      const pm = personPattern.exec(seg.text);
      if (pm) {
        const sp = speakerMap.get(seg.speakerId);
        items.push({
          id: generateId(),
          topicId: '',
          content: seg.text.slice(0, 60),
          assignee: sp?.name || '相关人员',
          deadline: '待定',
          status: 'pending' as const,
        });
      }
      personPattern.lastIndex = 0;
    });

    topics.push({
      id: generateId(),
      meetingId,
      title: '重点工作讨论',
      order: topicOrder++,
      summary: summaryParts.join('；'),
      actionItems: items,
    });
  }

  const closingSegments = transcripts.filter(t => hasClosingPattern.test(t.text));
  if (closingSegments.length > 0) {
    const lastSeg = transcripts[transcripts.length - 1];
    topics.push({
      id: generateId(),
      meetingId,
      title: '后续安排',
      order: topicOrder++,
      summary: closingSegments.map(t => t.text.slice(0, 50)).join('；'),
      actionItems: [{
        id: generateId(),
        topicId: '',
        content: '各部门提交详细计划',
        assignee: '各部门负责人',
        deadline: '待定',
        status: 'pending' as const,
      }],
    });
  }

  if (topics.length === 0) {
    const firstTexts = transcripts.slice(0, 3).map(t => t.text.slice(0, 30)).join('；');
    topics.push({
      id: generateId(),
      meetingId,
      title: '会议内容',
      order: 1,
      summary: firstTexts || '暂无内容',
      actionItems: [],
    });
  }

  topics.forEach(topic => {
    topic.actionItems.forEach(item => {
      item.topicId = topic.id;
    });
  });

  return topics;
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

  allSpeakers: [...mockSpeakers],
  allTranscripts: [...mockTranscripts],
  allTopics: [...mockTopics],

  setCurrentMeeting: (id: string) => {
    const state = get();
    const meeting = state.meetings.find(m => m.id === id);
    if (!meeting) return;

    set({
      currentMeetingId: id,
      speakers: state.allSpeakers.filter(s => s.meetingId === id),
      transcripts: state.allTranscripts
        .filter(t => t.meetingId === id)
        .sort((a, b) => a.order - b.order),
      topics: state.allTopics
        .filter(t => t.meetingId === id)
        .sort((a, b) => a.order - b.order),
      selectedSegmentId: null,
      currentTime: 0,
      isPlaying: false,
    });
  },

  updateSpeaker: (id: string, updates: Partial<Speaker>) => {
    set(state => {
      const updatedSpeakers = state.speakers.map(s =>
        s.id === id ? { ...s, ...updates, isVerified: true } : s
      );
      const updatedAllSpeakers = state.allSpeakers.map(s =>
        s.id === id ? { ...s, ...updates, isVerified: true } : s
      );
      return { speakers: updatedSpeakers, allSpeakers: updatedAllSpeakers };
    });
  },

  updateSegment: (id: string, updates: Partial<TranscriptSegment>) => {
    set(state => {
      const updatedTranscripts = state.transcripts.map(t =>
        t.id === id ? { ...t, ...updates, isEdited: true } : t
      );
      const updatedAllTranscripts = state.allTranscripts.map(t =>
        t.id === id ? { ...t, ...updates, isEdited: true } : t
      );
      return { transcripts: updatedTranscripts, allTranscripts: updatedAllTranscripts };
    });
    get().regenerateTopics();
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

      const updatedTranscripts = [...state.transcripts.filter(t => !segmentIds.includes(t.id)), mergedSegment]
        .sort((a, b) => a.order - b.order);

      const updatedAllTranscripts = state.allTranscripts.map(t => {
        if (segmentIds.includes(t.id)) return null;
        return t;
      }).filter(Boolean).map(t => t as TranscriptSegment);
      const existingInAll = updatedAllTranscripts.some(t => t.id === mergedSegment.id);
      if (!existingInAll) {
        updatedAllTranscripts.push(mergedSegment);
      }

      return { transcripts: updatedTranscripts, allTranscripts: updatedAllTranscripts.sort((a, b) => a.order - b.order) };
    });
    get().regenerateTopics();
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

      const updatedTranscripts = state.transcripts
        .filter(t => t.id !== segmentId)
        .map(t => t.order > segment.order ? { ...t, order: t.order + 1 } : t);
      const final = [...updatedTranscripts, seg1, seg2].sort((a, b) => a.order - b.order);

      const updatedAllTranscripts = state.allTranscripts
        .filter(t => t.id !== segmentId)
        .map(t => t.order > segment.order ? { ...t, order: t.order + 1 } : t);
      const finalAll = [...updatedAllTranscripts, seg1, seg2].sort((a, b) => a.order - b.order);

      return { transcripts: final, allTranscripts: finalAll };
    });
    get().regenerateTopics();
  },

  updateTopic: (id: string, updates: Partial<Topic>) => {
    set(state => {
      const updatedTopics = state.topics.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      const updatedAllTopics = state.allTopics.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      return { topics: updatedTopics, allTopics: updatedAllTopics };
    });
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
      duration: meeting.duration || 330,
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

  generateMeetingData: (meetingId: string) => {
    const state = get();
    const meeting = state.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const existingSpeakers = state.allSpeakers.filter(s => s.meetingId === meetingId);
    if (existingSpeakers.length > 0) return;

    const numSpeakers = 3 + Math.floor(Math.random() * 3);

    const newSpeakers: Speaker[] = [];
    for (let i = 0; i < numSpeakers; i++) {
      newSpeakers.push({
        id: generateId(),
        meetingId,
        voiceprintId: `vp-${generateId()}`,
        name: `发言人${i + 1}`,
        department: '',
        role: '',
        color: speakerColors[i % speakerColors.length],
        isVerified: false,
      });
    }

    const sampleTexts = [
      '大家好，今天的会议现在开始。请各位先汇报一下最近的工作进展。',
      '好的，我先说一下我们部门的情况。目前各项工作进展顺利，完成了大部分季度目标，还有少部分需要继续推进。',
      '我们这边也在积极推进中。虽然遇到了一些困难，但团队已经制定了应对方案，预计下个月能看到成效。',
      '感谢各位的汇报。接下来我们讨论一下后续的重点工作安排，大家有什么建议？',
      '我认为首先应该明确优先级，把最重要的几件事排在前面，确保资源集中使用。',
      '同意，另外我建议建立一个定期跟踪机制，每周同步一次进展，避免信息滞后。',
      '这个方案不错。那我们确定一下时间节点和责任人，下周之前把详细计划提交上来。',
      '好的，我回去会安排团队尽快落实，有问题随时沟通。',
      '没问题，我会跟进相关事项的推进情况，确保按时完成。',
      '那今天的会议就到这里，大家辛苦了，散会。',
      '我补充一点，关于预算方面的问题，我们需要再和财务确认一下具体数字。',
      '对，预算审批流程也需要加快，不能影响项目进度。',
      '近期客户反馈也不错，我们应该趁热打铁，加大市场推广力度。',
      '好的，这些我都会记录下来，稍后整理成待办清单发给大家。',
    ];

    const newTranscripts: TranscriptSegment[] = [];
    let currentTime = 0;
    const totalDuration = meeting.duration || 330;
    const avgSegmentDuration = totalDuration / sampleTexts.length;

    for (let i = 0; i < sampleTexts.length; i++) {
      const speakerIdx = i % numSpeakers;
      const startTime = currentTime;
      const endTime = Math.min(startTime + avgSegmentDuration * (0.7 + Math.random() * 0.6), totalDuration);

      newTranscripts.push({
        id: generateId(),
        meetingId,
        speakerId: newSpeakers[speakerIdx].id,
        startTime: Math.round(startTime),
        endTime: Math.round(endTime),
        text: sampleTexts[i],
        isEdited: false,
        order: i + 1,
      });
      currentTime = endTime + 1;
    }

    const newTopics = buildTopicsFromTranscripts(meetingId, newSpeakers, newTranscripts);

    set(state => ({
      allSpeakers: [...state.allSpeakers, ...newSpeakers],
      allTranscripts: [...state.allTranscripts, ...newTranscripts],
      allTopics: [...state.allTopics, ...newTopics],
    }));

    if (state.currentMeetingId === meetingId) {
      set({
        speakers: newSpeakers,
        transcripts: newTranscripts.sort((a, b) => a.order - b.order),
        topics: newTopics.sort((a, b) => a.order - b.order),
      });
    }
  },

  regenerateTopics: () => {
    const state = get();
    const meetingId = state.currentMeetingId;
    if (!meetingId) return;

    const newTopics = buildTopicsFromTranscripts(
      meetingId,
      state.speakers,
      state.transcripts
    );

    const otherTopics = state.allTopics.filter(t => t.meetingId !== meetingId);

    set({
      topics: newTopics,
      allTopics: [...otherTopics, ...newTopics],
    });
  },
}));
