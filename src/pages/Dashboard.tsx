import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { formatDate, formatTimeWithHour, formatFileSize } from '@/utils/format';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Upload, FileAudio, Clock, CheckCircle, Settings, Play, Users, FileText, TrendingUp, Calendar, Mic2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { meetings } = useMeetingStore();

  const stats = [
    { label: '本周会议', value: '12', icon: Calendar, color: 'bg-primary-100 text-primary-600' },
    { label: '总时长', value: '28.5h', icon: Clock, color: 'bg-green-100 text-green-600' },
    { label: '已完成', value: '8', icon: CheckCircle, color: 'bg-blue-100 text-blue-600' },
    { label: '待校对', value: '4', icon: Mic2, color: 'bg-amber-100 text-amber-600' },
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return '上传中';
      case 'transcribing': return '转写中';
      case 'proofreading': return '待校对';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-600';
      case 'transcribing': return 'bg-amber-100 text-amber-600';
      case 'proofreading': return 'bg-purple-100 text-purple-600';
      case 'completed': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getMeetingAction = (meeting: typeof meetings[0]) => {
    if (meeting.status === 'uploading' || meeting.status === 'transcribing') {
      return { text: '查看进度', path: `/upload?meetingId=${meeting.id}` };
    }
    if (meeting.status === 'proofreading') {
      return { text: '开始校对', path: `/proofread/${meeting.id}` };
    }
    return { text: '查看纪要', path: `/export/${meeting.id}` };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">欢迎回来，今天有 4 个会议待处理</p>
        </div>
        <Button size="lg" onClick={() => navigate('/upload')}>
          <Upload className="w-5 h-5" />
          上传新会议
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} hoverable>
              <CardBody className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">最近会议</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看全部
            </button>
          </div>
          
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const action = getMeetingAction(meeting);
              return (
                <Card key={meeting.id} hoverable>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <FileAudio className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{meeting.title}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(meeting.date)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTimeWithHour(meeting.duration)}
                            </span>
                            <span>{formatFileSize(meeting.audioFileSize)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                          {getStatusText(meeting.status)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(action.path)}
                        >
                          {action.text}
                        </Button>
                      </div>
                    </div>
                    
                    {meeting.status === 'transcribing' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>转写进度</span>
                          <span>{meeting.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${meeting.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">快捷操作</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Card hoverable className="text-center cursor-pointer" onClick={() => navigate('/upload')}>
              <CardBody className="py-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-sm font-medium text-gray-800">上传音频</div>
                <div className="text-xs text-gray-500 mt-1">支持 MP3/WAV/M4A</div>
              </CardBody>
            </Card>
            
            <Card hoverable className="text-center cursor-pointer" onClick={() => navigate('/proofread/meeting-001')}>
              <CardBody className="py-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm font-medium text-gray-800">说话人校对</div>
                <div className="text-xs text-gray-500 mt-1">绑名 / 合并 / 拆分</div>
              </CardBody>
            </Card>
            
            <Card hoverable className="text-center cursor-pointer" onClick={() => navigate('/export/meeting-001')}>
              <CardBody className="py-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-sm font-medium text-gray-800">纪要导出</div>
                <div className="text-xs text-gray-500 mt-1">三种格式可选</div>
              </CardBody>
            </Card>
            
            <Card hoverable className="text-center cursor-pointer">
              <CardBody className="py-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-gray-800">声纹库</div>
                <div className="text-xs text-gray-500 mt-1">管理说话人档案</div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                本周效率
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">平均处理时长</span>
                    <span className="font-medium text-gray-900">12 分钟</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-4/5 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">转写准确率</span>
                    <span className="font-medium text-gray-900">96.5%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-[96.5%] bg-primary-400 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">声纹识别率</span>
                    <span className="font-medium text-gray-900">89.2%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-[89%] bg-amber-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
