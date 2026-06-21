import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { generateExportContent, exportFile, generateHtmlPreview } from '@/services/exportService';
import { formatDate, formatTimeWithHour, formatFileSize } from '@/utils/format';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import { 
  FileText, 
  FileCheck, 
  Users, 
  Download, 
  ChevronLeft,
  Clock,
  FileDown,
  Settings,
  Eye,
  CheckCircle2,
  History,
  Calendar,
  FileAudio,
  CheckSquare,
  Square
} from 'lucide-react';
import { ExportFormat, ExportFileType } from '@/types';

export default function ExportPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  
  const {
    meetings,
    speakers,
    transcripts,
    topics,
    exportConfig,
    updateExportConfig,
    setCurrentMeeting,
  } = useMeetingStore();

  const [previewContent, setPreviewContent] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const meeting = meetings.find(m => m.id === meetingId);

  useEffect(() => {
    if (meetingId) {
      setCurrentMeeting(meetingId);
    }
  }, [meetingId, setCurrentMeeting]);

  useEffect(() => {
    if (meeting && speakers.length > 0 && transcripts.length > 0) {
      const content = generateHtmlPreview(meeting, speakers, transcripts, topics, exportConfig);
      setPreviewContent(content);
    }
  }, [meeting, speakers, transcripts, topics, exportConfig]);

  const formatOptions: { value: ExportFormat; label: string; description: string; icon: typeof FileText }[] = [
    {
      value: 'full',
      label: '完整逐字稿',
      description: '按时间顺序完整呈现所有发言内容',
      icon: FileText,
    },
    {
      value: 'decisions',
      label: '只看决议与待办',
      description: '提取会议决议、结论和待办事项',
      icon: FileCheck,
    },
    {
      value: 'by-person',
      label: '按人员汇总发言',
      description: '按说话人分组展示各自发言内容',
      icon: Users,
    },
  ];

  const fileTypeOptions: { value: ExportFileType; label: string; icon: string }[] = [
    { value: 'txt', label: 'TXT 文本', icon: '📄' },
    { value: 'html', label: 'HTML 网页', icon: '🌐' },
  ];

  const handleExport = () => {
    if (!meeting) return;
    
    setIsExporting(true);
    
    setTimeout(() => {
      const content = generateExportContent(
        meeting,
        speakers,
        transcripts,
        topics,
        exportConfig
      );
      
      const fileName = `${meeting.title}_${formatDate(meeting.date)}`;
      exportFile(content, fileName, exportConfig.fileType);
      
      setIsExporting(false);
    }, 800);
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">会议不存在</div>
      </div>
    );
  }

  const exportHistory = [
    { id: 1, format: '完整逐字稿', type: 'TXT', time: '2024-06-17 16:30', size: '45KB' },
    { id: 2, format: '决议与待办', type: 'HTML', time: '2024-06-17 16:25', size: '12KB' },
    { id: 3, format: '按人员汇总', type: 'TXT', time: '2024-06-17 15:45', size: '38KB' },
  ];

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
            <h1 className="text-xl font-bold text-gray-900">纪要导出</h1>
            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-0.5">
              <span>{meeting.title}</span>
              <span>·</span>
              <span>{formatDate(meeting.date)}</span>
            </div>
          </div>
        </div>
        
        <Button size="lg" onClick={handleExport} loading={isExporting}>
          <Download className="w-5 h-5" />
          {isExporting ? '导出中...' : '导出文件'}
        </Button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                选择格式
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = exportConfig.format === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => updateExportConfig({ format: option.value })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50/50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm ${
                            isSelected ? 'text-primary-700' : 'text-gray-800'
                          }`}>
                            {option.label}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary-600" />
                导出设置
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文件格式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {fileTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateExportConfig({ fileType: option.value })}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        exportConfig.fileType === option.value
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{option.icon}</div>
                      <div className={`text-xs font-medium ${
                        exportConfig.fileType === option.value
                          ? 'text-primary-700'
                          : 'text-gray-600'
                      }`}>
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">包含时间戳</span>
                  <Switch
                    checked={exportConfig.includeTimestamp}
                    onChange={(v) => updateExportConfig({ includeTimestamp: v })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">包含发言人信息</span>
                  <Switch
                    checked={exportConfig.includeSpeakerInfo}
                    onChange={(v) => updateExportConfig({ includeSpeakerInfo: v })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">匿名化处理</span>
                  <Switch
                    checked={exportConfig.anonymize}
                    onChange={(v) => updateExportConfig({ anonymize: v })}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary-600" />
                  选择发言人
                </h2>
                <button
                  onClick={() => {
                    const allSelected = exportConfig.selectedSpeakerIds.length === speakers.length;
                    updateExportConfig({
                      selectedSpeakerIds: allSelected ? [] : speakers.map(s => s.id),
                    });
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  {exportConfig.selectedSpeakerIds.length === speakers.length ? '取消全选' : '全选'}
                </button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 max-h-48 overflow-y-auto">
              {speakers.map((speaker) => {
                const checked = exportConfig.selectedSpeakerIds.includes(speaker.id);
                return (
                  <div
                    key={speaker.id}
                    onClick={() => {
                      const next = checked
                        ? exportConfig.selectedSpeakerIds.filter(id => id !== speaker.id)
                        : [...exportConfig.selectedSpeakerIds, speaker.id];
                      updateExportConfig({ selectedSpeakerIds: next });
                    }}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ml-2 flex-shrink-0"
                      style={{ backgroundColor: speaker.color }}
                    >
                      {speaker.name.charAt(0)}
                    </div>
                    <span className="ml-2 text-sm text-gray-700 truncate">{speaker.name}</span>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  选择议题
                </h2>
                <button
                  onClick={() => {
                    const allSelected = exportConfig.selectedTopicIds.length === topics.length;
                    updateExportConfig({
                      selectedTopicIds: allSelected ? [] : topics.map(t => t.id),
                    });
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  {exportConfig.selectedTopicIds.length === topics.length ? '取消全选' : '全选'}
                </button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 max-h-48 overflow-y-auto">
              {topics.map((topic) => {
                const checked = exportConfig.selectedTopicIds.includes(topic.id);
                return (
                  <div
                    key={topic.id}
                    onClick={() => {
                      const next = checked
                        ? exportConfig.selectedTopicIds.filter(id => id !== topic.id)
                        : [...exportConfig.selectedTopicIds, topic.id];
                      updateExportConfig({ selectedTopicIds: next });
                    }}
                    className="flex items-start p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="ml-2 min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">{topic.title}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{topic.summary}</div>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-primary-600" />
                导出历史
              </h2>
            </CardHeader>
            <CardBody className="space-y-2">
              {exportHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileDown className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {item.format}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.time} · {item.size}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-primary-600" />
                  内容预览
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeWithHour(meeting.duration)}</span>
                  <span>·</span>
                  <span>{transcripts.length} 段发言</span>
                </div>
              </div>
            </CardHeader>
            
            <CardBody className="flex-1 overflow-hidden p-4">
              <div className="h-full bg-gray-100 rounded-xl p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg min-h-full">
                  {previewContent && (
                    <iframe
                      srcDoc={previewContent}
                      className="w-full h-full min-h-[600px] border-0"
                      title="预览"
                    />
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
