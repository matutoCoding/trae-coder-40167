export interface Speaker {
  id: string;
  meetingId: string;
  voiceprintId: string;
  name: string;
  department: string;
  role: string;
  color: string;
  isVerified: boolean;
}

export interface TranscriptSegment {
  id: string;
  meetingId: string;
  speakerId: string;
  startTime: number;
  endTime: number;
  text: string;
  isEdited: boolean;
  order: number;
}

export interface ActionItem {
  id: string;
  topicId: string;
  content: string;
  assignee: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Topic {
  id: string;
  meetingId: string;
  title: string;
  order: number;
  summary: string;
  actionItems: ActionItem[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  status: 'uploading' | 'transcribing' | 'proofreading' | 'completed';
  audioUrl: string;
  audioFileName: string;
  audioFileSize: number;
  createdAt: string;
  updatedAt: string;
  progress: number;
}

export type ExportFormat = 'full' | 'decisions' | 'by-person';
export type ExportFileType = 'txt' | 'html';

export interface ExportConfig {
  format: ExportFormat;
  fileType: ExportFileType;
  includeTimestamp: boolean;
  anonymize: boolean;
  includeSpeakerInfo: boolean;
}

export interface ExportHistoryItem {
  id: string;
  meetingId: string;
  format: ExportFormat;
  fileType: ExportFileType;
  exportedAt: string;
  fileName: string;
}
