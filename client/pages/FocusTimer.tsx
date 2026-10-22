import { useState, useEffect } from "react";
import {
  Timer, Play, Pause, Square, Settings, BarChart3, Clock, Target, Zap, Coffee, BookOpen, Brain,
  ChevronDown, ChevronUp, Plus, X, Volume2, VolumeX, Bell, BellOff, RotateCcw, RefreshCw,
  Calendar, TrendingUp, Award, Flame, CheckCircle2, StickyNote, LogOut, Search, User, Heart,
  Sparkles, Mountain, Headphones, Dumbbell, Sun, Moon, Flower2, Waves, TreePine, Palette,
  Edit3, ArrowLeft, Home, Music, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { FocusDataService, FocusSession, FocusSettings, FocusStats } from "@/lib/focusData";
import { HabitDataService } from "@/lib/habitData";
import { addFocusNotification } from "@/lib/notificationStore";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";
import MobileHeader from "@/components/MobileHeader";

const FocusTimer = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Core state
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState<FocusSettings>(FocusDataService.getSettings());
  const [stats, setStats] = useState<FocusStats>(FocusDataService.getStats());
  
  // UI state
  const [currentView, setCurrentView] = useState<'timer' | 'stats' | 'settings'>('timer');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState(25);
  const [sessionTitle, setSessionTitle] = useState('');
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{id: string, title: string, type: 'task' | 'habit'} | null>(null);
  const [showSetupPanel, setShowSetupPanel] = useState(false);
  
  // Professional preset sessions with muted colors
  const focusPresets = [
    // Work & Productivity
    {
      id: 'pomodoro',
      name: 'Pomodoro Focus',
      duration: 25,
      icon: Timer,
      gradient: 'from-red-600 to-red-700',
      bgGradient: 'from-red-50 to-red-100',
      shadowColor: 'shadow-red-100',
      description: 'Classic 25min focus',
      category: 'Work',
      emoji: '🍅'
    },
    {
      id: 'deep-work',
      name: 'Deep Work',
      duration: 90,
      icon: Brain,
      gradient: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100',
      shadowColor: 'shadow-blue-100',
      description: 'Extended focus session',
      category: 'Work',
      emoji: '🧠'
    },
    {
      id: 'quick-task',
      name: 'Quick Burst',
      duration: 15,
      icon: Zap,
      gradient: 'from-orange-600 to-orange-700',
      bgGradient: 'from-orange-50 to-orange-100',
      shadowColor: 'shadow-orange-100',
      description: 'Fast 15min sprint',
      category: 'Work',
      emoji: '⚡'
    },
    {
      id: 'power-hour',
      name: 'Power Hour',
      duration: 60,
      icon: Target,
      gradient: 'from-indigo-600 to-indigo-700',
      bgGradient: 'from-indigo-50 to-indigo-100',
      shadowColor: 'shadow-indigo-100',
      description: 'Intense 1 hour focus',
      category: 'Work',
      emoji: '💪'
    },

    // Study & Learning
    {
      id: 'study-session',
      name: 'Study Time',
      duration: 45,
      icon: BookOpen,
      gradient: 'from-green-600 to-green-700',
      bgGradient: 'from-green-50 to-green-100',
      shadowColor: 'shadow-green-100',
      description: 'Learning & reviewing',
      category: 'Study',
      emoji: '📚'
    },
    {
      id: 'reading',
      name: 'Reading Zone',
      duration: 30,
      icon: BookOpen,
      gradient: 'from-amber-600 to-amber-700',
      bgGradient: 'from-amber-50 to-amber-100',
      shadowColor: 'shadow-amber-100',
      description: 'Focused reading time',
      category: 'Study',
      emoji: '📖'
    },

    // Wellness & Mindfulness
    {
      id: 'meditation',
      name: 'Meditation',
      duration: 10,
      icon: Heart,
      gradient: 'from-purple-600 to-purple-700',
      bgGradient: 'from-purple-50 to-purple-100',
      shadowColor: 'shadow-purple-100',
      description: 'Mindful meditation',
      category: 'Wellness',
      emoji: '🧘‍♀️'
    },
    {
      id: 'breathing',
      name: 'Breathing',
      duration: 5,
      icon: Waves,
      gradient: 'from-cyan-600 to-cyan-700',
      bgGradient: 'from-cyan-50 to-cyan-100',
      shadowColor: 'shadow-cyan-100',
      description: 'Deep breathing',
      category: 'Wellness',
      emoji: '🌊'
    },

    // Breaks & Rest
    {
      id: 'short-break',
      name: 'Mini Break',
      duration: 5,
      icon: Coffee,
      gradient: 'from-emerald-600 to-emerald-700',
      bgGradient: 'from-emerald-50 to-emerald-100',
      shadowColor: 'shadow-emerald-100',
      description: 'Quick 5min break',
      category: 'Break',
      emoji: '☕'
    },
    {
      id: 'long-break',
      name: 'Power Break',
      duration: 15,
      icon: Mountain,
      gradient: 'from-slate-600 to-slate-700',
      bgGradient: 'from-slate-50 to-slate-100',
      shadowColor: 'shadow-slate-100',
      description: 'Extended 15min rest',
      category: 'Break',
      emoji: '🏔️'
    },
    {
      id: 'walk-break',
      name: 'Walk Break',
      duration: 10,
      icon: Sun,
      gradient: 'from-yellow-600 to-yellow-700',
      bgGradient: 'from-yellow-50 to-yellow-100',
      shadowColor: 'shadow-yellow-100',
      description: 'Get moving outside',
      category: 'Break',
      emoji: '🚶‍♀️'
    },

    // Creative & Personal
    {
      id: 'creative-flow',
      name: 'Creative Flow',
      duration: 60,
      icon: Palette,
      gradient: 'from-pink-600 to-pink-700',
      bgGradient: 'from-pink-50 to-pink-100',
      shadowColor: 'shadow-pink-100',
      description: 'Creative & design work',
      category: 'Creative',
      emoji: '🎨'
    }
  ];

  const categories = ['All', 'Work', 'Study', 'Wellness', 'Break', 'Creative'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availableHabits, setAvailableHabits] = useState<{id: string, title: string, type: 'habit'}[]>([]);

  const filteredPresets = selectedCategory === 'All' 
    ? focusPresets 
    : focusPresets.filter(preset => preset.category === selectedCategory);

  // Load active session on mount
  useEffect(() => {
    // Check for task data from Tasks page
    const focusTaskData = sessionStorage.getItem('focusTaskData');
    if (focusTaskData) {
      try {
        const taskData = JSON.parse(focusTaskData);
        if (taskData.fromTasks && taskData.taskId && taskData.taskTitle) {
          setSelectedTask({
            id: taskData.taskId,
            title: taskData.taskTitle,
            type: 'task'
          });
          setSessionTitle(taskData.taskTitle);
          setCustomDuration(taskData.estimatedTime || 25);
          // Clear the data after using it
          sessionStorage.removeItem('focusTaskData');

          // Add task loaded notification to mobile store
          addFocusNotification(
            "🎯 Task Ready for Focus!",
            `Ready to focus on "${taskData.taskTitle}". Choose your session duration.`
          );
        }
      } catch (error) {
        console.warn('Error parsing focus task data:', error);
        sessionStorage.removeItem('focusTaskData');
      }
    }

    const saved = FocusDataService.getActiveSession();
    if (saved) {
      setActiveSession(saved);
      setTimeLeft(saved.remainingTime || saved.duration * 60);
      setIsRunning(!saved.paused);
      setSessionTitle(saved.customTitle || saved.taskTitle || saved.habitTitle || '');
      if (saved.taskId && saved.taskTitle) {
        setSelectedTask({ id: saved.taskId, title: saved.taskTitle, type: 'task' });
      } else if (saved.habitId && saved.habitTitle) {
        setSelectedTask({ id: saved.habitId, title: saved.habitTitle, type: 'habit' });
      }
    }
    setStats(FocusDataService.getStats());
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0 && activeSession) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Update active session with remaining time
          FocusDataService.updateSession(activeSession.id, { remainingTime: newTime });
          
          if (newTime <= 0) {
            handleSessionComplete();
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, activeSession]);

  // Load available habits from Firebase
  useEffect(() => {
    if (user?.uid) {
      HabitDataService.setUserId(user.uid);
      HabitDataService.getHabits()
        .then(habits => {
          setAvailableHabits(
            habits
              .filter(h => h.isActive)
              .map(h => ({ id: h.id, title: h.name, type: 'habit' as const }))
          );
        })
        .catch(error => console.error('Error loading habits:', error));
    }
  }, [user?.uid]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = (preset: any) => {
    const session = FocusDataService.createSession({
      duration: preset.duration,
      sessionType: preset.sessionType ||
                   (preset.id.includes('break') ? 'short-break' :
                    preset.id === 'pomodoro' ? 'pomodoro' : 'custom'),
      customTitle: preset.name,
      taskId: selectedTask?.type === 'task' ? selectedTask.id : undefined,
      taskTitle: selectedTask?.type === 'task' ? selectedTask.title : undefined,
      habitId: selectedTask?.type === 'habit' ? selectedTask.id : undefined,
      habitTitle: selectedTask?.type === 'habit' ? selectedTask.title : undefined,
    });

    setActiveSession(session);
    setTimeLeft(preset.duration * 60);
    setIsRunning(true);
    setSelectedPreset(preset.id || 'custom');
    setShowSetupPanel(false);

    // Add start notification to mobile store
    addFocusNotification(
      "🎯 Focus Session Started!",
      `${preset.duration} minute ${preset.name} session has begun. Stay focused!`
    );
  };

  const pauseSession = () => {
    if (activeSession) {
      setIsRunning(false);
      FocusDataService.pauseSession(activeSession.id);
      // No notification needed for pause - it's a user action
    }
  };

  const resumeSession = () => {
    if (activeSession) {
      setIsRunning(true);
      FocusDataService.resumeSession(activeSession.id);
      // No notification needed for resume - it's a user action
    }
  };

  const stopSession = () => {
    if (activeSession) {
      setIsRunning(false);
      FocusDataService.stopSession(activeSession.id);
      setActiveSession(null);
      setTimeLeft(0);
      setSelectedPreset(null);
      setShowSetupPanel(false);
      // Add stop notification to mobile store
      addFocusNotification(
        "⏹️ Focus Session Stopped",
        `Session ended without completion. No worries, you can start again anytime!`
      );
      refreshStats();
    }
  };

  const handleSessionComplete = () => {
    if (activeSession) {
      const completed = FocusDataService.completeSession(activeSession.id);
      setIsRunning(false);
      setActiveSession(null);
      setTimeLeft(0);
      setSelectedPreset(null);
      setShowSetupPanel(false);

      // If it was a habit session, mark habit as complete
      if (completed && completed.habitId) {
        const today = new Date().toISOString().split('T')[0];
        HabitDataService.markHabitComplete(completed.habitId, today, `Focused for ${completed.duration} minutes`)
          .catch(error => console.error('Error marking habit complete:', error));
      }

      // Add notification to mobile store
      addFocusNotification(
        "🎉 Focus Session Complete!",
        `Great job! You focused for ${activeSession.duration} minutes${activeSession.taskTitle ? ` on "${activeSession.taskTitle}"` : activeSession.habitTitle ? ` on "${activeSession.habitTitle}"` : ''}.`
      );

      refreshStats();
    }
  };

  const addInterruption = () => {
    if (activeSession) {
      FocusDataService.addInterruption(activeSession.id);
      // No notification needed for interruption - it's tracked internally
    }
  };

  const refreshStats = () => {
    setStats(FocusDataService.getStats());
  };

  const updateSettings = (newSettings: Partial<FocusSettings>) => {
    const updated = FocusDataService.updateSettings(newSettings);
    setSettings(updated);
    // No notification needed for settings - it's a user action
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

  // Get available tasks and habits
  const availableTasks = [
    { id: 'task-1', title: 'Finalize project proposal', type: 'task' as const },
    { id: 'task-2', title: 'Review analytics dashboard', type: 'task' as const },
    { id: 'task-3', title: 'Schedule team meeting', type: 'task' as const },
    { id: 'task-4', title: 'Write documentation', type: 'task' as const },
    { id: 'task-5', title: 'Plan quarterly goals', type: 'task' as const },
  ];

  // availableHabits is now loaded from Firebase in useEffect

  const allItems = [...availableTasks, ...availableHabits];

  const userName = user?.displayName || user?.email?.split('@')[0] || "Alex";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        <Sidebar currentPage="focus-timer" />

        {/* Main Content */}
        <div className="flex-1 ml-72 min-h-screen">
          {/* Desktop Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    <Timer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Focus Timer</h1>
                    <p className="text-sm text-gray-500">Choose your focus session and stay productive</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('timer')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'timer'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Timer
                </button>
                <button
                  onClick={() => setCurrentView('stats')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'stats'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Stats
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'settings'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {currentView === 'timer' && (
              <>
                {activeSession && !showSetupPanel ? (
                  // Active Session View
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                      {/* Task/Habit Display */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                          {(activeSession.taskTitle || activeSession.habitTitle) && (
                            <div className="flex items-center space-x-3">
                              {activeSession.taskTitle && (
                                <div className="flex items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200">
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Task: {activeSession.taskTitle}
                                </div>
                              )}
                              {activeSession.habitTitle && (
                                <div className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                                  <Target className="w-4 h-4 mr-2" />
                                  Habit: {activeSession.habitTitle}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => setShowSetupPanel(true)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Change
                        </Button>
                      </div>

                      <div className="text-center">
                        <div className="mb-8">
                          <div className="inline-flex items-center px-8 py-4 bg-blue-50 text-blue-700 rounded-lg text-xl font-bold mb-6 border border-blue-200">
                            {focusPresets.find(p => p.id === selectedPreset)?.emoji || '🎯'} {activeSession.customTitle || 'Focus Session'}
                          </div>
                        </div>

                        {/* Circular Progress Timer */}
                        <div className="relative w-80 h-80 mx-auto mb-10">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="#e5e7eb"
                              strokeWidth="2"
                              fill="none"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="url(#gradient)"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 45}`}
                              strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / (activeSession.duration * 60))}`}
                              className="transition-all duration-1000 ease-in-out"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="50%" stopColor="#1d4ed8" />
                                <stop offset="100%" stopColor="#1e40af" />
                              </linearGradient>
                            </defs>
                          </svg>
                          
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-6xl font-bold text-gray-900 mb-3">
                                {formatTime(timeLeft)}
                              </div>
                              <div className="text-lg text-gray-600">
                                {Math.round((timeLeft / (activeSession.duration * 60)) * 100)}% remaining
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-center space-x-6 mb-8">
                          {isRunning ? (
                            <Button
                              onClick={pauseSession}
                              size="lg"
                              className="bg-orange-600 hover:bg-orange-700 px-8 py-4 text-lg"
                            >
                              <Pause className="w-6 h-6 mr-3" />
                              Pause
                            </Button>
                          ) : (
                            <Button
                              onClick={resumeSession}
                              size="lg"
                              className="bg-green-600 hover:bg-green-700 px-8 py-4 text-lg"
                            >
                              <Play className="w-6 h-6 mr-3" />
                              Resume
                            </Button>
                          )}

                          <Button
                            onClick={stopSession}
                            variant="outline"
                            size="lg"
                            className="px-8 py-4 text-lg border-gray-300 hover:bg-gray-50"
                          >
                            <Square className="w-6 h-6 mr-3" />
                            Stop
                          </Button>

                          <Button
                            onClick={addInterruption}
                            variant="outline"
                            size="lg"
                            className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 px-8 py-4 text-lg"
                          >
                            <RotateCcw className="w-6 h-6 mr-3" />
                            Interruption
                          </Button>
                        </div>

                        {/* Session Info */}
                        <div className="grid grid-cols-3 gap-6">
                          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                            <div className="text-3xl font-bold text-blue-700">{activeSession.duration}m</div>
                            <div className="text-sm text-blue-600 font-medium">Duration</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                            <div className="text-3xl font-bold text-orange-700">{activeSession.interruptions}</div>
                            <div className="text-sm text-orange-600 font-medium">Interruptions</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                            <div className="text-3xl font-bold text-green-700">{stats.todaySessions}</div>
                            <div className="text-sm text-green-600 font-medium">Today's Sessions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Session Setup View (Always show when no active session OR when setup panel is open)
                  <div className="max-w-7xl mx-auto">
                    {activeSession && showSetupPanel && (
                      <div className="mb-6 text-center">
                        <Button
                          onClick={() => setShowSetupPanel(false)}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Timer
                        </Button>
                      </div>
                    )}

                    <div className="mb-8 text-center">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Choose Your Focus Session
                      </h2>
                      <p className="text-gray-600 text-lg">Select from our collection of focus sessions designed for peak productivity</p>
                    </div>

                    {/* Task/Habit Selector - Always Visible */}
                    <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200 max-w-4xl mx-auto">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">🎯 Link to Task or Habit (Optional)</h3>

                      {selectedTask ? (
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                                selectedTask.type === 'task'
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
                              }`}>
                                {selectedTask.type === 'task' ?
                                  <CheckCircle2 className="w-7 h-7 text-white" /> :
                                  <Target className="w-7 h-7 text-white" />
                                }
                              </div>
                              <div>
                                <div className="text-sm text-blue-600 font-semibold mb-1">
                                  {selectedTask.type === 'task' ? '📝 READY TO FOCUS ON TASK' : '🎯 READY TO BUILD HABIT'}
                                </div>
                                <div className="font-bold text-gray-900 text-xl">{selectedTask.title}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Click a session type below to start your focused work
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTask(null)}
                              className="hover:bg-white/50 border-gray-300"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>

                          {/* Quick Start Buttons */}
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => startSession({
                                id: 'custom-task',
                                duration: customDuration,
                                name: `${customDuration}min Task Focus`,
                                sessionType: 'custom'
                              })}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                            >
                              <Timer className="w-5 h-5 mr-2" />
                              Start {customDuration}min Focus
                            </Button>
                            <Button
                              onClick={() => startSession({
                                id: 'pomodoro',
                                duration: 25,
                                name: '25min Pomodoro',
                                sessionType: 'pomodoro'
                              })}
                              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                            >
                              <Timer className="w-5 h-5 mr-2" />
                              25min Pomodoro
                            </Button>
                            <Button
                              onClick={() => startSession({
                                id: 'deep-work',
                                duration: 90,
                                name: '90min Deep Work',
                                sessionType: 'deep-focus'
                              })}
                              className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg"
                            >
                              <Brain className="w-5 h-5 mr-2" />
                              90min Deep
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Button
                            onClick={() => setShowTaskSelector(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Select Task or Habit
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Task/Habit Selection Modal */}
                    {showTaskSelector && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-lg w-full max-h-96 overflow-y-auto shadow-lg border border-gray-200">
                          <div className="p-4 lg:p-6 pb-24 lg:pb-6">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-xl font-bold text-gray-900">
                                Select Task or Habit
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTaskSelector(false)}
                                className="hover:bg-gray-100"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {allItems.map((item) => (
                                <button
                                  key={`${item.type}-${item.id}`}
                                  onClick={() => {
                                    setSelectedTask(item);
                                    setShowTaskSelector(false);
                                  }}
                                  className="w-full text-left px-4 py-4 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                                      item.type === 'task' 
                                        ? 'bg-gradient-to-r from-orange-400 to-amber-400' 
                                        : 'bg-gradient-to-r from-green-400 to-emerald-400'
                                    }`}>
                                      {item.type === 'task' ? 
                                        <CheckCircle2 className="w-5 h-5 text-white" /> : 
                                        <Target className="w-5 h-5 text-white" />
                                      }
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">{item.title}</div>
                                      <div className="text-sm text-violet-600 capitalize font-medium">{item.type}</div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category Filter */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                        <div className="flex space-x-1">
                          {categories.map((category) => (
                            <button
                              key={category}
                              onClick={() => setSelectedCategory(category)}
                              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                                selectedCategory === category
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Colorful Preset Sessions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredPresets.map((preset) => {
                        const IconComponent = preset.icon;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => startSession(preset)}
                            className={`group relative p-6 ${preset.bgGradient} rounded-lg border ${preset.shadowColor.replace('shadow-', 'border-')} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1`}
                          >
                            <div className="text-center">
                              <div className={`w-16 h-16 bg-gradient-to-r ${preset.gradient} rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-105 transition-transform shadow-sm`}>
                                <span className="text-2xl">{preset.emoji}</span>
                              </div>
                              
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{preset.name}</h3>
                              <p className="text-sm text-gray-600 mb-3 font-medium">{preset.description}</p>
                              
                              <div className="flex items-center justify-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="font-bold text-gray-700">{preset.duration}m</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  preset.category === 'Work' ? 'bg-blue-200 text-blue-800' :
                                  preset.category === 'Study' ? 'bg-green-200 text-green-800' :
                                  preset.category === 'Wellness' ? 'bg-pink-200 text-pink-800' :
                                  preset.category === 'Break' ? 'bg-orange-200 text-orange-800' :
                                  preset.category === 'Creative' ? 'bg-purple-200 text-purple-800' :
                                  'bg-red-200 text-red-800'
                                }`}>
                                  {preset.category}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {currentView === 'stats' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 mb-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Focus Statistics</h2>
                    <Button variant="outline" onClick={refreshStats} className="border-violet-200 hover:bg-violet-50">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl border-2 border-blue-200 shadow-lg">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Timer className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-blue-700">{stats.totalSessions}</div>
                      <div className="text-sm text-blue-600 font-medium">Total Sessions</div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl border-2 border-green-200 shadow-lg">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-green-700">{Math.round(stats.totalFocusTime / 60)}h</div>
                      <div className="text-sm text-green-600 font-medium">Total Time</div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl border-2 border-orange-200 shadow-lg">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-orange-700">{stats.dailyStreak}</div>
                      <div className="text-sm text-orange-600 font-medium">Day Streak</div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl border-2 border-purple-200 shadow-lg">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-purple-700">{Math.round(stats.completionRate)}%</div>
                      <div className="text-sm text-purple-600 font-medium">Completion Rate</div>
                    </div>
                  </div>

                  {/* Weekly Progress Chart */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">This Week's Focus</h3>
                    <div className="grid grid-cols-7 gap-4">
                      {FocusDataService.getWeeklyData().map((day, index) => {
                        const progress = Math.min((day.completedSessions / day.goal) * 100, 100);
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const dayOfWeek = new Date(day.date).getDay();
                        
                        return (
                          <div key={day.date} className="text-center">
                            <div className="text-sm font-medium text-gray-600 mb-2">{dayNames[dayOfWeek]}</div>
                            <div className="w-full h-24 bg-gray-100 rounded-xl relative overflow-hidden shadow-lg">
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-500 to-pink-400 transition-all duration-500"
                                style={{ height: `${progress}%` }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-700">{day.completedSessions}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(day.date).getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'settings' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent mb-8">Focus Timer Settings</h2>
                  
                  <div className="space-y-8">
                    {/* Timer Durations */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timer Durations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pomodoro Length (minutes)
                          </label>
                          <input
                            type="number"
                            value={settings.pomodoroLength}
                            onChange={(e) => updateSettings({ pomodoroLength: parseInt(e.target.value) || 25 })}
                            min="10"
                            max="60"
                            className="w-full border-2 border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Short Break (minutes)
                          </label>
                          <input
                            type="number"
                            value={settings.shortBreakLength}
                            onChange={(e) => updateSettings({ shortBreakLength: parseInt(e.target.value) || 5 })}
                            min="3"
                            max="15"
                            className="w-full border-2 border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Long Break (minutes)
                          </label>
                          <input
                            type="number"
                            value={settings.longBreakLength}
                            onChange={(e) => updateSettings({ longBreakLength: parseInt(e.target.value) || 15 })}
                            min="10"
                            max="30"
                            className="w-full border-2 border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Daily Goal (sessions)
                          </label>
                          <input
                            type="number"
                            value={settings.dailyGoal}
                            onChange={(e) => updateSettings({ dailyGoal: parseInt(e.target.value) || 8 })}
                            min="1"
                            max="20"
                            className="w-full border-2 border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications & Audio</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border-2 border-violet-200 rounded-lg bg-gradient-to-r from-violet-50 to-pink-50">
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-violet-600" />
                            <div>
                              <div className="font-medium text-gray-900">Browser Notifications</div>
                              <div className="text-sm text-gray-500">Get notified when sessions end</div>
                            </div>
                          </div>
                          <Button
                            variant={settings.notificationsEnabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                            className={settings.notificationsEnabled ? 'bg-gradient-to-r from-violet-600 to-pink-600' : ''}
                          >
                            {settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border-2 border-violet-200 rounded-lg bg-gradient-to-r from-violet-50 to-pink-50">
                          <div className="flex items-center space-x-3">
                            <Volume2 className="w-5 h-5 text-violet-600" />
                            <div>
                              <div className="font-medium text-gray-900">Sound Effects</div>
                              <div className="text-sm text-gray-500">Play sounds for timer events</div>
                            </div>
                          </div>
                          <Button
                            variant={settings.soundEnabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                            className={settings.soundEnabled ? 'bg-gradient-to-r from-violet-600 to-pink-600' : ''}
                          >
                            {settings.soundEnabled ? 'Enabled' : 'Disabled'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 pb-6" style={{paddingTop: 'max(60px, env(safe-area-inset-top) + 20px)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg leading-tight">Focus Timer</h1>
                <p className="text-orange-100 text-sm">Stay focused & productive</p>
              </div>
            </div>
            {!activeSession && (
              <button
                onClick={() => setCurrentView('settings')}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="px-4 pb-6 bg-gradient-to-r from-orange-600 to-red-600">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-1">
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setCurrentView('timer')}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'timer'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Timer className="w-5 h-5 mx-auto mb-1" />
                Timer
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'stats'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                Stats
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'settings'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Settings className="w-5 h-5 mx-auto mb-1" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 pt-6 pb-48 space-y-6">
          {currentView === 'timer' && (
            <>
              {activeSession && !showSetupPanel ? (
                // Active Session Mobile View
                <div className="space-y-6">
                  {/* Task/Habit Display */}
                  {(activeSession.taskTitle || activeSession.habitTitle) && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      {activeSession.taskTitle && (
                        <div className="flex items-center px-4 py-3 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium border border-orange-200">
                          <CheckCircle2 className="w-5 h-5 mr-3" />
                          <span className="flex-1">Task: {activeSession.taskTitle}</span>
                        </div>
                      )}
                      {activeSession.habitTitle && (
                        <div className="flex items-center px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-200">
                          <Target className="w-5 h-5 mr-3" />
                          <span className="flex-1">Habit: {activeSession.habitTitle}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Session Title */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <div className="text-4xl mb-3">
                      {focusPresets.find(p => p.id === selectedPreset)?.emoji || '🎯'}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {activeSession.customTitle || 'Focus Session'}
                    </div>
                  </div>

                  {/* Mobile Timer Circle */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="relative w-64 h-64 mx-auto">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#mobileGradient)"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - timeLeft / (activeSession.duration * 60))}`}
                          className="transition-all duration-1000 ease-in-out"
                        />
                        <defs>
                          <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ea580c" />
                            <stop offset="50%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#b91c1c" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gray-900 mb-2">
                            {formatTime(timeLeft)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.round((timeLeft / (activeSession.duration * 60)) * 100)}% left
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Control Buttons */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {isRunning ? (
                        <button
                          onClick={pauseSession}
                          className="bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                        >
                          <Pause className="w-5 h-5" />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={resumeSession}
                          className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                        >
                          <Play className="w-5 h-5" />
                          <span>Resume</span>
                        </button>
                      )}
                      <button
                        onClick={stopSession}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                      >
                        <Square className="w-5 h-5" />
                        <span>Stop</span>
                      </button>
                    </div>
                    <button
                      onClick={addInterruption}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>Mark Interruption</span>
                    </button>
                  </div>

                  {/* Session Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                      <div className="text-xl font-bold text-blue-700">{activeSession.duration}m</div>
                      <div className="text-xs text-blue-600 font-medium">Duration</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
                      <div className="text-xl font-bold text-orange-700">{activeSession.interruptions}</div>
                      <div className="text-xs text-orange-600 font-medium">Interruptions</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                      <div className="text-xl font-bold text-green-700">{stats.todaySessions}</div>
                      <div className="text-xs text-green-600 font-medium">Today</div>
                    </div>
                  </div>

                  {/* Change Session Button */}
                  <button
                    onClick={() => setShowSetupPanel(true)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-gray-700 font-medium flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Change Session</span>
                  </button>
                </div>
              ) : (
                // Session Setup Mobile View
                <div className="space-y-6">
                  {activeSession && showSetupPanel && (
                    <button
                      onClick={() => setShowSetupPanel(false)}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Timer</span>
                    </button>
                  )}

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Focus Session</h2>
                    <p className="text-gray-600">Select a session type to start focusing</p>
                  </div>

                  {/* Task/Habit Selector */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">🎯 Link to Task or Habit</h3>
                    {selectedTask ? (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                              selectedTask.type === 'task'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}>
                              {selectedTask.type === 'task' ?
                                <CheckCircle2 className="w-5 h-5 text-white" /> :
                                <Target className="w-5 h-5 text-white" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-blue-600 font-semibold">
                                {selectedTask.type === 'task' ? '📝 TASK' : '🎯 HABIT'}
                              </div>
                              <div className="font-bold text-gray-900 truncate">{selectedTask.title}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedTask(null)}
                            className="w-8 h-8 bg-white/50 rounded-lg flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => startSession({
                              id: 'custom-task',
                              duration: customDuration,
                              name: `${customDuration}min Task Focus`,
                              sessionType: 'custom'
                            })}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-2 rounded-lg text-xs font-semibold"
                          >
                            {customDuration}min
                          </button>
                          <button
                            onClick={() => startSession({
                              id: 'pomodoro',
                              duration: 25,
                              name: '25min Pomodoro',
                              sessionType: 'pomodoro'
                            })}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-2 rounded-lg text-xs font-semibold"
                          >
                            25min
                          </button>
                          <button
                            onClick={() => startSession({
                              id: 'deep-work',
                              duration: 90,
                              name: '90min Deep Work',
                              sessionType: 'deep-focus'
                            })}
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2 px-2 rounded-lg text-xs font-semibold"
                          >
                            90min
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowTaskSelector(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Select Task or Habit</span>
                      </button>
                    )}
                  </div>

                  {/* Category Filter Mobile */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-medium text-gray-900 mb-3">Categories</div>
                    <div className="grid grid-cols-3 gap-2">
                      {categories.slice(0, 6).map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            selectedCategory === category
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Preset Sessions */}
                  <div className="space-y-3">
                    {filteredPresets.slice(0, 8).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => startSession(preset)}
                        className={`w-full p-4 ${preset.bgGradient} rounded-2xl border shadow-sm transition-all`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${preset.gradient} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <span className="text-xl">{preset.emoji}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-bold text-gray-900">{preset.name}</h3>
                            <p className="text-sm text-gray-600">{preset.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">{preset.duration}m</span>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                preset.category === 'Work' ? 'bg-blue-200 text-blue-800' :
                                preset.category === 'Study' ? 'bg-green-200 text-green-800' :
                                preset.category === 'Wellness' ? 'bg-pink-200 text-pink-800' :
                                preset.category === 'Break' ? 'bg-orange-200 text-orange-800' :
                                preset.category === 'Creative' ? 'bg-purple-200 text-purple-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {preset.category}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {currentView === 'stats' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Focus Statistics</h2>
                  <button
                    onClick={refreshStats}
                    className="p-2 bg-orange-100 text-orange-600 rounded-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{stats.totalSessions}</div>
                    <div className="text-xs text-blue-600 font-medium">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{Math.round(stats.totalFocusTime / 60)}h</div>
                    <div className="text-xs text-green-600 font-medium">Total Time</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">{stats.dailyStreak}</div>
                    <div className="text-xs text-orange-600 font-medium">Day Streak</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">{Math.round(stats.completionRate)}%</div>
                    <div className="text-xs text-purple-600 font-medium">Completion</div>
                  </div>
                </div>
              </div>

              {/* Weekly Progress Mobile */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Focus</h3>
                <div className="grid grid-cols-7 gap-2">
                  {FocusDataService.getWeeklyData().map((day, index) => {
                    const progress = Math.min((day.completedSessions / day.goal) * 100, 100);
                    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                    const dayOfWeek = new Date(day.date).getDay();

                    return (
                      <div key={day.date} className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-1">{dayNames[dayOfWeek]}</div>
                        <div className="w-full h-16 bg-gray-100 rounded-lg relative overflow-hidden">
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500 to-red-400 transition-all duration-500"
                            style={{ height: `${progress}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">{day.completedSessions}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(day.date).getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Timer Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pomodoro Length (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.pomodoroLength}
                      onChange={(e) => updateSettings({ pomodoroLength: parseInt(e.target.value) || 25 })}
                      min="10"
                      max="60"
                      className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Break (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.shortBreakLength}
                      onChange={(e) => updateSettings({ shortBreakLength: parseInt(e.target.value) || 5 })}
                      min="3"
                      max="15"
                      className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Long Break (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.longBreakLength}
                      onChange={(e) => updateSettings({ longBreakLength: parseInt(e.target.value) || 15 })}
                      min="10"
                      max="30"
                      className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Goal (sessions)
                    </label>
                    <input
                      type="number"
                      value={settings.dailyGoal}
                      onChange={(e) => updateSettings({ dailyGoal: parseInt(e.target.value) || 8 })}
                      min="1"
                      max="20"
                      className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications & Audio</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-gray-900">Notifications</div>
                        <div className="text-sm text-gray-500">Session alerts</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        settings.notificationsEnabled
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {settings.notificationsEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-gray-900">Sound Effects</div>
                        <div className="text-sm text-gray-500">Timer sounds</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        settings.soundEnabled
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {settings.soundEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* Task/Habit Selection Modal - Works for both desktop and mobile */}
      {showTaskSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-96 overflow-y-auto shadow-lg border border-gray-200">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Select Task or Habit
                </h3>
                <button
                  onClick={() => setShowTaskSelector(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {allItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      setSelectedTask(item);
                      setShowTaskSelector(false);
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                        item.type === 'task'
                          ? 'bg-gradient-to-r from-orange-400 to-amber-400'
                          : 'bg-gradient-to-r from-green-400 to-emerald-400'
                      }`}>
                        {item.type === 'task' ?
                          <CheckCircle2 className="w-5 h-5 text-white" /> :
                          <Target className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        <div className="text-sm text-orange-600 capitalize font-medium">{item.type}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusTimer;
