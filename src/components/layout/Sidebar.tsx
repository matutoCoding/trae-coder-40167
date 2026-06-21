import { NavLink, useLocation } from 'react-router-dom';
import { Upload, FileText, Users, Home, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '工作台' },
  { path: '/upload', icon: Upload, label: '上传转写' },
  { path: '/proofread/meeting-001', icon: Users, label: '说话人校对' },
  { path: '/export/meeting-001', icon: FileText, label: '纪要导出' },
];

export default function Sidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path.startsWith('/proofread')) {
      return location.pathname.startsWith('/proofread');
    }
    if (path.startsWith('/export')) {
      return location.pathname.startsWith('/export');
    }
    return location.pathname === path;
  };

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-6 border-b border-gray-50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <span className="ml-3 font-semibold text-lg text-primary-800">会议纪要</span>
      </div>
      
      <nav className="flex-1 py-4 px-3">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
          主要功能
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-3 border-t border-gray-50">
        <button className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <Settings className="w-5 h-5 mr-3 text-gray-400" />
          设置
        </button>
      </div>
    </aside>
  );
}
