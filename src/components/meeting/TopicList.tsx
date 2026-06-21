import { Topic } from '@/types';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useState } from 'react';

interface TopicListProps {
  topics: Topic[];
  onUpdateTopic?: (id: string, updates: Partial<Topic>) => void;
}

export default function TopicList({ topics, onUpdateTopic }: TopicListProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    new Set(topics.map(t => t.id))
  );

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-3">
      {topics.map((topic, index) => (
        <div
          key={topic.id}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-card"
        >
          <div
            className="flex items-start p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleTopic(topic.id)}
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-medium mr-3">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800 text-sm">{topic.title}</h4>
              {!expandedTopics.has(topic.id) && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{topic.summary}</p>
              )}
            </div>
            {expandedTopics.has(topic.id) ? (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
          
          {expandedTopics.has(topic.id) && (
            <div className="px-4 pb-4 animate-fade-in">
              <div className="ml-10">
                <p className="text-sm text-gray-600 mb-3">{topic.summary}</p>
                
                {topic.actionItems && topic.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      待办事项
                    </div>
                    {topic.actionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start p-2.5 bg-gray-50 rounded-lg"
                      >
                        {getStatusIcon(item.status)}
                        <div className="ml-2.5 flex-1 min-w-0">
                          <div className="text-sm text-gray-700">{item.content}</div>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                            <span>负责人：{item.assignee}</span>
                            <span>截止：{item.deadline}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
