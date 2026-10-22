// Firebase-only data services - no localStorage fallbacks
import { db } from "./firebase";

// Firebase Services Only
import { TaskDataServiceFirebase as FirebaseTaskService } from "./taskDataFirebase";
import { HabitDataServiceFirebase as FirebaseHabitService } from "./habitDataFirebase";
import { MoodDataServiceFirebase as FirebaseMoodService } from "./moodDataFirebase";
import { FocusDataServiceFirebase as FirebaseFocusService } from "./focusDataFirebase";

// Helper to ensure Firebase is available
const ensureFirebase = () => {
  if (!db) {
    throw new Error('Firebase is not configured. Using demo mode with sample data.');
  }
};

// Helper to handle Firebase network errors
const handleFirebaseError = (error: any, operation: string) => {
  console.warn(`Firebase ${operation} failed:`, error);

  // For network errors, don't throw - just log and continue with fallback
  if (error.code === 'unavailable' ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Failed to construct') ||
      error.message?.includes('network-request-failed') ||
      error.code === 'network-request-failed' ||
      error.name === 'TypeError') {
    console.warn(`Network issue during ${operation}, continuing with fallback data`);
    return null; // Return null instead of throwing
  }

  // For authentication or permission errors, also use fallback
  if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
    console.warn(`Authentication issue during ${operation}, using fallback data`);
    return null;
  }

  // For other errors, log but don't crash
  console.warn(`Firebase ${operation} error handled gracefully:`, error);
  return null;
};

// Demo data to use when Firebase is not available - exactly 2 tasks
const createDemoTasks = () => [
  {
    id: "demo-1",
    title: "Review project proposal",
    description: "Review and finalize the project proposal for client presentation",
    priority: "high" as const,
    status: "next" as const,
    category: "Work",
    tags: ["important", "deadline"],
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow (This Week)
    estimatedTime: 60,
    isStarred: false,
    subtasks: [],
    createdAt: new Date().toISOString(),
    userId: "demo-user"
  },
  {
    id: "demo-2",
    title: "Plan weekend activities",
    description: "Organize activities for the upcoming weekend",
    priority: "medium" as const,
    status: "later" as const,
    category: "Personal",
    tags: ["weekend", "planning"],
    dueDate: new Date(Date.now() + (7 * 86400000)).toISOString(), // Next week
    estimatedTime: 30,
    isStarred: false,
    subtasks: [],
    createdAt: new Date().toISOString(),
    userId: "demo-user"
  }
];

const createDemoCategories = () => [
  { id: '1', name: 'Work', icon: '💼', color: 'blue' },
  { id: '2', name: 'Personal', icon: '🏠', color: 'green' },
  { id: '3', name: 'Health', icon: '💪', color: 'emerald' },
  { id: '4', name: 'Learning', icon: '📚', color: 'purple' },
  { id: '5', name: 'Creative', icon: '🎨', color: 'pink' },
  { id: '6', name: 'Finance', icon: '💰', color: 'orange' }
];

// Task Service with Firebase fallback to demo data
export const TaskService = {
  getTasks: async (userId: string) => {
    if (!db || !FirebaseTaskService) {
      console.log('Demo mode: No tasks (Firebase not configured)');
      return createDemoTasks();
    }
    try {
      return await FirebaseTaskService.getTasks(userId);
    } catch (error) {
      const handled = handleFirebaseError(error, 'getTasks');
      if (handled === null) {
        // Network error - use fallback
        console.log('Using demo tasks due to network issue');
        return createDemoTasks();
      }
      throw error;
    }
  },

  createTask: async (task: any, userId: string) => {
    if (!db || !FirebaseTaskService) {
      console.log('Demo mode: Cannot create tasks (Firebase not configured)');
      // Return a fake task for demo purposes
      return {
        id: `demo-${Date.now()}`,
        ...task,
        createdAt: new Date().toISOString(),
        userId
      };
    }
    try {
      return await FirebaseTaskService.createTask(userId, task);
    } catch (error) {
      handleFirebaseError(error, 'createTask');
      return null;
    }
  },

  updateTask: async (taskId: string, updates: any, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot update tasks (Firebase not configured)');
      // Return fake updated task for demo purposes
      return {
        id: taskId,
        ...updates,
        userId
      };
    }
    try {
      return await FirebaseTaskService.updateTask(userId, taskId, updates);
    } catch (error) {
      handleFirebaseError(error, 'updateTask');
      return null;
    }
  },

  deleteTask: async (taskId: string, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot delete tasks (Firebase not configured)');
      return true; // Pretend deletion succeeded
    }
    try {
      return await FirebaseTaskService.deleteTask(userId, taskId);
    } catch (error) {
      handleFirebaseError(error, 'deleteTask');
      return false;
    }
  },

  getTaskStats: async (userId: string) => {
    if (!db) {
      console.log('Using demo task stats (Firebase not configured)');
      return {
        totalTasks: 2,        // 2 demo tasks
        completedTasks: 0,    // None completed
        pendingTasks: 2,      // Both pending
        overdueTasks: 0,      // None overdue
        todayTasks: 0,        // None due today
        thisWeekTasks: 1,     // 1 due this week (tomorrow)
        completionRate: 0,    // 0% completed
        averageCompletionTime: 0
      };
    }
    try {
      return await FirebaseTaskService.getTaskStats(userId);
    } catch (error) {
      console.warn('Firebase getTaskStats failed, using demo data:', error);
      return {
        totalTasks: 2,
        completedTasks: 0,
        pendingTasks: 2,
        overdueTasks: 0,
        todayTasks: 0,
        thisWeekTasks: 1,
        completionRate: 0,
        averageCompletionTime: 0
      };
    }
  },

  getCategories: async (userId: string) => {
    if (!db) {
      console.log('Using demo categories (Firebase not configured)');
      return createDemoCategories();
    }
    try {
      return await FirebaseTaskService.getCategories(userId);
    } catch (error) {
      console.warn('Firebase getCategories failed, using demo data:', error);
      return createDemoCategories();
    }
  },

  subscribeToTasks: (userId: string, callback: (tasks: any[]) => void) => {
    if (!db) {
      console.log('Demo mode: No real-time updates (Firebase not configured)');
      // Return a fake unsubscribe function
      return () => {};
    }
    try {
      return FirebaseTaskService.subscribeToTasks(userId, callback);
    } catch (error) {
      console.warn('Firebase subscribeToTasks failed:', error);
      return () => {};
    }
  }
};

// Habit Service with robust error handling
export const HabitService = {
  getHabits: async (userId: string) => {
    if (!db) {
      console.log('Demo mode: No Firebase habits (Firebase not configured)');
      return [];
    }
    try {
      return await FirebaseHabitService.getHabits(userId);
    } catch (error) {
      console.warn('Firebase getHabits failed:', error);
      return [];
    }
  },

  createHabit: async (habit: any, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot create Firebase habits (Firebase not configured)');
      return { id: `demo-${Date.now()}`, ...habit, userId };
    }
    try {
      return await FirebaseHabitService.createHabit(userId, habit);
    } catch (error) {
      console.warn('Firebase createHabit failed:', error);
      return null;
    }
  },

  updateHabit: async (habitId: string, updates: any, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot update Firebase habits (Firebase not configured)');
      return { id: habitId, ...updates, userId };
    }
    try {
      return await FirebaseHabitService.updateHabit(userId, habitId, updates);
    } catch (error) {
      console.warn('Firebase updateHabit failed:', error);
      return null;
    }
  },

  deleteHabit: async (habitId: string, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot delete Firebase habits (Firebase not configured)');
      return true;
    }
    try {
      return await FirebaseHabitService.deleteHabit(userId, habitId);
    } catch (error) {
      console.warn('Firebase deleteHabit failed:', error);
      return false;
    }
  },

  markHabitComplete: async (habitId: string, date: string, notes: string | undefined, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot mark Firebase habits complete (Firebase not configured)');
      return true;
    }
    try {
      return await FirebaseHabitService.markHabitComplete(userId, habitId, date, 1, notes);
    } catch (error) {
      console.warn('Firebase markHabitComplete failed:', error);
      return false;
    }
  },

  getHabitStats: async (userId: string) => {
    if (!db) {
      console.log('Using demo habit stats (Firebase not configured)');
      return {
        activeHabits: 0,
        completedToday: 0,
        longestStreak: 0,
        totalHabits: 0,
        weeklyProgress: 0
      };
    }
    try {
      return await FirebaseHabitService.getHabitStats(userId);
    } catch (error) {
      console.warn('Firebase getHabitStats failed, using demo data:', error);
      return {
        activeHabits: 0,
        completedToday: 0,
        longestStreak: 0,
        totalHabits: 0,
        weeklyProgress: 0
      };
    }
  },

  subscribeToHabits: (userId: string, callback: (habits: any[]) => void) => {
    if (!db) {
      console.log('Demo mode: No Firebase habit subscriptions (Firebase not configured)');
      return () => {};
    }
    try {
      return FirebaseHabitService.subscribeToHabits(userId, callback);
    } catch (error) {
      console.warn('Firebase subscribeToHabits failed:', error);
      return () => {};
    }
  }
};

// Mood Service with robust error handling
export const MoodService = {
  getMoodEntries: async (userId: string) => {
    if (!db) {
      console.log('Demo mode: No mood entries (Firebase not configured)');
      return [];
    }
    try {
      return await FirebaseMoodService.getMoodEntries(userId);
    } catch (error) {
      handleFirebaseError(error, 'getMoodEntries');
      return [];
    }
  },

  addMoodEntry: async (entry: any, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot save mood entries (Firebase not configured)');
      return { id: `demo-${Date.now()}`, ...entry, userId };
    }
    try {
      return await FirebaseMoodService.addMoodEntry(userId, entry);
    } catch (error) {
      handleFirebaseError(error, 'addMoodEntry');
      return null;
    }
  },

  updateMoodEntry: async (entryId: string, updates: any, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot update mood entries (Firebase not configured)');
      return { id: entryId, ...updates, userId };
    }
    try {
      return await FirebaseMoodService.updateMoodEntry(userId, entryId, updates);
    } catch (error) {
      handleFirebaseError(error, 'updateMoodEntry');
      return null;
    }
  },

  deleteMoodEntry: async (entryId: string, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot delete mood entries (Firebase not configured)');
      return true;
    }
    try {
      return await FirebaseMoodService.deleteMoodEntry(userId, entryId);
    } catch (error) {
      handleFirebaseError(error, 'deleteMoodEntry');
      return false;
    }
  },

  getTodaysMoodSummary: async (userId: string) => {
    if (!db) {
      console.log('Using demo mood summary (Firebase not configured)');
      return {
        latestMood: 'happy',
        moodEmoji: '😊',
        entryCount: 0,
        averageIntensity: 0,
        dominantMood: 'neutral'
      };
    }
    try {
      return await FirebaseMoodService.getTodaysMoodSummary(userId);
    } catch (error) {
      console.warn('Firebase getTodaysMoodSummary failed, using demo data:', error);
      return {
        latestMood: 'happy',
        moodEmoji: '😊',
        entryCount: 0,
        averageIntensity: 0,
        dominantMood: 'neutral'
      };
    }
  },

  getWeeklyMoodData: async (userId: string) => {
    if (!db) {
      console.log('Using demo weekly mood data (Firebase not configured)');
      return [];
    }
    try {
      return await FirebaseMoodService.getWeeklyMoodData(userId);
    } catch (error) {
      console.warn('Firebase getWeeklyMoodData failed, using demo data:', error);
      return [];
    }
  },

  getMoodInsight: async (userId: string) => {
    if (!db) {
      console.log('Using demo mood insight (Firebase not configured)');
      return 'Your mood tracking journey starts here!';
    }
    try {
      return await FirebaseMoodService.getMoodInsight(userId);
    } catch (error) {
      console.warn('Firebase getMoodInsight failed, using demo data:', error);
      return 'Your mood tracking journey starts here!';
    }
  }
};

// Focus Service with robust error handling
export const FocusService = {
  getSessions: async (userId: string) => {
    if (!db) {
      console.log('Demo mode: No focus sessions (Firebase not configured)');
      return [];
    }
    try {
      return await FirebaseFocusService.getSessions(userId);
    } catch (error) {
      handleFirebaseError(error, 'getSessions');
      return [];
    }
  },

  createSession: async (sessionData: any, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot create focus sessions (Firebase not configured)');
      return { id: `demo-${Date.now()}`, ...sessionData, userId };
    }
    try {
      return await FirebaseFocusService.createSession(userId, sessionData);
    } catch (error) {
      handleFirebaseError(error, 'createSession');
      return null;
    }
  },

  pauseSession: async (sessionId: string, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot pause focus sessions (Firebase not configured)');
      return true;
    }
    try {
      return await FirebaseFocusService.pauseSession(userId, sessionId);
    } catch (error) {
      handleFirebaseError(error, 'pauseSession');
      return false;
    }
  },

  resumeSession: async (sessionId: string, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot resume focus sessions (Firebase not configured)');
      return true;
    }
    try {
      return await FirebaseFocusService.resumeSession(userId, sessionId);
    } catch (error) {
      handleFirebaseError(error, 'resumeSession');
      return false;
    }
  },

  stopSession: async (sessionId: string, userId: string) => {
    if (!db) {
      console.log('Demo mode: Cannot stop focus sessions (Firebase not configured)');
      return true;
    }
    try {
      return await FirebaseFocusService.stopSession(userId, sessionId);
    } catch (error) {
      handleFirebaseError(error, 'stopSession');
      return false;
    }
  },

  getStats: async (userId: string) => {
    if (!db) {
      console.log('Using demo focus stats (Firebase not configured)');
      return {
        todaySessions: 0,
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        longestSession: 0,
        dailyStreak: 0,
        weeklyMinutes: 0,
        completionRate: 0
      };
    }
    try {
      return await FirebaseFocusService.getStats(userId);
    } catch (error) {
      console.warn('Firebase getStats failed, using demo data:', error);
      return {
        todaySessions: 0,
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        longestSession: 0,
        dailyStreak: 0,
        weeklyMinutes: 0,
        completionRate: 0
      };
    }
  },

  getActiveSession: (userId: string) => {
    if (!db) {
      console.log('Demo mode: No active focus sessions (Firebase not configured)');
      return null;
    }
    try {
      return FirebaseFocusService.getActiveSession();
    } catch (error) {
      console.warn('Firebase getActiveSession failed:', error);
      return null;
    }
  }
};

// Export types from Firebase services
export type { Task, TaskStats, TaskCategory } from "./taskDataFirebase";
export type { Habit, HabitCompletion, HabitStats } from "./habitDataFirebase";
export type { MoodEntry, MoodSummary, WeeklyMoodData } from "./moodDataFirebase";
export type { FocusSession, FocusStats } from "./focusDataFirebase";
