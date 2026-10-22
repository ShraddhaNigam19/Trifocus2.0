import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, CheckCircle2, Target, Brain, Timer, LogOut, BookOpen, StickyNote, 
  Zap, Menu, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  currentPage?: string;
}

const Sidebar = ({ currentPage }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const userName = user?.displayName || user?.email?.split('@')[0] || "User";

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const navigationItems = [
    { path: "/dashboard", icon: Home, label: "Overview", section: "dashboard" },
    { path: "/tasks", icon: CheckCircle2, label: "Tasks", section: "main" },
    { path: "/habits", icon: Target, label: "Habits", section: "main" },
    { path: "/journal", icon: BookOpen, label: "Journal", section: "main" },
    { path: "/notes", icon: StickyNote, label: "Notes", section: "main" },
    { path: "/mood-tracker", icon: Brain, label: "Mood Tracker", section: "main" },
    { path: "/focus-timer", icon: Timer, label: "Focus Timer", section: "main" },
    { path: "/smart-suggestions", icon: Zap, label: "Smart Suggestions", section: "ai" }
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <button
        onClick={() => {
          navigate(item.path);
          setIsMobileOpen(false);
        }}
        className={`flex items-center w-full p-4 sm:p-3 rounded-lg transition-all duration-200 group ${
          active 
            ? 'bg-blue-100 text-blue-700 font-medium' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={`w-6 h-6 sm:w-5 sm:h-5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
        {!isCollapsed && <span className="truncate text-base sm:text-sm font-medium">{item.label}</span>}
        {isCollapsed && (
          <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <style>{`
        .modern-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modern-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
          transition: background 0.2s ease;
        }
        .modern-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>


      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        fixed top-0 left-0 h-screen bg-white border-r border-gray-200
        flex flex-col transition-all duration-300 ease-in-out z-50 w-80 sm:w-72 lg:z-40
        shadow-xl lg:shadow-none lg:flex
      `}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="relative w-10 h-10 sm:w-8 sm:h-8 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-sm">
                  <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg">
                    <div className="relative w-5 h-5">
                      <div className="absolute inset-0 border border-white/40 rounded-full animate-pulse" style={{animationDuration: '2s'}}></div>
                      <div className="absolute inset-0.5 border border-white/60 rounded-full animate-pulse" style={{animationDuration: '1.5s', animationDelay: '0.3s'}}></div>
                      <div className="absolute inset-1 border border-white/80 rounded-full animate-pulse" style={{animationDuration: '1s', animationDelay: '0.6s'}}></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      <div className="absolute inset-0 animate-spin" style={{animationDuration: '8s'}}>
                        <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {!isCollapsed && <span className="font-bold text-gray-900 text-xl sm:text-lg">Trifocus</span>}
            </div>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
            
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-4 modern-scroll" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}>
          {/* Dashboard Section */}
          <div className="mb-6">
            {!isCollapsed && (
              <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Dashboard
              </div>
            )}
            <nav className="space-y-1">
              {navigationItems
                .filter(item => item.section === 'dashboard')
                .map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
            </nav>
          </div>

          {/* Main Navigation */}
          <div className="mb-6">
            {!isCollapsed && (
              <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Tools
              </div>
            )}
            <nav className="space-y-1">
              {navigationItems
                .filter(item => item.section === 'main')
                .map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
            </nav>
          </div>

          {/* AI Section */}
          <div>
            {!isCollapsed && (
              <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                AI Assistant
              </div>
            )}
            <nav className="space-y-1">
              {navigationItems
                .filter(item => item.section === 'ai')
                .map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-4">
          {/* User Profile */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base sm:text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-base sm:text-sm font-medium text-gray-900 truncate">{userName}</div>
                  <div className="text-sm sm:text-xs text-gray-500">Free Account</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400" />
                </button>
              </>
            )}
            
            {isCollapsed && (
              <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {userName} - Click to logout
              </div>
            )}
            
            {isCollapsed && (
              <button 
                onClick={handleLogout}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Logout"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
