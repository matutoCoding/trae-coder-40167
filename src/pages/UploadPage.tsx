import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { formatFileSize, formatTimeWithHour, generateId } from '@/utils/format';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { 
  Upload, 
  FileAudio, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Mic,
  Users,
  Sparkles,
  Info
} from 'lucide-react';

export default function UploadPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'upload' | 'transcribing' | 'done'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNewMeeting, updateMeetingProgress, meetings } = useMeetingStore();
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);

  const transcribingStages = [
    { progress: 20, text: '音频解析中...' },
    { progress: 40, text: '语音识别中...' },
    { progress: 60, text: '声纹分离中...' },
    { progress: 80, text: '说话人聚类中...' },
    { progress: 100, text: '转写完成！' },
  ];

  useEffect(() => {
    if (isTranscribing && progress < 100) {
      const timer = setTimeout(() => {
        const nextProgress = Math.min(progress + 3 + Math.random() * 5, 100);
        setProgress(nextProgress);
        if (currentMeetingId) {
          updateMeetingProgress(currentMeetingId, nextProgress);
        }
        if (nextProgress >= 100) {
          setStage('done');
          setIsTranscribing(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTranscribing, progress, currentMeetingId, updateMeetingProgress]);

  const getCurrentStageIndex = () => {
    for (let i = transcribingStages.length - 1; i >= 0; i--) {
      if (progress >= transcribingStages[i].progress) {
        return i;
      }
    }
    return 0;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/aac'];
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac'];
    const isValid = validTypes.includes(file.type) || 
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValid) {
      alert('请上传音频文件（支持 MP3、WAV、M4A 格式）');
      return;
    }
    
    setFile(file);
  };

  const startTranscription = () => {
    if (!file) return;

    const newMeeting = addNewMeeting({
      title: file.name.replace(/\.[^/.]+$/, ''),
      audioFileName: file.name,
      audioFileSize: file.size,
      status: 'transcribing',
      duration: Math.floor(file.size / 15000),
    });

    setCurrentMeetingId(newMeeting.id);
    
    setIsTranscribing(true);
    setProgress(2);
    setStage('transcribing');
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setStage('upload');
    setIsTranscribing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReupload = () => {
    setFile(null);
    setProgress(0);
    setStage('upload');
    setIsTranscribing(false);
    setCurrentMeetingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const goToProofread = () => {
    const meetingId = currentMeetingId || 'meeting-001';
    navigate(`/proofread/${meetingId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">上传转写</h1>
        <p className="text-gray-500 mt-1">上传会议录音，系统将自动进行语音转写和声纹分离</p>
      </div>

      {stage === 'upload' && (
        <Card>
          <CardBody className="pt-6 pb-6">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-primary-500 bg-primary-50 scale-[1.01]'
                  : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.aac,audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                isDragging ? 'bg-primary-500 scale-110' : 'bg-white shadow-md'
              }`}>
                <Upload className={`w-10 h-10 transition-colors duration-300 ${
                  isDragging ? 'text-white' : 'text-primary-500'
                }`} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isDragging ? '松开以上传' : '拖拽音频文件到此处'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                或 <span className="text-primary-600 font-medium hover:underline cursor-pointer">点击选择文件</span>
              </p>
              
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  MP3
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  WAV
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  M4A
                </span>
                <span className="flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" />
                  最大 500MB
                </span>
              </div>
            </div>

            {file && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FileAudio className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </CardBody>
          
          <CardFooter className="flex justify-end">
            <Button
              size="lg"
              onClick={startTranscription}
              disabled={!file}
            >
              <Sparkles className="w-5 h-5" />
              开始转写
            </Button>
          </CardFooter>
        </Card>
      )}

      {stage === 'transcribing' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">转写中</h2>
              <span className="text-sm text-primary-600 font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <ProgressBar value={progress} size="lg" color="primary" />
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">
                  {file?.name || '会议录音'}
                </div>
                <div className="text-sm text-gray-500">
                  {formatFileSize(file?.size || 0)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {transcribingStages.map((item, index) => {
                const isActive = index <= getCurrentStageIndex();
                const isCurrent = index === getCurrentStageIndex() && progress < 100;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      isActive ? 'bg-primary-50/50' : 'bg-gray-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isActive && progress >= item.progress ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isActive ? 'text-gray-800 font-medium' : 'text-gray-400'
                    }`}>
                      {item.text}
                    </div>
                    {isCurrent && (
                      <span className="ml-auto text-xs text-primary-500 animate-pulse">
                        进行中
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Mic className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-lg font-bold text-gray-900">1</div>
                <div className="text-xs text-gray-500">音频通道</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-lg font-bold text-gray-900">4</div>
                <div className="text-xs text-gray-500">说话人识别</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-lg font-bold text-gray-900">约2分钟</div>
                <div className="text-xs text-gray-500">预计剩余</div>
              </div>
            </div>
          </CardBody>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReupload}>
              <X className="w-4 h-4" />
              取消
            </Button>
            <Button variant="ghost" onClick={handleReupload}>
              <RefreshCw className="w-4 h-4" />
              重新上传
            </Button>
          </CardFooter>
        </Card>
      )}

      {stage === 'done' && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">转写完成！</h2>
                <p className="text-sm text-gray-500">
                  共识别出 4 位说话人，{formatTimeWithHour(330)} 转写内容
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <FileAudio className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    {file?.name || '会议录音.mp3'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(file?.size || 0)} · {formatTimeWithHour(330)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { color: 'bg-[#4ecdc4]', name: '发言人1', count: '12段' },
                { color: 'bg-[#ffd93d]', name: '发言人2', count: '8段' },
                { color: 'bg-[#6bcb77]', name: '发言人3', count: '6段' },
                { color: 'bg-[#b19cd9]', name: '发言人4', count: '4段' },
              ].map((speaker, i) => (
                <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full ${speaker.color} mb-2`}></div>
                  <div className="text-sm font-medium text-gray-800">{speaker.name}</div>
                  <div className="text-xs text-gray-500">{speaker.count}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-800">
                  <p className="font-medium">温馨提示</p>
                  <p className="mt-1 text-primary-700">
                    进入校对页面后，您可以为声纹绑定真实姓名、部门和角色，
                    校对转写内容，系统将自动生成会议纪要。
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
          
          <CardFooter className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleReupload}>
              <RefreshCw className="w-4 h-4" />
              重新上传
            </Button>
            <Button size="md" onClick={goToProofread}>
              进入校对
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {stage === 'upload' && meetings.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">最近上传</h2>
          </CardHeader>
          <CardBody className="divide-y divide-gray-100 -py-2">
            {meetings.slice(0, 3).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
                onClick={() => navigate(`/proofread/${meeting.id}`)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileAudio className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {meeting.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(meeting.audioFileSize)}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
