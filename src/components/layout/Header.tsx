import { Bell, Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索会议..."
            className="w-64 h-9 pl-9 pr-4 rounded-lg bg-gray-50 border border-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <button className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full"></span>
        </button>
        
        <div className="h-6 w-px bg-gray-200"></div>
        
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-800">张秘书</div>
            <div className="text-xs text-gray-500">行政部</div>
          </div>
        </div>
      </div>
    </header>
  );
}
