import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface FocusSession {
  id: string;
  duration: number; // in minutes
  actualDuration?: number; // actual time spent
  sessionType: 'pomodoro' | 'break' | 'deep-focus' | 'custom';
  startTime: string;
  endTime?: string;
  isActive: boolean;
  isPaused: boolean;
  remainingTime?: number; // in seconds
  taskId?: string;
  taskTitle?: string;
  habitId?: string;
  habitTitle?: string;
  customTitle?: string;
  notes?: string;
  userId: string;
  completedSuccessfully: boolean;
  pausedDuration: number; // total time paused in seconds
}

export interface FocusStats {
  todaySessions: number;
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  longestSession: number;
  dailyStreak: number;
  weeklyMinutes: number;
  completionRate: number;
}

const defaultFocusPresets = {
  pomodoro: { duration: 25, type: 'pomodoro' as const, title: 'Pomodoro Session' },
  shortBreak: { duration: 5, type: 'break' as const, title: 'Short Break' },
  longBreak: { duration: 15, type: 'break' as const, title: 'Long Break' },
  deepFocus: { duration: 90, type: 'deep-focus' as const, title: 'Deep Focus' }
};

export class FocusDataServiceFirebase {
  private static getSessionsCollection(userId: string) {
    return collection(db, `users/${userId}/focusSessions`);
  }

  private static activeSession: FocusSession | null = null;
  private static timerInterval: NodeJS.Timeout | null = null;

  static async createSession(userId: string, config: {
    duration: number;
    sessionType: FocusSession['sessionType'];
    taskId?: string;
    taskTitle?: string;
    habitId?: string;
    habitTitle?: string;
    customTitle?: string;
  }): Promise<FocusSession | null> {
    try {
      // End any existing active session
      if (this.activeSession && this.activeSession.isActive) {
        await this.stopSession(userId, this.activeSession.id);
      }

      const sessionsRef = this.getSessionsCollection(userId);
      const sessionData = {
        duration: config.duration,
        sessionType: config.sessionType,
        startTime: Timestamp.now(),
        isActive: true,
        isPaused: false,
        remainingTime: config.duration * 60, // convert to seconds
        taskId: config.taskId,
        taskTitle: config.taskTitle,
        habitId: config.habitId,
        habitTitle: config.habitTitle,
        customTitle: config.customTitle,
        userId,
        completedSuccessfully: false,
        pausedDuration: 0
      };

      const docRef = await addDoc(sessionsRef, sessionData);
      
      this.activeSession = {
        id: docRef.id,
        ...sessionData,
        startTime: new Date().toISOString()
      };

      // Start the timer
      this.startTimer(userId, this.activeSession);

      return this.activeSession;
    } catch (error) {
      console.error('Error creating focus session:', error);
      return null;
    }
  }

  private static startTimer(userId: string, session: FocusSession) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(async () => {
      if (!this.activeSession || this.activeSession.isPaused) return;

      this.activeSession.remainingTime = Math.max(0, (this.activeSession.remainingTime || 0) - 1);

      if (this.activeSession.remainingTime <= 0) {
        await this.completeSession(userId, this.activeSession.id);
      }
    }, 1000);
  }

  static async pauseSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      if (!this.activeSession || this.activeSession.id !== sessionId) return false;

      const sessionRef = doc(db, `users/${userId}/focusSessions/${sessionId}`);
      await updateDoc(sessionRef, {
        isPaused: true
      });

      this.activeSession.isPaused = true;
      return true;
    } catch (error) {
      console.error('Error pausing session:', error);
      return false;
    }
  }

  static async resumeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      if (!this.activeSession || this.activeSession.id !== sessionId) return false;

      const sessionRef = doc(db, `users/${userId}/focusSessions/${sessionId}`);
      await updateDoc(sessionRef, {
        isPaused: false
      });

      this.activeSession.isPaused = false;
      return true;
    } catch (error) {
      console.error('Error resuming session:', error);
      return false;
    }
  }

  static async stopSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, `users/${userId}/focusSessions/${sessionId}`);
      const now = new Date();
      const actualDuration = this.activeSession ? 
        Math.round((now.getTime() - new Date(this.activeSession.startTime).getTime()) / 60000) : 0;

      await updateDoc(sessionRef, {
        isActive: false,
        endTime: Timestamp.now(),
        actualDuration,
        completedSuccessfully: false
      });

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      this.activeSession = null;
      return true;
    } catch (error) {
      console.error('Error stopping session:', error);
      return false;
    }
  }

  private static async completeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, `users/${userId}/focusSessions/${sessionId}`);
      const now = new Date();
      const actualDuration = this.activeSession ? 
        Math.round((now.getTime() - new Date(this.activeSession.startTime).getTime()) / 60000) : 0;

      await updateDoc(sessionRef, {
        isActive: false,
        endTime: Timestamp.now(),
        actualDuration,
        completedSuccessfully: true,
        remainingTime: 0
      });

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      // Show completion notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
          body: `Great job! You completed your ${this.activeSession?.customTitle || this.activeSession?.sessionType} session.`,
          icon: '/favicon.ico'
        });
      }

      this.activeSession = null;
      return true;
    } catch (error) {
      console.error('Error completing session:', error);
      return false;
    }
  }

  static getActiveSession(): FocusSession | null {
    return this.activeSession;
  }

  static async getSessions(userId: string, limitCount?: number): Promise<FocusSession[]> {
    try {
      const sessionsRef = this.getSessionsCollection(userId);
      let q = query(sessionsRef, orderBy('startTime', 'desc'));
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
        endTime: doc.data().endTime?.toDate?.()?.toISOString() || undefined,
        userId
      })) as FocusSession[];
    } catch (error) {
      console.error('Error fetching focus sessions:', error);
      return [];
    }
  }

  static async getStats(userId: string): Promise<FocusStats> {
    if (!db) {
      console.log('Firebase not configured, returning default focus stats');
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
      const sessions = await this.getSessions(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());

      // Today's sessions
      const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= today && sessionDate <= todayEnd;
      }).length;

      // Total stats
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.completedSuccessfully);
      const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.actualDuration || s.duration), 0);
      
      const averageSessionLength = completedSessions.length > 0 ? 
        Math.round(totalMinutes / completedSessions.length) : 0;
      
      const longestSession = completedSessions.reduce((max, s) => 
        Math.max(max, s.actualDuration || s.duration), 0);

      // Weekly minutes
      const weeklyMinutes = sessions
        .filter(s => new Date(s.startTime) >= thisWeekStart)
        .filter(s => s.completedSuccessfully)
        .reduce((acc, s) => acc + (s.actualDuration || s.duration), 0);

      // Completion rate
      const completionRate = totalSessions > 0 ? 
        Math.round((completedSessions.length / totalSessions) * 100) : 0;

      // Daily streak (simplified - consecutive days with at least one completed session)
      let dailyStreak = 0;
      const dateStrings = new Set();
      
      completedSessions.forEach(s => {
        const dateStr = new Date(s.startTime).toDateString();
        dateStrings.add(dateStr);
      });

      const sortedDates = Array.from(dateStrings).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );

      const todayStr = today.toDateString();
      if (sortedDates.includes(todayStr)) {
        dailyStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i]);
          const previousDate = new Date(sortedDates[i - 1]);
          const dayDiff = Math.round((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            dailyStreak++;
          } else {
            break;
          }
        }
      }

      return {
        todaySessions,
        totalSessions,
        totalMinutes,
        averageSessionLength,
        longestSession,
        dailyStreak,
        weeklyMinutes,
        completionRate
      };
    } catch (error) {
      console.error('Error calculating focus stats:', error);
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
  }

  static async addSessionNote(userId: string, sessionId: string, note: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, `users/${userId}/focusSessions/${sessionId}`);
      await updateDoc(sessionRef, { notes: note });
      return true;
    } catch (error) {
      console.error('Error adding session note:', error);
      return false;
    }
  }

  // Real-time listener for sessions
  static subscribeToSessions(userId: string, callback: (sessions: FocusSession[]) => void) {
    const sessionsRef = this.getSessionsCollection(userId);
    const q = query(sessionsRef, orderBy('startTime', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
        endTime: doc.data().endTime?.toDate?.()?.toISOString() || undefined,
        userId
      })) as FocusSession[];
      
      callback(sessions);
    });
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Get predefined focus presets
  static getFocusPresets() {
    return defaultFocusPresets;
  }
}
