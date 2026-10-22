export interface FocusSession {
  id: string;
  taskId?: string;
  habitId?: string;
  taskTitle?: string;
  habitTitle?: string;
  customTitle?: string;
  duration: number; // in minutes
  remainingTime?: number; // in seconds
  startTime: string;
  endTime?: string;
  completed: boolean;
  paused: boolean;
  sessionType: 'pomodoro' | 'custom' | 'deep-focus' | 'short-break' | 'long-break';
  breaks: number;
  notes?: string;
  date: string;
  interruptions: number;
}

export interface FocusSettings {
  pomodoroLength: number; // minutes
  shortBreakLength: number; // minutes
  longBreakLength: number; // minutes
  longBreakInterval: number; // number of pomodoros before long break
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyGoal: number; // number of sessions
}

export interface FocusStats {
  totalSessions: number;
  totalFocusTime: number; // in minutes
  completedSessions: number;
  averageSessionLength: number;
  dailyStreak: number;
  longestStreak: number;
  todaySessions: number;
  weekSessions: number;
  monthSessions: number;
  mostProductiveTime: string;
  completionRate: number;
}

export interface DailyFocusData {
  date: string;
  sessions: FocusSession[];
  totalFocusTime: number;
  completedSessions: number;
  goal: number;
}

export class FocusDataService {
  private static readonly SESSIONS_KEY = 'focus_sessions';
  private static readonly SETTINGS_KEY = 'focus_settings';
  private static readonly ACTIVE_SESSION_KEY = 'active_focus_session';

  // Default settings
  private static getDefaultSettings(): FocusSettings {
    return {
      pomodoroLength: 25,
      shortBreakLength: 5,
      longBreakLength: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: true,
      notificationsEnabled: true,
      dailyGoal: 8
    };
  }

  // Settings management
  static getSettings(): FocusSettings {
    const stored = localStorage.getItem(this.SETTINGS_KEY);
    return stored ? JSON.parse(stored) : this.getDefaultSettings();
  }

  static updateSettings(settings: Partial<FocusSettings>): FocusSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  // Session management
  static getSessions(): FocusSession[] {
    const stored = localStorage.getItem(this.SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getActiveSession(): FocusSession | null {
    const stored = localStorage.getItem(this.ACTIVE_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static setActiveSession(session: FocusSession | null): void {
    if (session) {
      localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(this.ACTIVE_SESSION_KEY);
    }
  }

  static createSession(params: {
    taskId?: string;
    habitId?: string;
    taskTitle?: string;
    habitTitle?: string;
    customTitle?: string;
    duration: number;
    sessionType: FocusSession['sessionType'];
  }): FocusSession {
    const session: FocusSession = {
      id: Date.now().toString(),
      ...params,
      startTime: new Date().toISOString(),
      completed: false,
      paused: false,
      breaks: 0,
      date: new Date().toISOString().split('T')[0],
      interruptions: 0,
      remainingTime: params.duration * 60 // convert to seconds
    };

    this.setActiveSession(session);
    return session;
  }

  static updateSession(sessionId: string, updates: Partial<FocusSession>): FocusSession | null {
    const sessions = this.getSessions();
    const activeSession = this.getActiveSession();
    
    // Update in sessions list
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    }

    // Update active session if it's the same one
    if (activeSession && activeSession.id === sessionId) {
      const updatedSession = { ...activeSession, ...updates };
      this.setActiveSession(updatedSession);
      return updatedSession;
    }

    return sessionIndex !== -1 ? sessions[sessionIndex] : null;
  }

  static completeSession(sessionId: string, notes?: string): FocusSession | null {
    const activeSession = this.getActiveSession();
    
    if (activeSession && activeSession.id === sessionId) {
      const completedSession: FocusSession = {
        ...activeSession,
        completed: true,
        endTime: new Date().toISOString(),
        notes,
        remainingTime: 0
      };

      // Add to sessions list
      const sessions = this.getSessions();
      sessions.push(completedSession);
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));

      // Clear active session
      this.setActiveSession(null);

      return completedSession;
    }

    return null;
  }

  static pauseSession(sessionId: string): FocusSession | null {
    return this.updateSession(sessionId, { paused: true });
  }

  static resumeSession(sessionId: string): FocusSession | null {
    return this.updateSession(sessionId, { paused: false });
  }

  static stopSession(sessionId: string): void {
    const activeSession = this.getActiveSession();
    if (activeSession && activeSession.id === sessionId) {
      // Save incomplete session
      const sessions = this.getSessions();
      sessions.push({
        ...activeSession,
        endTime: new Date().toISOString(),
        completed: false
      });
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
      
      // Clear active session
      this.setActiveSession(null);
    }
  }

  static addInterruption(sessionId: string): void {
    const activeSession = this.getActiveSession();
    if (activeSession && activeSession.id === sessionId) {
      this.updateSession(sessionId, { 
        interruptions: activeSession.interruptions + 1 
      });
    }
  }

  // Statistics and analytics
  static getStats(): FocusStats {
    const sessions = this.getSessions();
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = this.getWeekStart(new Date());
    const thisMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');

    const completedSessions = sessions.filter(s => s.completed);
    const todaySessions = sessions.filter(s => s.date === today && s.completed);
    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= thisWeek && s.completed;
    });
    const monthSessions = sessions.filter(s => s.date.startsWith(thisMonth) && s.completed);

    const totalFocusTime = completedSessions.reduce((total, session) => {
      return total + session.duration;
    }, 0);

    const averageSessionLength = completedSessions.length > 0 
      ? totalFocusTime / completedSessions.length 
      : 0;

    const completionRate = sessions.length > 0 
      ? (completedSessions.length / sessions.length) * 100 
      : 0;

    return {
      totalSessions: sessions.length,
      totalFocusTime,
      completedSessions: completedSessions.length,
      averageSessionLength,
      dailyStreak: this.getCurrentStreak(),
      longestStreak: this.getLongestStreak(),
      todaySessions: todaySessions.length,
      weekSessions: weekSessions.length,
      monthSessions: monthSessions.length,
      mostProductiveTime: this.getMostProductiveTime(),
      completionRate
    };
  }

  static getTodaysSessions(): FocusSession[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getSessions().filter(session => session.date === today);
  }

  static getWeeklyData(): DailyFocusData[] {
    const weekData: DailyFocusData[] = [];
    const settings = this.getSettings();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = this.getSessions().filter(s => s.date === dateStr);
      const completedSessions = daySessions.filter(s => s.completed);
      const totalFocusTime = completedSessions.reduce((total, s) => total + s.duration, 0);
      
      weekData.push({
        date: dateStr,
        sessions: daySessions,
        totalFocusTime,
        completedSessions: completedSessions.length,
        goal: settings.dailyGoal
      });
    }
    
    return weekData;
  }

  // Helper methods
  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private static getCurrentStreak(): number {
    const sessions = this.getSessions();
    const settings = this.getSettings();
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.date === dateStr && s.completed);
      
      if (daySessions.length >= settings.dailyGoal || dateStr === new Date().toISOString().split('T')[0]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  private static getLongestStreak(): number {
    const sessions = this.getSessions();
    const settings = this.getSettings();
    const dates = [...new Set(sessions.map(s => s.date))].sort();
    
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (const date of dates) {
      const daySessions = sessions.filter(s => s.date === date && s.completed);
      if (daySessions.length >= settings.dailyGoal) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }

  private static getMostProductiveTime(): string {
    const sessions = this.getSessions().filter(s => s.completed);
    if (sessions.length === 0) return 'No data';
    
    const hourCounts: { [hour: number]: number } = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostProductiveHour = Object.entries(hourCounts)
      .reduce((max, [hour, count]) => count > max[1] ? [hour, count] : max, ['0', 0])[0];
    
    const hour = parseInt(mostProductiveHour);
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }

  // Quick session starters
  static startPomodoroSession(taskId?: string, taskTitle?: string, habitId?: string, habitTitle?: string): FocusSession {
    const settings = this.getSettings();
    return this.createSession({
      taskId,
      taskTitle,
      habitId,
      habitTitle,
      duration: settings.pomodoroLength,
      sessionType: 'pomodoro'
    });
  }

  static startCustomSession(duration: number, title: string): FocusSession {
    return this.createSession({
      customTitle: title,
      duration,
      sessionType: 'custom'
    });
  }

  static startBreakSession(type: 'short-break' | 'long-break'): FocusSession {
    const settings = this.getSettings();
    const duration = type === 'short-break' ? settings.shortBreakLength : settings.longBreakLength;
    
    return this.createSession({
      customTitle: type === 'short-break' ? 'Short Break' : 'Long Break',
      duration,
      sessionType: type
    });
  }

  // Get sessions for specific task or habit
  static getSessionsForTask(taskId: string): FocusSession[] {
    return this.getSessions().filter(session => session.taskId === taskId);
  }

  static getSessionsForHabit(habitId: string): FocusSession[] {
    return this.getSessions().filter(session => session.habitId === habitId);
  }

  // Get focus time for specific items
  static getFocusTimeForTask(taskId: string): number {
    return this.getSessionsForTask(taskId)
      .filter(s => s.completed)
      .reduce((total, s) => total + s.duration, 0);
  }

  static getFocusTimeForHabit(habitId: string): number {
    return this.getSessionsForHabit(habitId)
      .filter(s => s.completed)
      .reduce((total, s) => total + s.duration, 0);
  }
}
