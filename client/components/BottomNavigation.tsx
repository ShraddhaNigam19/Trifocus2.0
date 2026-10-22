import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Target, BookOpen, StickyNote, Timer, Brain, LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  const navItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: "Home",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      path: "/tasks",
      icon: Brain,
      label: "Tasks",
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      path: "/habits",
      icon: Target,
      label: "Habits",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      path: "/journal",
      icon: BookOpen,
      label: "Journal",
      gradient: "from-pink-500 to-pink-600"
    },
    {
      path: "/focus-timer",
      icon: Timer,
      label: "Timer",
      gradient: "from-orange-500 to-orange-600"
    },
  ];

  const isActive = (path: string) => location.pathname === path;

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

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 transform ${
                active
                  ? 'scale-105'
                  : 'scale-100 hover:scale-105'
              }`}
            >
              <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                active
                  ? `bg-gradient-to-r ${item.gradient} shadow-lg shadow-${item.gradient.split('-')[1]}-500/30`
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}>
                <Icon className={`w-5 h-5 transition-colors duration-300 ${
                  active ? 'text-white' : 'text-gray-600'
                }`} />

                {active && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse" />
                )}
              </div>

              <span className={`text-xs font-medium mt-1 transition-colors duration-300 ${
                active ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {item.label}
              </span>

              {active && (
                <div className={`w-1 h-1 rounded-full mt-1 bg-gradient-to-r ${item.gradient} animate-pulse`} />
              )}
            </button>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 transform scale-100 hover:scale-105"
        >
          <div className="relative p-2 rounded-lg transition-all duration-300 bg-red-100 hover:bg-red-200">
            <LogOut className="w-5 h-5 transition-colors duration-300 text-red-600" />
          </div>

          <span className="text-xs font-medium mt-1 transition-colors duration-300 text-red-600">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
