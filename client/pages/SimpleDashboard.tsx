import { useState, useEffect } from "react";
import { CheckCircle2, Target, Timer, Plus, Flame, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MobileLayout from "@/components/MobileLayout";
import { HabitDataService } from "@/lib/habitData";
import { FocusDataService } from "@/lib/focusData";

const SimpleDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [habitStats, setHabitStats] = useState({
    activeHabits: 0,
    completedToday: 0,
    longestStreak: 0,
    totalHabits: 0,
    weeklyProgress: 0
  });
  const [focusStats, setFocusStats] = useState(FocusDataService.getStats());

  // Load habit stats from Firebase
  useEffect(() => {
    if (user?.uid) {
      HabitDataService.setUserId(user.uid);
      HabitDataService.getHabitStats()
        .then(stats => setHabitStats(stats))
        .catch(error => console.error('Error loading habit stats:', error));
    }
  }, [user?.uid]);

  const userName = user?.displayName || user?.email?.split('@')[0] || "User";

  // Get dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Hello there";
  };

  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };

  // Sample tasks data
  const tasksByStatus = {
    done: [1, 2, 3], // Mock completed tasks
    next: [1, 2, 3, 4] // Mock pending tasks
  };

  const saveMoodFromDashboard = (moodEmoji: string) => {
    toast({
      title: "Mood logged! 😊",
      description: `Your mood has been saved.`,
    });
  };

  const headerActions = (
    <Button
      onClick={() => navigate('/tasks')}
      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
    >
      <Plus className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">New Task</span>
      <span className="sm:hidden">Add</span>
    </Button>
  );

  return (
    <MobileLayout
      currentPage="dashboard"
      title={`${getGreeting()}, ${userName}!`}
      subtitle={getCurrentDate()}
      headerActions={headerActions}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
          <Flame className="w-8 h-8 text-white mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{habitStats.longestStreak || 7}</div>
          <div className="text-xs text-orange-100 font-medium">Day Streak</div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
          <Timer className="w-8 h-8 text-white mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{focusStats.todaySessions}</div>
          <div className="text-xs text-blue-100 font-medium">Focus</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
          <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{tasksByStatus.done.length}</div>
          <div className="text-xs text-green-100 font-medium">Tasks</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
          <Target className="w-8 h-8 text-white mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{habitStats.completedToday}</div>
          <div className="text-xs text-purple-100 font-medium">Habits</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            className="h-24 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all transform hover:scale-105 active:scale-95 p-4 flex flex-col items-center justify-center"
            onClick={() => navigate('/focus-timer')}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-blue-700">Focus Timer</span>
          </button>
          
          <button
            className="h-24 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl border-2 border-green-200 hover:border-green-400 transition-all transform hover:scale-105 active:scale-95 p-4 flex flex-col items-center justify-center"
            onClick={() => navigate('/tasks')}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-green-700">Tasks</span>
          </button>
          
          <button
            className="h-24 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all transform hover:scale-105 active:scale-95 p-4 flex flex-col items-center justify-center"
            onClick={() => navigate('/habits')}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-purple-700">Habits</span>
          </button>
          
          <button
            className="h-24 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 rounded-2xl border-2 border-pink-200 hover:border-pink-400 transition-all transform hover:scale-105 active:scale-95 p-4 flex flex-col items-center justify-center"
            onClick={() => navigate('/mood-tracker')}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl">😊</span>
            </div>
            <span className="font-semibold text-pink-700">Mood Tracker</span>
          </button>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Today's Tasks</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/tasks')}
            className="text-blue-600 hover:bg-blue-50 rounded-xl"
          >
            View All →
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Finalize project proposal</p>
              <p className="text-sm text-gray-500">High • Today, 2:00 PM</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Review analytics dashboard</p>
              <p className="text-sm text-gray-500">Medium • Today, 4:30 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Check */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">How are you feeling?</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {['😊', '😐', '😴', '🤔', '😰', '😢', '🥳', '😌'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => saveMoodFromDashboard(emoji)}
              className="w-full h-14 text-2xl rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all transform hover:scale-110 active:scale-95 bg-white/80 backdrop-blur-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
        <Button 
          variant="outline" 
          className="w-full h-12 border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 rounded-xl font-semibold text-pink-700"
          onClick={() => navigate('/mood-tracker')}
        >
          📊 Detailed Tracking
        </Button>
      </div>
    </MobileLayout>
  );
};

export default SimpleDashboard;
