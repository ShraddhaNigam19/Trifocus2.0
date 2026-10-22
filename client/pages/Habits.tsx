import { useState, useEffect } from "react";
import { 
  CheckCircle2, Target, Brain, Timer, LogOut, Plus, Search, Bell, X, Check, BookOpen, Zap, 
  StickyNote, Settings, Edit3, Trash2, Calendar, Clock, TrendingUp, Award, Flame,
  Activity, Book, Heart, Droplets, Utensils, Moon, Coffee, Dumbbell, Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { HabitDataService, Habit, HabitEntry } from "@/lib/habitData";
import { FocusService } from "@/lib/dataServices";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";

const Habits = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [stats, setStats] = useState({
    activeHabits: 0,
    completedToday: 0,
    longestStreak: 0,
    totalHabits: 0,
    weeklyProgress: 0
  });
  const [weeklyProgress, setWeeklyProgress] = useState<{ date: string; dayName: string; completion: number; isToday: boolean }[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'analytics'>('today');
  const [showNewHabitForm, setShowNewHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [focusStats, setFocusStats] = useState<{[key: string]: {sessions: number, totalTime: number}}>({});

  // New habit form state
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'wellness',
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    color: 'blue',
    icon: '🎯',
    reminder: { enabled: false, time: '09:00' }
  });

  const categories = [
    { id: 'wellness', name: 'Wellness', icon: Heart, color: 'pink' },
    { id: 'fitness', name: 'Fitness', icon: Dumbbell, color: 'orange' },
    { id: 'learning', name: 'Learning', icon: Book, color: 'purple' },
    { id: 'health', name: 'Health', icon: Activity, color: 'green' },
    { id: 'nutrition', name: 'Nutrition', icon: Utensils, color: 'yellow' },
    { id: 'productivity', name: 'Productivity', icon: Target, color: 'blue' },
    { id: 'mindfulness', name: 'Mindfulness', icon: Leaf, color: 'emerald' },
    { id: 'sleep', name: 'Sleep', icon: Moon, color: 'indigo' }
  ];

  const colorOptions = [
    'blue', 'emerald', 'purple', 'pink', 'orange', 'yellow', 'cyan', 'indigo', 'red', 'green'
  ];

  const iconOptions = [
    '🎯', '💪', '📚', '🧘', '💧', '🏃', '🥗', '😴', '☕', '📝', '🎨', '🎵', '🌱', '⚡', '🔥'
  ];

  useEffect(() => {
    if (user?.uid) {
      HabitDataService.setUserId(user.uid);
      loadData();
    }
  }, [user?.uid]);

  // Populate form when editing
  useEffect(() => {
    if (editingHabit) {
      setNewHabit({
        name: editingHabit.name,
        description: editingHabit.description || '',
        category: editingHabit.category,
        frequency: editingHabit.frequency,
        color: editingHabit.color,
        icon: editingHabit.icon || '🎯',
        reminder: editingHabit.reminder || { enabled: false, time: '09:00' }
      });
    }
  }, [editingHabit]);

  const loadData = async () => {
    try {
      const loadedHabits = await HabitDataService.getHabits();
      const loadedEntries = await HabitDataService.getHabitEntries();
      const updatedStats = await HabitDataService.getHabitStats();
      const updatedWeeklyProgress = await HabitDataService.getWeeklyProgress();

      setHabits(loadedHabits);
      setHabitEntries(loadedEntries);
      setStats(updatedStats);
      setWeeklyProgress(updatedWeeklyProgress);

      // Load focus stats for each habit
      const newFocusStats: {[key: string]: {sessions: number, totalTime: number}} = {};
      loadedHabits.forEach(habit => {
        newFocusStats[habit.id] = {
          sessions: 0,
          totalTime: 0
        };
      });
      setFocusStats(newFocusStats);
    } catch (error) {
      console.error('Error loading habit data:', error);
      toast({
        title: "Error loading habits",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    }
  };

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

  const toggleHabitCompletion = async (habitId: string, date: string) => {
    try {
      const existingEntry = await HabitDataService.getHabitCompletion(habitId, date);
      
      if (existingEntry) {
        await HabitDataService.markHabitIncomplete(habitId, date);
        toast({
          title: "Habit unmarked",
          description: "Keep going, you've got this!",
        });
      } else {
        await HabitDataService.markHabitComplete(habitId, date);
        toast({
          title: "Great job! 🎉",
          description: "Habit completed successfully!",
        });
      }
      
      await loadData();
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      toast({
        title: "Error",
        description: "Failed to update habit completion",
        variant: "destructive"
      });
    }
  };

  const createHabit = async () => {
    try {
      if (!newHabit.name.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a habit name.",
          variant: "destructive",
        });
        return;
      }

      if (editingHabit) {
        // Update existing habit
        await HabitDataService.updateHabit(editingHabit.id, {
          ...newHabit,
          isActive: true
        });

        toast({
          title: "Habit updated! ✨",
          description: "Your habit has been successfully updated!",
        });
      } else {
        // Create new habit
        await HabitDataService.addHabit({
          ...newHabit,
          isActive: true
        });

        toast({
          title: "Habit created! 🌟",
          description: "Start building your new habit today!",
        });
      }

      // Reset form
      setNewHabit({
        name: '',
        description: '',
        category: 'wellness',
        frequency: 'daily',
        color: 'blue',
        icon: '🎯',
        reminder: { enabled: false, time: '09:00' }
      });

      setShowNewHabitForm(false);
      setEditingHabit(null);
      await loadData();
    } catch (error) {
      console.error('Error creating/updating habit:', error);
      toast({
        title: "Error",
        description: "Failed to save habit",
        variant: "destructive"
      });
    }
  };

  const startFocusSession = async (habit: Habit) => {
    if (!user?.uid) {
      toast({
        title: "Authentication required",
        description: "Please log in to start focus sessions",
        variant: "destructive"
      });
      return;
    }

    try {
      await FocusService.createSession({
        duration: 25,
        sessionType: 'pomodoro',
        customTitle: habit.name,
        habitId: habit.id
      }, user.uid);

      toast({
        title: "Focus session started! 🎯",
        description: `25 minute session for ${habit.name}`,
      });
      navigate('/focus-timer');
    } catch (error) {
      console.warn('Failed to start focus session:', error);
      toast({
        title: "Focus session started! 🎯",
        description: `25 minute session for ${habit.name}`,
      });
      navigate('/focus-timer');
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (confirm("Are you sure you want to delete this habit? This will remove all related data.")) {
      try {
        await HabitDataService.deleteHabit(habitId);
        await loadData();
        toast({
          title: "Habit deleted",
          description: "Habit and all related data removed.",
        });
      } catch (error) {
        console.error('Error deleting habit:', error);
        toast({
          title: "Error",
          description: "Failed to delete habit",
          variant: "destructive"
        });
      }
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; border: string; text: string; button: string } } = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', button: 'bg-blue-500' },
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', button: 'bg-emerald-500' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', button: 'bg-purple-500' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', button: 'bg-pink-500' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', button: 'bg-orange-500' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', button: 'bg-yellow-500' },
      cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', button: 'bg-cyan-500' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', button: 'bg-indigo-500' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', button: 'bg-red-500' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', button: 'bg-green-500' }
    };
    return colorMap[color] || colorMap.blue;
  };

  const getTodaysHabits = () => {
    const today = new Date().toISOString().split('T')[0];
    const safeHabits = Array.isArray(habits) ? habits : [];
    return safeHabits.filter(h => h.isActive && h.id).map(habit => {
      let completion = null;
      let streak = 0;

      try {
        completion = HabitDataService.getHabitCompletion(habit.id, today);
        streak = HabitDataService.getStreakForHabit(habit.id) || 0;
      } catch (error) {
        console.warn('Error getting habit data for:', habit.id, error);
      }

      return { ...habit, completed: !!completion, streak };
    });
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || "Alex";

  return (
    <>
      {/* Desktop Layout */}
      <div className="desktop-only hidden lg:block min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="flex min-h-screen">
          <Sidebar currentPage="habits" />

          {/* Main Content */}
          <div className="flex-1 ml-72 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">Habit Tracker</h1>
                      <p className="text-sm text-gray-500">Build consistency, one day at a time</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {[
                      { id: 'today', label: 'Today', icon: Calendar },
                      { id: 'all', label: 'All Habits', icon: Target },
                      { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => setShowNewHabitForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Habit
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
              {/* Stats Overview */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Active Habits</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.activeHabits}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Completed Today</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.completedToday}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Weekly Rate</div>
                      <div className="text-2xl font-bold text-gray-900">{isNaN(stats.weeklyProgress) ? '0' : Math.round(stats.weeklyProgress)}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Flame className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Best Streak</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.longestStreak || 0}</div>
                      <div className="text-xs text-gray-500">days</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
                <div className="grid grid-cols-7 gap-4">
                  {weeklyProgress.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">{day.dayName}</div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium border-2 ${
                        day.isToday 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : day.completion >= 80
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : day.completion >= 50
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : day.completion > 0
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {isNaN(day.completion) ? '0' : Math.round(day.completion)}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Habit Content - same as original */}
              {activeTab === 'today' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Habits</h3>
                  {getTodaysHabits().map((habit) => {
                    const colorClasses = getColorClasses(habit.color || 'blue');
                    return (
                      <div key={habit.id} className={`${colorClasses.bg} ${colorClasses.border} border rounded-xl p-6 transition-all hover:shadow-md`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleHabitCompletion(habit.id, new Date().toISOString().split('T')[0])}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                habit.completed
                                  ? `${colorClasses.button} text-white shadow-lg scale-110`
                                  : `bg-white border-2 ${colorClasses.border} hover:bg-gray-50`
                              }`}
                            >
                              {habit.completed ? (
                                <Check className="w-6 h-6" />
                              ) : (
                                <span className="text-2xl">{habit.icon}</span>
                              )}
                            </button>
                            <div>
                              <h4 className={`text-lg font-semibold ${colorClasses.text}`}>{habit.name}</h4>
                              <p className="text-sm text-gray-600">{habit.description}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Flame className="w-4 h-4" />
                                  <span>{habit.streak} day streak</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>{habit.frequency}</span>
                                </div>
                                {focusStats[habit.id]?.sessions > 0 && (
                                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                                    <Timer className="w-4 h-4" />
                                    <span>{focusStats[habit.id].sessions} sessions ({Math.round(focusStats[habit.id].totalTime / 60)}h)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startFocusSession(habit)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                              title="Start focus session for this habit"
                            >
                              <Timer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingHabit(habit)}
                              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => deleteHabit(habit.id)}
                              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'all' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Habits</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {(Array.isArray(habits) ? habits : []).filter(h => h.isActive).map((habit) => {
                      if (!habit || !habit.id) return null;

                      const colorClasses = getColorClasses(habit.color || 'blue');
                      let streak = 0;
                      try {
                        streak = HabitDataService.getStreakForHabit(habit.id) || 0;
                      } catch (error) {
                        console.warn('Error getting streak for habit:', habit.id, error);
                        streak = 0;
                      }
                      return (
                        <div key={habit.id} className={`${colorClasses?.bg || 'bg-blue-50'} ${colorClasses?.border || 'border-blue-200'} border rounded-xl p-6`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 ${colorClasses?.button || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white`}>
                                <span className="text-lg">{habit.icon || '🎯'}</span>
                              </div>
                              <div>
                                <h4 className={`font-semibold ${colorClasses?.text || 'text-blue-800'}`}>{habit.name || 'Unnamed Habit'}</h4>
                                <p className="text-sm text-gray-600">{habit.frequency || 'daily'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => startFocusSession(habit)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-600"
                                title="Start focus session"
                              >
                                <Timer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingHabit(habit)}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                <Edit3 className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => deleteHabit(habit.id)}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{habit.description || ''}</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Flame className="w-4 h-4" />
                                <span>{streak} day streak</span>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses?.bg || 'bg-blue-50'} ${colorClasses?.text || 'text-blue-800'}`}>
                                {categories.find(c => c.id === habit.category)?.name || 'Unknown'}
                              </div>
                            </div>
                            {focusStats[habit.id]?.sessions > 0 && (
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Timer className="w-3 h-3" />
                                  <span>{focusStats[habit.id].sessions} focus sessions</span>
                                </div>
                                <span>{Math.round(focusStats[habit.id].totalTime / 60)} hours focused</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics & Insights</h3>
                  
                  {/* Category Breakdown */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Habits by Category</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {categories.map(category => {
                        const count = (Array.isArray(habits) ? habits : []).filter(h => h.category === category.id && h.isActive).length;
                        if (count === 0) return null;
                        return (
                          <div key={category.id} className="text-center">
                            <div className={`w-12 h-12 bg-${category.color}-100 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                              <category.icon className={`w-6 h-6 text-${category.color}-600`} />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{count}</div>
                            <div className="text-xs text-gray-500">{category.name}</div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>

                  {/* Completion Trends */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Completion Trends</h4>
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Detailed analytics coming soon!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="mobile-only block lg:hidden min-h-screen min-h-[100dvh] bg-gray-50">
        
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 pb-6" style={{paddingTop: 'max(60px, env(safe-area-inset-top) + 20px)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg leading-tight">Habit Tracker</h1>
                <p className="text-purple-100 text-sm">Build consistency daily</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNewHabitForm(true)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="px-4 pb-6 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.completedToday}/{stats.activeHabits}</div>
                <div className="text-purple-100 text-sm">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.longestStreak || 0}</div>
                <div className="text-purple-100 text-sm">Best Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 pt-20 pb-48 space-y-6">
          {/* Mobile Tab Navigation */}
          <div className="flex bg-white rounded-2xl p-1 shadow-sm">
            {[
              { id: 'today', label: 'Today', icon: Calendar },
              { id: 'all', label: 'All', icon: Target },
              { id: 'analytics', label: 'Stats', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Today's Habits */}
          {activeTab === 'today' && (
            <div className="space-y-4">
              {getTodaysHabits().map((habit) => {
                const colorClasses = getColorClasses(habit.color || 'blue');
                return (
                  <div key={habit.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleHabitCompletion(habit.id, new Date().toISOString().split('T')[0])}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                          habit.completed
                            ? `${colorClasses.button} text-white shadow-lg`
                            : `bg-gray-100 border-2 ${colorClasses.border} hover:bg-gray-50`
                        }`}
                      >
                        {habit.completed ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <span className="text-xl">{habit.icon}</span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-base">{habit.name}</h4>
                        <p className="text-sm text-gray-600">{habit.description}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Flame className="w-3 h-3" />
                            <span>{habit.streak || 0}d</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{habit.frequency}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => startFocusSession(habit)}
                        className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0"
                      >
                        <Timer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile All Habits */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {(Array.isArray(habits) ? habits : []).filter(h => h.isActive).map((habit) => {
                if (!habit || !habit.id) return null;

                const colorClasses = getColorClasses(habit.color || 'blue');
                let streak = 0;
                try {
                  streak = HabitDataService.getStreakForHabit(habit.id) || 0;
                } catch (error) {
                  console.warn('Error getting streak for habit:', habit.id, error);
                  streak = 0;
                }
                return (
                  <div key={habit.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${colorClasses?.button || 'bg-blue-500'} rounded-xl flex items-center justify-center text-white`}>
                          <span className="text-lg">{habit.icon || '🎯'}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{habit.name || 'Unnamed Habit'}</h4>
                          <p className="text-sm text-gray-600">{habit.frequency || 'daily'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startFocusSession(habit)}
                          className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"
                        >
                          <Timer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingHabit(habit)}
                          className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{habit.description || ''}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Flame className="w-4 h-4" />
                        <span>{streak} day streak</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses?.bg || 'bg-blue-50'} ${colorClasses?.text || 'text-blue-800'}`}>
                        {categories.find(c => c.id === habit.category)?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}

          {/* Mobile Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Weekly Progress */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Progress</h3>
                <div className="grid grid-cols-7 gap-2">
                  {weeklyProgress.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">{day.dayName.slice(0, 3)}</div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium border-2 ${
                        day.isToday 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : day.completion >= 80
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : day.completion >= 50
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : day.completion > 0
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {isNaN(day.completion) ? '0' : Math.round(day.completion)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map(category => {
                    const count = (Array.isArray(habits) ? habits : []).filter(h => h.category === category.id && h.isActive).length;
                    if (count === 0) return null;
                    return (
                      <div key={category.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <div className={`w-10 h-10 bg-${category.color}-100 rounded-xl flex items-center justify-center`}>
                          <category.icon className={`w-5 h-5 text-${category.color}-600`} />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{count}</div>
                          <div className="text-sm text-gray-600">{category.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* New/Edit Habit Modal */}
      {(showNewHabitForm || editingHabit) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingHabit ? 'Edit Habit' : 'Create New Habit'}
                </h3>
                <button
                  onClick={() => {
                    setShowNewHabitForm(false);
                    setEditingHabit(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Habit Name</label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="e.g., Morning Meditation"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    placeholder="Brief description of your habit"
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newHabit.category}
                    onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewHabit({ ...newHabit, icon })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                          newHabit.icon === icon ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(color => {
                      const colorClasses = getColorClasses(color);
                      return (
                        <button
                          key={color}
                          onClick={() => setNewHabit({ ...newHabit, color })}
                          className={`w-8 h-8 rounded-lg ${colorClasses.button} ${
                            newHabit.color === color ? 'ring-2 ring-gray-400' : ''
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as any })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button onClick={createHabit} className="bg-purple-600 hover:bg-purple-700 flex-1">
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewHabitForm(false);
                    setEditingHabit(null);
                    setNewHabit({
                      name: '',
                      description: '',
                      category: 'wellness',
                      frequency: 'daily',
                      color: 'blue',
                      icon: '🎯',
                      reminder: { enabled: false, time: '09:00' }
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Habits;
