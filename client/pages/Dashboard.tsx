import { useState, useEffect } from "react";
import { CheckCircle2, Target, Brain, Timer, Settings, LogOut, User, Plus, Search, Bell, MoreHorizontal, RefreshCw, Lightbulb, BookOpen, Zap, Calendar, Clock, AlertCircle, Play, Pause, Square, StickyNote, Check, X, Coffee, ArrowRight, Home, Music, Video, Headphones, TrendingUp, Activity, BarChart3, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { notificationStore, type MobileNotification } from "@/lib/notificationStore";
import { OpenAIService, fallbackSuggestions } from "@/lib/openai";
import { MoodService, HabitService, FocusService, TaskService, type FocusSession, type Task } from "@/lib/dataServices";
import { HabitDataService, HabitEntry } from "@/lib/habitData";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";
import MobileHeader from "@/components/MobileHeader";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Notification state
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMood, setSelectedMood] = useState("😊");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [moodSummary, setMoodSummary] = useState<any>(null);
  const [weeklyMoodData, setWeeklyMoodData] = useState<any[]>([]);
  const [moodInsight, setMoodInsight] = useState<string>("");
  const [habitStats, setHabitStats] = useState<any>({
    activeHabits: 0,
    completedToday: 0,
    longestStreak: 0,
    totalHabits: 0,
    weeklyProgress: 0
  });
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [focusTimeLeft, setFocusTimeLeft] = useState(0);
  const [focusStats, setFocusStats] = useState<any>({
    todaySessions: 0,
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    longestSession: 0,
    dailyStreak: 0,
    weeklyMinutes: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<any>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    thisWeekTasks: 0,
    completionRate: 0,
    averageCompletionTime: 0
  });
  const [habits, setHabits] = useState<any[]>([]);

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

  // Calculate real tasks organized by status
  const tasksByStatus = {
    next: tasks.filter(task => task.status === 'next'),
    later: tasks.filter(task => task.status === 'later'),
    done: tasks.filter(task => task.status === 'done')
  };

  // Calculate today's tasks and pending tasks
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(task =>
    task.dueDate && task.dueDate.split('T')[0] === today
  );
  const pendingTasks = tasks.filter(task => task.status !== 'done');

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([
    {
      id: 1,
      message: "Generating smart suggestions for your productivity...",
      action: "Let's Do It",
      dismiss: "Skip",
      loading: true
    }
  ]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Generate AI suggestions and load mood data on component mount
  useEffect(() => {
    if (!user?.uid) {
      console.log('No user ID available, waiting for authentication');
      return;
    }

    // Load fallback suggestions immediately to ensure buttons are visible
    loadFallbackSuggestions();
    generateAISuggestions();
    refreshMoodData().catch(console.error);
    refreshFocusData().catch(console.error);

    // Load habit data from Firebase
    if (user?.uid) {
      HabitDataService.setUserId(user.uid);
      const loadHabitStats = async () => {
        try {
          const stats = await HabitDataService.getHabitStats();
          setHabitStats(stats);
          setFirebaseError(null);
        } catch (error) {
          console.error('Error loading habit stats:', error);
        }
      };
      loadHabitStats();
    }
  }, [user?.uid]);

  // Load fallback suggestions immediately
  const loadFallbackSuggestions = () => {
    const now = new Date();
    const hour = now.getHours();

    const fallbackSuggestions = [
      {
        id: 'fallback-1',
        message: hour < 12
          ? "Good morning! Start your day with a 25-minute focus session to build momentum."
          : hour < 17
          ? "Afternoon productivity boost! Try a focused work session."
          : "Evening reflection time. Review your progress and plan tomorrow.",
        action: hour < 17 ? "Start Focus" : "Review Day",
        dismiss: "Skip",
        loading: false,
        isAI: false
      },
      {
        id: 'fallback-2',
        message: "Take a moment to log your current mood and get personalized wellness suggestions.",
        action: "Track Mood",
        dismiss: "Later",
        loading: false,
        isAI: false
      }
    ];

    setAiSuggestions(fallbackSuggestions);
  };

  // Check for active focus session periodically
  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(async () => {
      try {
        const session = await FocusService.getActiveSession(user.uid);
        if (session) {
          setActiveSession(session);
          setFocusTimeLeft(session.remainingTime || 0);
        } else {
          setActiveSession(null);
          setFocusTimeLeft(0);
        }
        const stats = await FocusService.getStats(user.uid);
        setFocusStats(stats);
      } catch (error) {
        console.error('Error updating focus data:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.uid]);

  const refreshMoodData = async () => {
    if (!user?.uid) {
      console.log('Cannot refresh mood data: no user ID');
      return;
    }
    try {
      const summary = await MoodService.getTodaysMoodSummary(user.uid);
      const weeklyData = await MoodService.getWeeklyMoodData(user.uid);
      const insight = await MoodService.getMoodInsight(user.uid);
      setMoodSummary(summary);
      setWeeklyMoodData(weeklyData);
      setMoodInsight(insight);
      setFirebaseError(null);
    } catch (error) {
      console.error('Error refreshing mood data:', error);
      if (error.message?.includes('Network connection failed')) {
        setFirebaseError('Unable to connect to database. Using offline mode.');
      }
    }

    // Load habit stats from Firebase (same as Habits page)
    const loadHabitStats = async () => {
      try {
        const newHabitStats = await HabitDataService.getHabitStats();
        console.log('Dashboard: Loading habit stats:', newHabitStats);
        setHabitStats(newHabitStats);
      } catch (error) {
        console.error('Error loading habit stats:', error);
      }
    };
    loadHabitStats();

    // Refresh focus data
    refreshFocusData().catch(console.error);
  };

  const refreshFocusData = async () => {
    if (!user?.uid) {
      console.log('Cannot refresh focus data: no user ID');
      return;
    }
    try {
      const session = FocusService.getActiveSession(user.uid);
      setActiveSession(session);
      if (session) {
        setFocusTimeLeft(session.remainingTime || 0);
      }
      const stats = await FocusService.getStats(user.uid);
      setFocusStats(stats);
      setFirebaseError(null);
    } catch (error) {
      console.error('Error refreshing focus data:', error);
      if (error.message?.includes('Network connection failed')) {
        setFirebaseError('Unable to connect to database. Using offline mode.');
      }
    }
  };

  const startQuickFocusSession = async (duration: number, type: 'pomodoro' | 'break' | 'deep-focus', title: string) => {
    if (!user?.uid) {
      console.log('Cannot start focus session: no user ID');
      return;
    }
    try {
      const session = await FocusService.createSession({
        duration,
        sessionType: type,
        customTitle: title
      }, user.uid);

      setActiveSession(session);
      setFocusTimeLeft(duration * 60);

      toast({
        title: "Focus session started! 🎯",
        description: `${duration} minute ${title} session`,
      });
    } catch (error) {
      console.error('Error starting focus session:', error);
    }
  };

  const pauseFocusSession = async () => {
    if (activeSession && user?.uid) {
      try {
        await FocusService.pauseSession(activeSession.id, user.uid);
        toast({
          title: "Session paused",
          description: "Take your time, we'll wait!",
        });
      } catch (error) {
        console.error('Error pausing session:', error);
      }
    }
  };

  const resumeFocusSession = async () => {
    if (activeSession && user?.uid) {
      try {
        await FocusService.resumeSession(activeSession.id, user.uid);
        toast({
          title: "Session resumed",
          description: "Back to focus mode!",
        });
      } catch (error) {
        console.error('Error resuming session:', error);
      }
    }
  };

  const stopFocusSession = async () => {
    if (activeSession && user?.uid) {
      try {
        await FocusService.stopSession(activeSession.id, user.uid);
        setActiveSession(null);
        setFocusTimeLeft(0);
        toast({
          title: "Session stopped",
          description: "Session ended without completion",
        });
        refreshFocusData().catch(console.error);
      } catch (error) {
        console.error('Error stopping session:', error);
      }
    }
  };

  const formatFocusTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveMoodFromDashboard = async (moodEmoji: string) => {
    // Map emoji to mood name (comprehensive mapping)
    const emojiToMood: { [key: string]: string } = {
      "��": "happy",
      "😐": "neutral",
      "🤔": "focused",
      "😴": "tired",
      "🥳": "excited",
      "😌": "content",
      "⚡": "energetic",
      "🎯": "focused",
      "🧘": "calm",
      "🙏": "grateful",
      "😰": "anxious",
      "���": "sad",
      "⚪": "neutral",
      // Additional common emojis that might appear
      "🤩": "excited",
      "😍": "happy",
      "😎": "content",
      "😑": "neutral",
      "😪": "tired",
      "🤗": "grateful",
      "😔": "sad"
    };

    const moodName = emojiToMood[moodEmoji] || "neutral";

    if (!user?.uid) {
      console.log('Cannot save mood: no user ID');
      return;
    }

    try {
      // Create and save new mood entry
      const newEntry = await MoodService.addMoodEntry({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        mood: moodName,
        intensity: 5, // Default intensity
        triggers: [], // No triggers from dashboard
        note: "Logged from dashboard",
        activities: []
      }, user.uid);
    } catch (error) {
      console.error('Error saving mood entry:', error);
      return;
    }

    // Update local state
    setSelectedMood(moodEmoji);
    refreshMoodData().catch(console.error);

    // Show confirmation
    toast({
      title: "Mood logged! 😊",
      description: `Your ${moodName} mood has been saved.`,
    });
  };

  // Handle suggestion actions
  const handleSuggestionAction = (suggestion: any) => {
    console.log("Suggestion action clicked:", suggestion);
    const action = suggestion.action.toLowerCase();
    const content = suggestion.message.toLowerCase();

    switch (action) {
      case "start focus":
      case "start focus session":
        navigate('/focus-timer');
        toast({
          title: "Focus Time! 🎯",
          description: "Starting a focused work session",
        });
        break;

      case "track mood":
      case "log mood":
        navigate('/mood-tracker');
        toast({
          title: "Mood Check! 😊",
          description: "Let's track how you're feeling today",
        });
        break;

      case "review day":
      case "review progress":
        navigate('/tasks');
        toast({
          title: "Progress Review! 📊",
          description: "Reviewing your accomplishments and planning ahead",
        });
        break;

      case "complete habits":
        navigate('/habits');
        toast({
          title: "Habit Time! ����",
          description: "Let's complete your remaining habits",
        });
        break;

      case "take action":
        if (content.includes("breathing")) {
          toast({
            title: "Breathing Exercise 🧘",
            description: "Take 5 deep breaths: inhale for 4, hold for 4, exhale for 6",
          });
        } else if (content.includes("energy")) {
          toast({
            title: "Energy Boost! ⚡",
            description: "Try 2 minutes of stretching or a quick walk",
          });
        } else if (content.includes("positive energy")) {
          navigate('/tasks');
          toast({
            title: "Channeling Positive Energy! ⚡",
            description: "Let's tackle your most important task!",
          });
        } else {
          toast({
            title: "Taking Action! 🚀",
            description: "Great choice! You're taking control of your day",
          });
        }
        break;

      case "celebrate":
        toast({
          title: "🎉 Celebration Time! 🎉",
          description: "Amazing work completing all your habits today!",
        });
        break;

      default:
        // Handle legacy actions and fallbacks
        if (action.includes("let's do it") || action.includes("try this")) {
          if (content.includes("focus") || content.includes("pomodoro")) {
            navigate('/focus-timer');
            toast({
              title: "Focus Time! 🎯",
              description: "Opening Focus Timer to boost your productivity",
            });
          } else if (content.includes("habit") || content.includes("routine")) {
            navigate('/habits');
            toast({
              title: "Building Habits! 💪",
              description: "Let's work on your daily habits",
            });
          } else if (content.includes("task") || content.includes("productive")) {
            navigate('/tasks');
            toast({
              title: "Task Time! ✅",
              description: "Opening your task list to get things done",
            });
          } else {
            toast({
              title: "Great Choice! ✨",
              description: "Taking action on your suggestion",
            });
          }
        } else if (action.includes("keep going")) {
          toast({
            title: "You've Got This! 🚀",
            description: "Keep up the excellent work!",
          });
        } else {
          toast({
            title: "Action Taken! 👍",
            description: "Following through on your suggestion",
          });
        }
    }
  };

  // Dismiss suggestion
  const dismissSuggestion = (suggestionId: number) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast({
      title: "Suggestion Dismissed",
      description: "We'll keep learning your preferences",
    });
  };

  const generateAISuggestions = async () => {
    console.log("Generating AI suggestions...");
    setAiError(null);

    // Set loading state
    setAiSuggestions([
      {
        id: 1,
        message: "Generating personalized suggestions...",
        action: "Let's Do It",
        dismiss: "Skip",
        loading: true
      }
    ]);

    try {
      // Flatten tasksByStatus to get all tasks
      const allTasks = [
        ...tasksByStatus.next,
        ...tasksByStatus.later,
        ...tasksByStatus.done.map(task => ({ ...task, status: "Done" }))
      ];

      // Get user context from current state (with safe Firebase calls)
      let habitsData = [];
      try {
        if (user?.uid) {
          habitsData = await HabitService.getHabits(user.uid);
        }
      } catch (error) {
        console.warn('Could not load habits for AI suggestions, using fallback');
        habitsData = [];
      }

      const userContext = {
        recentTasks: allTasks.slice(0, 2).map(t => t.title),
        habits: habitsData.filter(h => h.isActive).map(h => h.name),
        moodEntries: [moodInsight]
      };

      // Generate multiple suggestions with better error handling
      const suggestionPromises = [
        OpenAIService.generateDashboardSuggestion(userContext).catch(error => ({
          content: '',
          error: 'Dashboard suggestion unavailable'
        })),
        OpenAIService.generateTaskSuggestion({
          completedTasks: tasksByStatus.done.map(t => t.title),
          pendingTasks: [...tasksByStatus.next, ...tasksByStatus.later].map(t => t.title),
          timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"
        }).catch(error => ({
          content: '',
          error: 'Task suggestion unavailable'
        }))
      ];

      // Use Promise.allSettled for better error resilience
      const suggestionResults = await Promise.allSettled(suggestionPromises);

      const suggestions = suggestionResults.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            content: '',
            error: 'Service temporarily unavailable'
          };
        }
      });

      // Use fallback suggestions if AI fails
      const newSuggestions = suggestions.map((suggestion, index) => ({
        id: index + 1,
        message: suggestion.error
          ? fallbackSuggestions.dashboard[index] || "Keep up the great work on your productivity journey!"
          : suggestion.content,
        action: index === 0 ? "Let's Do It" : "Try This",
        dismiss: "Skip",
        loading: false,
        isAI: !suggestion.error
      }));

      setAiSuggestions(newSuggestions);

      // Show info message if using fallback
      if (suggestions.every(s => s.error)) {
        setAiError("Using offline suggestions - AI features will be available when connected to the internet");
      }

    } catch (error) {
      console.log('AI suggestions unavailable, using smart fallbacks');
      setAiError("AI suggestions are temporarily unavailable. Using curated suggestions instead.");

      // Enhanced contextual suggestions with smart analysis
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const contextualSuggestions = [
        {
          id: 1,
          message: hour < 12
            ? `Good morning! You have ${tasksByStatus.next.length} tasks today. Start with a focused 25-minute work session to build momentum.`
            : hour < 17
            ? `Afternoon energy boost! ${focusStats?.todaySessions < 2 ? 'Try a focus session to increase your productivity.' : 'You\'re doing great! Consider a short break.'}`
            : `Evening reflection time. Review your ${tasksByStatus.done.length} completed tasks and plan tomorrow.`,
          action: hour < 17 ? "Start Focus Session" : "Review Progress",
          dismiss: "Skip",
          loading: false,
          isAI: false
        },
        {
          id: 2,
          message: habitStats?.activeHabits > 0
            ? habitStats.completedToday >= habitStats.activeHabits
              ? `Amazing! You've completed all ${habitStats.completedToday} habits today! 🎉 ${isWeekend ? 'Enjoy your weekend!' : 'Keep building that momentum tomorrow.'}`
              : `You've completed ${habitStats.completedToday}/${habitStats.activeHabits} habits today. ${habitStats.activeHabits - habitStats.completedToday} more to go!`
            : "Start building powerful daily habits to transform your routine. Even 5 minutes makes a difference!",
          action: habitStats?.completedToday >= habitStats?.activeHabits ? "Celebrate" : "Complete Habits",
          dismiss: "Later",
          loading: false,
          isAI: false
        }
      ];

      setAiSuggestions(contextualSuggestions);
    }
  };

  // Process habits data for display using Firebase data structure
  const processHabitsForDisplay = (habitsData: any[], habitEntries: HabitEntry[] = []) => {
    // Get today's habit entries to check completion status
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = habitEntries.filter(entry =>
      entry.date === today && entry.completed
    );

    return habitsData
      .filter(h => h.isActive)
      .slice(0, 2) // Show max 2 habits in sidebar
      .map(habit => {
        // Check if this habit is completed today
        const isCompletedToday = todayEntries.some(entry => entry.habitId === habit.id);

        return {
          id: habit.id,
          title: habit.name,
          progress: isCompletedToday ? 1 : 0,
          total: 1,
          status: isCompletedToday ? "Done" : "Pending",
          color: habit.color
        };
      });
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || "Alex";

  // Subscribe to notifications
  useEffect(() => {
    const updateNotifications = (notifications: MobileNotification[]) => {
      setNotifications(notifications);
      setUnreadCount(notificationStore.getUnreadCount());
    };

    // Initial load
    updateNotifications(notificationStore.getAll());

    // Subscribe to changes
    const unsubscribe = notificationStore.subscribe(updateNotifications);
    return unsubscribe;
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      setIsLoading(true);

      // Load data using unified services with individual error handling
      const userId = user.uid;

      // Load mood data with error handling
      let moodSummaryData, weeklyMoodInfo, moodInsightData;
      try {
        moodSummaryData = await MoodService.getTodaysMoodSummary(userId);
        weeklyMoodInfo = await MoodService.getWeeklyMoodData(userId);
        moodInsightData = await MoodService.getMoodInsight(userId);
      } catch (error) {
        console.warn('Failed to load mood data:', error);
        moodSummaryData = { latestMood: '', moodEmoji: '😐', entryCount: 0, averageIntensity: 0, dominantMood: '' };
        weeklyMoodInfo = [];
        moodInsightData = '';
      }

      // Load habit data from Firebase
      let habitsData, habitStatsData, habitEntriesData;
      try {
        habitsData = await HabitDataService.getHabits();
        habitStatsData = await HabitDataService.getHabitStats();
        habitEntriesData = await HabitDataService.getHabitEntries();
      } catch (error) {
        console.warn('Failed to load habit data:', error);
        habitsData = [];
        habitStatsData = { activeHabits: 0, completedToday: 0, longestStreak: 0, totalHabits: 0, weeklyProgress: 0 };
        habitEntriesData = [];
      }

      // Load focus data with error handling
      let focusStatsData, activeFocusSession;
      try {
        focusStatsData = await FocusService.getStats(userId);
        activeFocusSession = await FocusService.getActiveSession(userId);
      } catch (error) {
        console.warn('Failed to load focus data:', error);
        focusStatsData = { todaySessions: 0, totalSessions: 0, totalMinutes: 0, averageSessionLength: 0, longestSession: 0, dailyStreak: 0, weeklyMinutes: 0, completionRate: 0 };
        activeFocusSession = null;
      }

      // Load task data with error handling
      let tasksData, taskStatsData;
      try {
        tasksData = await TaskService.getTasks(userId);
        taskStatsData = await TaskService.getTaskStats(userId);
      } catch (error) {
        console.warn('Failed to load task data:', error);
        tasksData = [];
        taskStatsData = { totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0, todayTasks: 0, thisWeekTasks: 0, completionRate: 0, averageCompletionTime: 0 };
      }

      // Update state
      try {
        setMoodSummary(moodSummaryData);
        setWeeklyMoodData(weeklyMoodInfo);
        setMoodInsight(moodInsightData);
        setHabitStats(habitStatsData);
        setHabits(processHabitsForDisplay(habitsData, habitEntriesData));
        setFocusStats(focusStatsData);
        setActiveSession(activeFocusSession);
        setTasks(tasksData);
        setTaskStats(taskStatsData);

        // Set current mood if available
        if (moodSummaryData?.latestMood) {
          setSelectedMood(moodSummaryData.moodEmoji || "😊");
        }

        // Set streak from habit stats
        if (habitStatsData?.longestStreak) {
          setCurrentStreak(habitStatsData.longestStreak);
        }

        console.log('Dashboard data loaded successfully');
      } catch (error) {
        console.warn('Error updating dashboard state:', error);
      }

      setIsLoading(false);
    };

    loadDashboardData();
  }, [user, toast]);

  return (
    <>
      <Helmet>
        <title>Dashboard — Trifocus</title>
        <meta name="description" content="Your productivity dashboard: overview of tasks, habits, mood insights, and focus sessions." />
      </Helmet>
      {/* Desktop Layout */}
      <div className="desktop-only hidden lg:block min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <Sidebar currentPage="dashboard" />

          {/* Desktop Main Content */}
          <div className="flex-1 ml-72">
            {/* Desktop Header */}
            <MobileHeader
              title={`${getGreeting()}, ${userName}!`}
              subtitle={getCurrentDate()}
              icon={<Home className="w-6 h-6 text-white" />}
              gradient="from-blue-500 to-purple-600"
              actions={
                <button
                  onClick={() => navigate('/tasks')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  New Task
                </button>
              }
            />

            <div className="p-6 pb-6">
              {/* Firebase Error Banner */}
              {firebaseError && (
                <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{firebaseError}</span>
                  </div>
                  <button
                    onClick={() => setFirebaseError(null)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 mb-8 shadow-lg">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {getGreeting()}, {userName}!
                    </h2>
                    <p className="text-blue-100 text-base">
                      You have {pendingTasks.length} tasks and {habitStats?.activeHabits || 0} habits for today
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-6 h-6 text-orange-400" />
                      <span className="text-3xl font-bold text-white">{habitStats?.longestStreak || currentStreak}</span>
                    </div>
                    <p className="text-sm text-blue-200 mt-1">day streak</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="col-span-2 space-y-8">
                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="h-24 flex-col text-base p-4 border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                        onClick={() => navigate('/focus-timer')}
                      >
                        <Timer className="w-8 h-8 mb-2 text-blue-600" />
                        <span className="font-medium">Focus</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-24 flex-col text-base p-4 border-2 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                        onClick={() => navigate('/tasks')}
                      >
                        <CheckCircle2 className="w-8 h-8 mb-2 text-green-600" />
                        <span className="font-medium">Tasks</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-24 flex-col text-base p-4 border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                        onClick={() => navigate('/habits')}
                      >
                        <Target className="w-8 h-8 mb-2 text-purple-600" />
                        <span className="font-medium">Habits</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-24 flex-col text-base p-4 border-2 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200"
                        onClick={() => navigate('/mood-tracker')}
                      >
                        <span className="text-3xl mb-1">😊</span>
                        <span className="font-medium">Mood</span>
                      </Button>
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Recent Tasks</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/tasks')}
                        className="text-sm px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        View All
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    {pendingTasks.length > 0 ? (
                      <div className="space-y-4">
                        {pendingTasks.slice(0, 2).map((task) => (
                          <div key={task.id} className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/tasks')}>
                            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-base truncate">{task.title}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {task.priority} Priority • {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No pending tasks! 🎉</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Overview */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Today's Progress</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-3 rounded-lg bg-blue-50">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{focusStats?.todaySessions || 0}</div>
                        <div className="text-sm font-medium text-gray-600">Focus Sessions</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <div className="text-3xl font-bold text-green-600 mb-1">{tasksByStatus.done.length}</div>
                        <div className="text-sm font-medium text-gray-600">Tasks Done</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-purple-50">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{habitStats?.completedToday || 0}</div>
                        <div className="text-sm font-medium text-gray-600">Habits Done</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Focus Timer */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Focus Timer</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/focus-timer')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {activeSession ? (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {formatFocusTime(focusTimeLeft)}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {activeSession.customTitle || 'Focus Session'}
                        </p>
                        <div className="flex space-x-2 justify-center">
                          {activeSession.paused ? (
                            <Button size="sm" onClick={resumeFocusSession}>
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={pauseFocusSession}>
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={stopFocusSession}>
                            <Square className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          className="w-full"
                          onClick={() => startQuickFocusSession(25, 'pomodoro', 'Pomodoro')}
                        >
                          25m Pomodoro
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => startQuickFocusSession(5, 'break', 'Short Break')}
                        >
                          5m Break
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Mood Check */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">How are you feeling?</h3>
                    <div className="grid grid-cols-4 gap-3 mb-6">
  {['😊', '😐', '😴', '🤔', '😰', '😢', '🥳', '😌'].map((emoji) => (
    <button
      key={emoji}
      onClick={() => saveMoodFromDashboard(emoji).catch(console.error)}
      className="w-full h-14 text-3xl rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 active:scale-95"
    >
      {emoji}
    </button>
  ))}
</div>

                    <Button 
                      variant="outline" 
                      className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50 transition-colors"
                      onClick={() => navigate('/mood-tracker')}
                    >
                      Detailed Tracking
                    </Button>
                  </div>

                  {/* Daily Habits */}
                  {habits.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Daily Habits</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/habits')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {habits.slice(0, 2).map((habit) => (
                          <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <span className="text-base font-semibold text-gray-900 truncate flex-1 pr-3">{habit.title}</span>
                            <span className="text-sm font-medium text-gray-600 flex-shrink-0">{habit.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App Layout */}
      <div className="mobile-only block lg:hidden min-h-screen min-h-[100dvh] bg-gray-50">

        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 pb-6" style={{paddingTop: 'max(60px, env(safe-area-inset-top) + 20px)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg leading-tight">{getGreeting()}!</h1>
                <p className="text-blue-100 text-sm">{getCurrentDate()}</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Streak Card */}
        <div className="px-4 pb-6 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{habitStats?.longestStreak || currentStreak}</div>
                  <div className="text-blue-100 text-sm">Day Streak</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white text-sm">Today: {habitStats?.completedToday || 0}/{habitStats?.activeHabits || 0}</div>
                <div className="text-blue-100 text-xs">Habits done</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 pt-6 pb-28 space-y-6">
          {/* Firebase Error Banner */}
          {firebaseError && (
            <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">{firebaseError}</span>
              </div>
              <button
                onClick={() => setFirebaseError(null)}
                className="text-orange-600 hover:text-orange-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-center shadow-lg">
              <Timer className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{focusStats?.todaySessions || 0}</div>
              <div className="text-blue-100 text-xs">Focus</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{tasksByStatus.done.length}</div>
              <div className="text-green-100 text-xs">Tasks</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-center shadow-lg">
              <Target className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{habitStats?.completedToday || 0}</div>
              <div className="text-purple-100 text-xs">Habits</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/focus-timer')}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center hover:from-blue-100 hover:to-blue-200 transition-all active:scale-95"
              >
                <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Start Focus</div>
                <div className="text-xs text-gray-600">25 min session</div>
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center hover:from-green-100 hover:to-green-200 transition-all active:scale-95"
              >
                <Plus className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Add Task</div>
                <div className="text-xs text-gray-600">Create new</div>
              </button>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Tasks</h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-blue-600 text-sm font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View all
              </button>
            </div>

            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.slice(0, 2).map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => navigate('/tasks')}>
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                      <div className="text-xs text-gray-500">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending tasks! 🎉</p>
              </div>
            )}
          </div>

          {/* Mood Check */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How are you feeling?</h3>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {['😊', '😢', '😴', '🤔'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => saveMoodFromDashboard(emoji).catch(console.error)}
                  className="w-full h-12 text-xl rounded-xl border-2 border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 transition-all active:scale-95 touch-manipulation"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/mood-tracker')}
              className="w-full py-3 text-blue-600 font-medium text-sm mt-2"
            >
              More options →
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* Mobile Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        notificationStore.markAllAsRead();
                      }}
                      className="text-sm text-blue-600 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto max-h-96">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">Focus session alerts will appear here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => notificationStore.markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notification.type === 'focus' ? 'bg-orange-100' :
                          notification.type === 'habit' ? 'bg-green-100' :
                          notification.type === 'task' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          {notification.type === 'focus' ? (
                            <Timer className="w-4 h-4 text-orange-600" />
                          ) : notification.type === 'habit' ? (
                            <Target className="w-4 h-4 text-green-600" />
                          ) : notification.type === 'task' ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Bell className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">{notification.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    notificationStore.clear();
                    setShowNotifications(false);
                  }}
                  className="w-full py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
