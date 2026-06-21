import { saveAs } from 'file-saver';
import { Meeting, Speaker, TranscriptSegment, Topic, ExportConfig } from '@/types';
import { formatTimeWithHour, formatDate } from '@/utils/format';

export function generateExportContent(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  topics: Topic[],
  config: ExportConfig
): string {
  const filteredSpeakerIds = config.selectedSpeakerIds?.length > 0
    ? config.selectedSpeakerIds
    : speakers.map(s => s.id);
  const filteredTopicIds = config.selectedTopicIds?.length > 0
    ? config.selectedTopicIds
    : topics.map(t => t.id);

  const filteredSpeakers = speakers.filter(s => filteredSpeakerIds.includes(s.id));
  const filteredTranscripts = transcripts.filter(t => filteredSpeakerIds.includes(t.speakerId));
  const filteredTopics = topics.filter(t => filteredTopicIds.includes(t.id));

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

  if (config.format === 'full') {
    return generateFullTranscript(meeting, filteredSpeakers, filteredTranscripts, config, getSpeakerName, getSpeakerInfo);
  } else if (config.format === 'decisions') {
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

export function exportFile(
  content: string,
  fileName: string,
  fileType: 'txt' | 'html'
): void {
  let blob: Blob;
  let fullFileName: string;

  if (fileType === 'html') {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
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
    blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    fullFileName = `${fileName}.html`;
  } else {
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    fullFileName = `${fileName}.txt`;
  }

  saveAs(blob, fullFileName);
}

export function generateHtmlPreview(
  meeting: Meeting,
  speakers: Speaker[],
  transcripts: TranscriptSegment[],
  topics: Topic[],
  config: ExportConfig
): string {
  const content = generateExportContent(meeting, speakers, transcripts, topics, config);
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.8;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .document {
      background: white;
      padding: 40px;
      min-height: 100%;
    }
    h1 { 
      font-size: 24px;
      color: #1e3a5f; 
      margin: 0 0 10px 0;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
    }
    .speaker-block {
      margin-bottom: 20px;
    }
    .speaker-name { 
      font-weight: 600; 
      color: #2d5485; 
      margin-bottom: 4px;
    }
    .timestamp { 
      color: #9ca3af; 
      font-size: 12px;
      margin-right: 8px;
    }
    .text {
      color: #374151;
    }
    .topic { 
      margin: 24px 0; 
      padding: 16px; 
      background: #f8fafc; 
      border-radius: 8px; 
    }
    .topic-title {
      font-weight: 600;
      font-size: 16px;
      color: #1e3a5f;
      margin-bottom: 8px;
    }
    .topic-summary {
      color: #4b5563;
      font-size: 14px;
    }
    .action { 
      padding: 12px; 
      margin: 10px 0; 
      background: #fff; 
      border-left: 4px solid #4ecdc4;
      border-radius: 0 6px 6px 0;
    }
    .action-content {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .action-meta {
      font-size: 13px;
      color: #6b7280;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e3a5f;
      margin: 24px 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="document">
    <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${content}</pre>
  </div>
</body>
</html>`;
}
