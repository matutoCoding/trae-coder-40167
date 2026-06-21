import { saveAs } from 'file-saver';
import { Meeting, Speaker, TranscriptSegment, Topic, ExportConfig, ExportFormat } from '@/types';
import { formatTimeWithHour, formatDate } from '@/utils/format';

export interface FilteredData {
  filteredSpeakers: Speaker[];
  filteredTranscripts: TranscriptSegment[];
  filteredTopics: Topic[];
  getSpeakerName: (id: string) => string;
  getSpeakerInfo: (id: string) => string;
}

export function filterData(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  topics: Topic[],
  config: ExportConfig
): FilteredData {
  const filteredSpeakerIds = config.selectedSpeakerIds?.length > 0
    ? config.selectedSpeakerIds
    : speakers.map(s => s.id);
  const filteredTopicIds = config.selectedTopicIds?.length > 0
    ? config.selectedTopicIds
    : topics.map(t => t.id);

  const filteredTopics = topics.filter(t => filteredTopicIds.includes(t.id));
  const topicSegmentIds = new Set(
    filteredTopics.flatMap(t => t.segmentIds || [])
  );

  const hasTopicFilter = config.selectedTopicIds?.length > 0 && config.selectedTopicIds.length < topics.length;

  const filteredTranscripts = transcripts.filter(t => {
    const speakerOk = filteredSpeakerIds.includes(t.speakerId);
    const topicOk = hasTopicFilter ? topicSegmentIds.has(t.id) : true;
    return speakerOk && topicOk;
  });

  const filteredSpeakers = speakers.filter(s => filteredSpeakerIds.includes(s.id));

  const getSpeakerName = (speakerId: string): string => {
    const speaker = filteredSpeakers.find(s => s.id === speakerId) || speakers.find(s => s.id === speakerId);
    if (!speaker) return '未知发言人';
    if (config.anonymize) {
      const index = speakers.findIndex(s => s.id === speakerId);
      return `发言人${index + 1}`;
    }
    return speaker.name;
  };

  const getSpeakerInfo = (speakerId: string): string => {
    const speaker = filteredSpeakers.find(s => s.id === speakerId) || speakers.find(s => s.id === speakerId);
    if (!speaker || !config.includeSpeakerInfo || config.anonymize) return '';
    const info = [speaker.department, speaker.role].filter(Boolean).join(' / ');
    return info ? ` (${info})` : '';
  };

  return { filteredSpeakers, filteredTranscripts, filteredTopics, getSpeakerName, getSpeakerInfo };
}

export function generateExportContent(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  topics: Topic[],
  config: ExportConfig,
  formatOverride?: ExportFormat
): string {
  const format = formatOverride || (config.formats.length > 0 ? config.formats[0] : 'full');
  const { filteredSpeakers, filteredTranscripts, filteredTopics, getSpeakerName, getSpeakerInfo } = filterData(
    meeting, speakers, transcripts, topics, config
  );

  if (format === 'full') {
    return generateFullTranscript(meeting, filteredSpeakers, filteredTranscripts, config, getSpeakerName, getSpeakerInfo);
  } else if (format === 'decisions') {
    return generateDecisionsAndActions(meeting, filteredTopics, config);
  } else {
    return generateByPerson(meeting, filteredSpeakers, filteredTranscripts, config, getSpeakerName, getSpeakerInfo);
  }
}

function generateFullTranscript(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  config: ExportConfig,
  getSpeakerName: (id: string) => string,
  getSpeakerInfo: (id: string) => string
): string {
  let content = '';
  content += `${meeting.title}\n`;
  content += `${formatDate(meeting.date)}\n\n`;
  content += `参会人员：${speakers.map((s, i) => 
    config.anonymize ? `发言人${i + 1}` : s.name
  ).join('、')}\n`;
  content += `${'='.repeat(50)}\n\n`;

  transcripts.forEach(seg => {
    const name = getSpeakerName(seg.speakerId);
    const info = getSpeakerInfo(seg.speakerId);
    const time = config.includeTimestamp ? `[${formatTimeWithHour(seg.startTime)}] ` : '';
    content += `${time}${name}${info}：${seg.text}\n\n`;
  });

  return content;
}

function generateDecisionsAndActions(
  meeting: Meeting,
  topics: Topic[],
  config: ExportConfig
): string {
  let content = '';
  content += `${meeting.title} - 决议与待办\n`;
  content += `${formatDate(meeting.date)}\n\n`;
  content += `${'='.repeat(50)}\n\n`;

  let allActionItems: { topic: string; content: string; assignee: string; deadline: string }[] = [];

  topics.forEach((topic, index) => {
    content += `${index + 1}. ${topic.title}\n`;
    content += `   摘要：${topic.summary}\n`;
    
    if (topic.actionItems.length > 0) {
      content += `   待办事项：\n`;
      topic.actionItems.forEach((item, i) => {
        content += `   ${i + 1}) ${item.content}\n`;
        content += `      负责人：${config.anonymize ? '相关人员' : item.assignee}\n`;
        content += `      截止日期：${item.deadline}\n`;
        allActionItems.push({
          topic: topic.title,
          content: item.content,
          assignee: item.assignee,
          deadline: item.deadline,
        });
      });
    }
    content += '\n';
  });

  if (allActionItems.length > 0) {
    content += `${'='.repeat(50)}\n`;
    content += '待办事项汇总：\n\n';
    allActionItems.forEach((item, i) => {
      content += `${i + 1}. [${item.topic}] ${item.content}\n`;
      content += `   负责人：${config.anonymize ? '相关人员' : item.assignee} | 截止：${item.deadline}\n`;
    });
  }

  return content;
}

function generateByPerson(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  config: ExportConfig,
  getSpeakerName: (id: string) => string,
  getSpeakerInfo: (id: string) => string
): string {
  let content = '';
  content += `${meeting.title} - 按人员汇总\n`;
  content += `${formatDate(meeting.date)}\n\n`;
  content += `${'='.repeat(50)}\n\n`;

  const speakerSegments: Record<string, TranscriptSegment[]> = {};
  transcripts.forEach(seg => {
    if (!speakerSegments[seg.speakerId]) {
      speakerSegments[seg.speakerId] = [];
    }
    speakerSegments[seg.speakerId].push(seg);
  });

  speakers.forEach((speaker, index) => {
    const segs = speakerSegments[speaker.id] || [];
    const name = getSpeakerName(speaker.id);
    const info = getSpeakerInfo(speaker.id);
    
    content += `【${index + 1}】${name}${info}\n`;
    content += `发言次数：${segs.length}次\n`;
    content += `${'-'.repeat(40)}\n`;
    
    segs.forEach((seg, i) => {
      const time = config.includeTimestamp ? `[${formatTimeWithHour(seg.startTime)}] ` : '';
      content += `${time}${seg.text}\n`;
    });
    content += '\n';
  });

  return content;
}

const FORMAT_SUFFIX: Record<ExportFormat, string> = {
  full: '完整逐字稿',
  decisions: '决议待办',
  'by-person': '按人员汇总',
};

function buildHtmlDocument(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { 
      font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #333;
    }
    h1 { color: #1e3a5f; border-bottom: 2px solid #4ecdc4; padding-bottom: 10px; }
    h2 { color: #2d5485; margin-top: 30px; }
    .speaker { font-weight: bold; color: #2d5485; }
    .timestamp { color: #888; font-size: 0.9em; }
    .topic { margin: 20px 0; padding: 15px; background: #f0f5fa; border-radius: 8px; }
    .action { padding: 10px; margin: 8px 0; background: #fff; border-left: 4px solid #4ecdc4; }
  </style>
</head>
<body>
  <pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre>
</body>
</html>`;
}

export function exportFile(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  topics: Topic[],
  config: ExportConfig
): void {
  const formats = config.formats.length > 0 ? config.formats : (['full'] as ExportFormat[]);
  const baseFileName = `${meeting.title}_${formatDate(meeting.date)}`;

  formats.forEach((fmt) => {
    const content = generateExportContent(meeting, speakers, transcripts, topics, config, fmt);
    const fileName = `${baseFileName}_${FORMAT_SUFFIX[fmt]}`;
    let blob: Blob;
    let fullFileName: string;

    if (config.fileType === 'html') {
      const htmlContent = buildHtmlDocument(content, fileName);
      blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      fullFileName = `${fileName}.html`;
    } else {
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      fullFileName = `${fileName}.txt`;
    }

    setTimeout(() => saveAs(blob, fullFileName), 0);
  });
}

export function generateHtmlPreview(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  topics: Topic[],
  config: ExportConfig,
  previewFormat: ExportFormat
): string {
  const content = generateExportContent(meeting, speakers, transcripts, topics, config, previewFormat);
  return buildHtmlDocument(content, '预览');
}
