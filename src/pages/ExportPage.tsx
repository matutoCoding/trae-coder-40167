import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { generateExportContent, exportFile, generateHtmlPreview, filterData } from '@/services/exportService';
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
  CheckSquare,
  Square,
  Save,
  Trash2,
  Layers,
  ArrowRight,
  AlertTriangle,
  Info,
  ListChecks
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '' });

  const meeting = meetings.find(m => m.id === meetingId);

  useEffect(() => {
    if (meetingId) {
      setCurrentMeeting(meetingId);
    }
  }, [meetingId, setCurrentMeeting]);

  const filteredData = useMemo(() => {
    if (!meeting) return null;
    return filterData(meeting, speakers, transcripts, topics, exportConfig);
  }, [meeting, speakers, transcripts, topics, exportConfig]);

  useEffect(() => {
    if (meeting && speakers.length > 0 && transcripts.length > 0) {
      const content = generateHtmlPreview(meeting, speakers, transcripts, topics, exportConfig, previewFormat);
      setPreviewContent(content);
    }
  }, [meeting, speakers, transcripts, topics, exportConfig, previewFormat]);

  const formatOptions: { value: ExportFormat; label: string; description: string; icon: typeof FileText; count: number }[] = useMemo(() => {
    const result = {
      full: filteredData?.filteredTranscripts.length || 0,
      decisions: (filteredData?.filteredTopics || []).reduce((sum, t) => sum + t.actionItems.length, 0),
      'by-person': filteredData?.filteredSpeakers.length || 0,
    };
    return [
      {
        value: 'full',
        label: '完整逐字稿',
        description: '按时间顺序完整呈现所有发言内容',
        icon: FileText,
        count: result.full,
      },
      {
        value: 'decisions',
        label: '决议与待办',
        description: '提取会议决议、结论和待办事项',
        icon: FileCheck,
        count: result.decisions,
      },
      {
        value: 'by-person',
        label: '按人员汇总',
        description: '按说话人分组展示各自发言内容',
        icon: Users,
        count: result['by-person'],
      },
    ];
  }, [filteredData]);

  const fileTypeOptions: { value: ExportFileType; label: string; icon: string }[] = [
    { value: 'txt', label: 'TXT 文本', icon: '📄' },
    { value: 'html', label: 'HTML 网页', icon: '🌐' },
  ];

  const canExport =
    exportConfig.selectedSpeakerIds.length > 0 &&
    exportConfig.selectedTopicIds.length > 0 &&
    exportConfig.formats.length > 0;

  const previewNotInExport = previewFormat && !exportConfig.formats.includes(previewFormat);

  const toggleFormat = (fmt: ExportFormat) => {
    const hasFmt = exportConfig.formats.includes(fmt);
    const next = hasFmt
      ? exportConfig.formats.filter(f => f !== fmt)
      : [...exportConfig.formats, fmt];
    updateExportConfig({ formats: next });
  };

  const handleExport = () => {
    if (!meeting || !canExport) return;
    setShowConfirmModal(true);
  };

  const confirmExport = () => {
    if (!meeting) return;
    setShowConfirmModal(false);
    setIsExporting(true);
    setTimeout(() => {
      exportFile(meeting, speakers, transcripts, topics, exportConfig);
      setIsExporting(false);
    }, 800);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) return;
    addExportTemplate({
      name: templateForm.name,
      description: templateForm.description,
      formats: [...exportConfig.formats],
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
            {isExporting ? '导出中...' : `导出文件（${exportConfig.formats.length}份）`}
          </Button>
        </div>
      </div>

      {exportConfig.formats.length === 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            请至少勾选 1 种导出格式，否则无法生成文件。
          </div>
        </div>
      )}

      {previewNotInExport && canExport && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2 flex-shrink-0">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            当前预览的是「{formatOptions.find(f => f.value === previewFormat)?.label}」，但尚未加入到导出列表，点击格式卡片的复选框可加入导出。
          </div>
        </div>
      )}

      {(exportConfig.selectedSpeakerIds.length === 0 || exportConfig.selectedTopicIds.length === 0) && (
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
                  {tpl.name}（{tpl.formats.length}份格式）
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
                        {filteredData?.filteredTranscripts.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">相关发言</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-primary-600">
                        {(filteredData?.filteredTopics || [])
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
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center">
                      <ListChecks className="w-5 h-5 mr-2 text-primary-600" />
                      导出格式（可多选）
                    </h2>
                    <button
                      onClick={() => {
                        const all = formatOptions.map(o => o.value);
                        const allSelected = exportConfig.formats.length === all.length;
                        updateExportConfig({
                          formats: allSelected ? [] : all,
                        });
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {exportConfig.formats.length === formatOptions.length ? '取消全选' : '全选'}
                    </button>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = exportConfig.formats.includes(option.value);
                    const isPreview = previewFormat === option.value;
                    return (
                      <div
                        key={option.value}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-400 bg-primary-50/50 shadow-sm'
                            : isPreview
                            ? 'border-gray-300 bg-gray-50'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <div
                            onClick={() => toggleFormat(option.value)}
                            className="mt-1 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                            )}
                          </div>
                          <div
                            onClick={() => setPreviewFormat(option.value)}
                            className="ml-3 flex-1 cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isPreview ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="ml-3">
                                  <div className={`font-medium text-sm ${
                                    isSelected ? 'text-primary-700' : 'text-gray-800'
                                  }`}>
                                    {option.label}
                                    {isPreview && (
                                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                        预览中
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-primary-600">{option.count}</div>
                                <div className="text-xs text-gray-400">
                                  {option.value === 'decisions' ? '条待办' : option.value === 'by-person' ? '位参会' : '段发言'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
                <CardFooter className="pt-0 text-xs text-gray-400">
                  已选 {exportConfig.formats.length}/{formatOptions.length} 种
                </CardFooter>
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
                        <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-1">
                          {tpl.formats.map(f => (
                            <span key={f} className="bg-gray-100 px-1.5 py-0.5 rounded">
                              {formatOptions.find(o => o.value === f)?.label}
                            </span>
                          ))}
                          {tpl.includeTimestamp && <span>·含时间戳</span>}
                          {tpl.anonymize && <span>·匿名</span>}
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
                    {formatOptions.map((opt) => {
                      const isInExport = exportConfig.formats.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setPreviewFormat(opt.value)}
                          className={`relative px-3 py-1.5 text-xs rounded-md transition-all ${
                            previewFormat === opt.value
                              ? 'bg-white text-primary-700 font-medium shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {opt.label}
                          {isInExport && exportConfig.formats.length > 1 && (
                            <CheckCircle2 className="inline-block w-3 h-3 ml-1 text-primary-500 -mt-0.5" />
                          )}
                        </button>
                      );
                    })}
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
                      <p className="font-medium">请先选择发言人和议题，再选择至少 1 种导出格式</p>
                      <p className="text-sm text-gray-400 mt-1">然后就能在这里看到对应格式的预览</p>
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
            <div className="space-y-1.5 text-xs text-gray-600">
              <div>导出格式：
                {exportConfig.formats.length > 0 ? (
                  exportConfig.formats.map(f => (
                    <span key={f} className="inline-block ml-1 px-1.5 py-0.5 bg-white rounded border border-gray-200">
                      {formatOptions.find(o => o.value === f)?.label}
                    </span>
                  ))
                ) : '（未选择）'}
              </div>
              <div>时间戳：{exportConfig.includeTimestamp ? '包含' : '不包含'}</div>
              <div>发言人信息：{exportConfig.includeSpeakerInfo ? '包含' : '不包含'}</div>
              <div>匿名化：{exportConfig.anonymize ? '开启' : '关闭'}</div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="确认导出"
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              再看看
            </Button>
            <Button onClick={confirmExport}>
              <Download className="w-4 h-4" />
              确认导出
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-2 p-3 bg-primary-50 border border-primary-100 rounded-lg">
            <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-800">
              请确认以下导出内容，确认后将生成
              <span className="font-bold mx-1">{exportConfig.formats.length}</span>
              份文件（
              {exportConfig.fileType === 'txt' ? 'TXT 文本' : 'HTML 网页'}
              格式）
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">会议</div>
              <div className="font-medium text-gray-800 truncate">{meeting.title}</div>
              <div className="text-xs text-gray-400 mt-1">{formatDate(meeting.date)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">选择发言人</div>
              <div className="text-2xl font-bold text-primary-600">
                {exportConfig.selectedSpeakerIds.length}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {speakers.length}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">选择议题</div>
              <div className="text-2xl font-bold text-primary-600">
                {exportConfig.selectedTopicIds.length}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {topics.length}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">将导出的文件：</div>
            <div className="space-y-2">
              {exportConfig.formats.map((fmt) => {
                const opt = formatOptions.find(o => o.value === fmt);
                const countMsg = fmt === 'full'
                  ? `${filteredData?.filteredTranscripts.length || 0} 段发言`
                  : fmt === 'decisions'
                  ? `${(filteredData?.filteredTopics || []).reduce((sum, t) => sum + t.actionItems.length, 0)} 条待办`
                  : `${filteredData?.filteredSpeakers.length || 0} 位参会人`;
                return (
                  <div
                    key={fmt}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="flex items-center">
                      {opt && <opt.icon className="w-5 h-5 text-primary-600 mr-3" />}
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {meeting.title}_{formatDate(meeting.date)}_{opt?.label}.
                          {exportConfig.fileType}
                        </div>
                        <div className="text-xs text-gray-400">{countMsg}</div>
                      </div>
                    </div>
                    <div className="text-sm text-primary-600 font-medium">
                      {opt?.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">包含的发言人：</div>
            <div className="flex flex-wrap gap-2">
              {speakers
                .filter(s => exportConfig.selectedSpeakerIds.includes(s.id))
                .map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-white font-medium"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name}
                  </span>
                ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">包含的议题：</div>
            <div className="space-y-1.5">
              {topics
                .filter(t => exportConfig.selectedTopicIds.includes(t.id))
                .map(t => (
                  <div key={t.id} className="flex items-start text-sm p-2 bg-gray-50 rounded">
                    <ListChecks className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5 mr-2" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">{t.title}</div>
                      <div className="text-xs text-gray-500 truncate">{t.summary}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
