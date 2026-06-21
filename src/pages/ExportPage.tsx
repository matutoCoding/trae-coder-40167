import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { generateExportContent, exportFile, generateHtmlPreview } from '@/services/exportService';
import { formatDate, formatTimeWithHour } from '@/utils/format';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import Modal from '@/components/ui/Modal';
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
  Square,
  Save,
  Trash2,
  Layers,
  ArrowRight,
  AlertTriangle,
  Plus
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
    exportTemplates,
    updateExportConfig,
    setCurrentMeeting,
    addExportTemplate,
    deleteExportTemplate,
    applyExportTemplate,
  } = useMeetingStore();

  const [activeStep, setActiveStep] = useState(1);
  const [previewFormat, setPreviewFormat] = useState<ExportFormat>('full');
  const [previewContent, setPreviewContent] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '' });

  const meeting = meetings.find(m => m.id === meetingId);

  useEffect(() => {
    if (meetingId) {
      setCurrentMeeting(meetingId);
    }
  }, [meetingId, setCurrentMeeting]);

  useEffect(() => {
    if (meeting && speakers.length > 0 && transcripts.length > 0) {
      const previewConfig = { ...exportConfig, format: previewFormat };
      const content = generateHtmlPreview(meeting, speakers, transcripts, topics, previewConfig);
      setPreviewContent(content);
    }
  }, [meeting, speakers, transcripts, topics, exportConfig, previewFormat]);

  const formatOptions: { value: ExportFormat; label: string; description: string; icon: typeof FileText }[] = [
    {
      value: 'full',
      label: '完整逐字稿',
      description: '按时间顺序完整呈现所有发言内容',
      icon: FileText,
    },
    {
      value: 'decisions',
      label: '决议与待办',
      description: '提取会议决议、结论和待办事项',
      icon: FileCheck,
    },
    {
      value: 'by-person',
      label: '按人员汇总',
      description: '按说话人分组展示各自发言内容',
      icon: Users,
    },
  ];

  const fileTypeOptions: { value: ExportFileType; label: string; icon: string }[] = [
    { value: 'txt', label: 'TXT 文本', icon: '📄' },
    { value: 'html', label: 'HTML 网页', icon: '🌐' },
  ];

  const canExport = exportConfig.selectedSpeakerIds.length > 0 && exportConfig.selectedTopicIds.length > 0;

  const handleExport = () => {
    if (!meeting || !canExport) return;
    
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

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) return;
    addExportTemplate({
      name: templateForm.name,
      description: templateForm.description,
      format: exportConfig.format,
      includeTimestamp: exportConfig.includeTimestamp,
      anonymize: exportConfig.anonymize,
      includeSpeakerInfo: exportConfig.includeSpeakerInfo,
    });
    setShowSaveTemplateModal(false);
    setTemplateForm({ name: '', description: '' });
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">会议不存在</div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: '选择内容', icon: CheckSquare },
    { id: 2, title: '选择格式', icon: FileText },
  ];

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
            <h1 className="text-xl font-bold text-gray-900">纪要导出向导</h1>
            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-0.5">
              <span>{meeting.title}</span>
              <span>·</span>
              <span>{formatDate(meeting.date)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowSaveTemplateModal(true)}
            disabled={!canExport}
          >
            <Save className="w-4 h-4" />
            保存模板
          </Button>
          <Button size="lg" onClick={handleExport} loading={isExporting} disabled={!canExport}>
            <Download className="w-5 h-5" />
            {isExporting ? '导出中...' : '导出文件'}
          </Button>
        </div>
      </div>

      {!canExport && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            请至少勾选 1 位发言人和 1 个议题，否则无法导出有效内容。
          </div>
        </div>
      )}

      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : isCompleted
                      ? 'text-primary-600 hover:bg-gray-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary-600 text-white' :
                    isCompleted ? 'bg-primary-200 text-primary-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-sm">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gray-200 mx-2" />
                )}
              </div>
            );
          })}
          
          <div className="ml-auto flex items-center space-x-2">
            <span className="text-xs text-gray-500">模板：</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  applyExportTemplate(e.target.value);
                }
                e.target.value = '';
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">选择模板...</option>
              {exportTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {activeStep === 1 && (
            <>
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
                        <span className="ml-auto text-xs text-gray-400">
                          {transcripts.filter(t => t.speakerId === speaker.id).length} 段
                        </span>
                      </div>
                    );
                  })}
                </CardBody>
                <CardFooter className="pt-0 text-xs text-gray-400">
                  已选 {exportConfig.selectedSpeakerIds.length}/{speakers.length} 位
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center">
                      <Layers className="w-5 h-5 mr-2 text-primary-600" />
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
                <CardBody className="space-y-2 max-h-64 overflow-y-auto">
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
                          <div className="text-xs text-gray-400 mt-1">
                            {(topic.segmentIds || []).length} 段发言 · {topic.actionItems.length} 条待办
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
                <CardFooter className="pt-0 text-xs text-gray-400">
                  已选 {exportConfig.selectedTopicIds.length}/{topics.length} 个
                </CardFooter>
              </Card>

              <Card className="mt-auto">
                <CardBody className="p-3">
                  <div className="text-xs text-gray-500 mb-2">已选内容统计</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-primary-600">
                        {transcripts.filter(t => 
                          exportConfig.selectedSpeakerIds.includes(t.speakerId) &&
                          (exportConfig.selectedTopicIds.length === topics.length ||
                           exportConfig.selectedTopicIds.some(tid => {
                             const topic = topics.find(tp => tp.id === tid);
                             return topic?.segmentIds?.includes(t.id);
                           }))
                        ).length}
                      </div>
                      <div className="text-xs text-gray-500">相关发言</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-primary-600">
                        {topics
                          .filter(t => exportConfig.selectedTopicIds.includes(t.id))
                          .reduce((sum, t) => sum + t.actionItems.length, 0)}
                      </div>
                      <div className="text-xs text-gray-500">待办事项</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {activeStep === 2 && (
            <>
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
                  <h2 className="font-semibold text-gray-900 flex items-center">
                    <Save className="w-5 h-5 mr-2 text-primary-600" />
                    导出模板
                  </h2>
                </CardHeader>
                <CardBody className="space-y-2">
                  {exportTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="flex items-start p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-800">{tpl.name}</span>
                          {tpl.id.startsWith('default-') && (
                            <span className="ml-2 text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">
                              预设
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {tpl.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatOptions.find(f => f.value === tpl.format)?.label}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => applyExportTemplate(tpl.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                          title="套用模板"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {!tpl.id.startsWith('default-') && (
                          <button
                            onClick={() => deleteExportTemplate(tpl.id)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-accent-500"
                            title="删除模板"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </>
          )}

          <Card className="mt-auto">
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    {formatOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPreviewFormat(opt.value)}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                          previewFormat === opt.value
                            ? 'bg-white text-primary-700 font-medium shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeWithHour(meeting.duration)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardBody className="flex-1 overflow-hidden p-4">
              <div className="h-full bg-gray-100 rounded-xl p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg min-h-full">
                  {!canExport ? (
                    <div className="h-[600px] flex flex-col items-center justify-center text-gray-500">
                      <AlertTriangle className="w-12 h-12 text-yellow-400 mb-3" />
                      <p className="font-medium">请先选择至少 1 位发言人和 1 个议题</p>
                      <p className="text-sm text-gray-400 mt-1">然后就能在这里看到导出内容的预览</p>
                    </div>
                  ) : previewContent ? (
                    <iframe
                      srcDoc={previewContent}
                      className="w-full h-full min-h-[600px] border-0"
                      title="预览"
                    />
                  ) : null}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        title="保存为导出模板"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowSaveTemplateModal(false)}
            >
              取消
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4" />
              保存
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              模板名称 <span className="text-accent-500">*</span>
            </label>
            <input
              type="text"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              placeholder="例如：领导版、项目组版"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              说明
            </label>
            <input
              type="text"
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              placeholder="简短描述这个模板的用途"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div className="pt-2 border-t border-gray-100 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-2">将保存以下配置：</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>格式：{formatOptions.find(f => f.value === exportConfig.format)?.label}</div>
              <div>时间戳：{exportConfig.includeTimestamp ? '包含' : '不包含'}</div>
              <div>发言人信息：{exportConfig.includeSpeakerInfo ? '包含' : '不包含'}</div>
              <div>匿名化：{exportConfig.anonymize ? '开启' : '关闭'}</div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
