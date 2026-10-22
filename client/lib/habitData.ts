import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  userId?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetDays?: number[]; // For weekly habits: [1,2,3,4,5] = Mon-Fri
  customTarget?: number; // For custom frequency
  customPeriod?: 'week' | 'month'; // For custom frequency
  color: string;
  icon?: string;
  reminder?: {
    enabled: boolean;
    time: string;
  };
  createdAt: string;
  isActive: boolean;
  userId?: string;
}

// Firebase-based Habit Data Service
export class HabitDataService {
  private static userId: string | null = null;
  private static defaultHabits: Habit[] = [
    {
      id: '1',
      name: 'Morning Meditation',
      description: 'Start the day with mindfulness',
      category: 'wellness',
      frequency: 'daily',
      color: 'emerald',
      icon: '🧘',
      reminder: { enabled: true, time: '07:00' },
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: '2',
      name: 'Daily Exercise',
      description: 'Stay physically active',
      category: 'fitness',
      frequency: 'daily',
      color: 'blue',
      icon: '💪',
      reminder: { enabled: true, time: '18:00' },
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ];

  static setUserId(userId: string) {
    this.userId = userId;
  }

  private static getHabitsCollection() {
    if (!this.userId || !db) throw new Error('Firebase not configured or user not set');
    return collection(db, `users/${this.userId}/habits`);
  }

  private static getEntriesCollection() {
    if (!this.userId || !db) throw new Error('Firebase not configured or user not set');
    return collection(db, `users/${this.userId}/habitEntries`);
  }

  static async getHabits(): Promise<Habit[]> {
    if (!this.userId || !db) {
      console.warn('Firebase not available, returning default habits');
      return this.defaultHabits;
    }
    try {
      const q = query(this.getHabitsCollection(), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return this.defaultHabits;
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      })) as Habit[];
    } catch (error) {
      console.error('Error loading habits:', error);
      return this.defaultHabits;
    }
  }

  static async getHabitEntries(): Promise<HabitEntry[]> {
    if (!this.userId || !db) {
      console.warn('Firebase not available, returning empty entries');
      return [];
    }
    try {
      const q = query(this.getEntriesCollection(), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt,
      })) as HabitEntry[];
    } catch (error) {
      console.error('Error loading habit entries:', error);
      return [];
    }
  }

  static async addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> {
    try {
      const docRef = await addDoc(this.getHabitsCollection(), {
        ...habit,
        createdAt: Timestamp.now()
      });
      return {
        ...habit,
        id: docRef.id,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  }

  static async updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit | null> {
    try {
      const habitRef = doc(db, `users/${this.userId}/habits/${habitId}`);
      await updateDoc(habitRef, updates);
      return { id: habitId, ...updates } as Habit;
    } catch (error) {
      console.error('Error updating habit:', error);
      return null;
    }
  }

  static async deleteHabit(habitId: string): Promise<boolean> {
    try {
      const habitRef = doc(db, `users/${this.userId}/habits/${habitId}`);
      await deleteDoc(habitRef);
      
      // Also delete all entries for this habit
      const q = query(this.getEntriesCollection(), where('habitId', '==', habitId));
      const snapshot = await getDocs(q);
      for (const entryDoc of snapshot.docs) {
        await deleteDoc(entryDoc.ref);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
  }

  static async markHabitComplete(habitId: string, date: string, notes?: string): Promise<HabitEntry> {
    try {
      const q = query(
        this.getEntriesCollection(),
        where('habitId', '==', habitId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      
      const entry: HabitEntry = {
        id: `${habitId}-${date}`,
        habitId,
        date,
        completed: true,
        completedAt: new Date().toISOString(),
        notes: notes || ''
      };
      
      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        await updateDoc(existingDoc.ref, entry);
        return { id: existingDoc.id, ...entry };
      } else {
        const docRef = await addDoc(this.getEntriesCollection(), {
          ...entry,
          completedAt: Timestamp.now()
        });
        return { id: docRef.id, ...entry };
      }
    } catch (error) {
      console.error('Error marking habit complete:', error);
      throw error;
    }
  }

  static async markHabitIncomplete(habitId: string, date: string): Promise<boolean> {
    try {
      const q = query(
        this.getEntriesCollection(),
        where('habitId', '==', habitId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking habit incomplete:', error);
      return false;
    }
  }

  static async getHabitCompletion(habitId: string, date: string): Promise<HabitEntry | null> {
    try {
      const q = query(
        this.getEntriesCollection(),
        where('habitId', '==', habitId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt,
      } as HabitEntry;
    } catch (error) {
      console.error('Error fetching habit completion:', error);
      return null;
    }
  }

  static async getStreakForHabit(habitId: string): Promise<number> {
    try {
      const q = query(
        this.getEntriesCollection(),
        where('habitId', '==', habitId)
      );
      const snapshot = await getDocs(q);
      
      const entries = snapshot.docs
        .map(doc => doc.data() as HabitEntry)
        .filter(e => e.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (entries.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const hasEntry = entries.some(e => e.date === dateStr);
        if (hasEntry) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  static async getHabitStats(): Promise<{
    activeHabits: number;
    completedToday: number;
    longestStreak: number;
    totalHabits: number;
    weeklyProgress: number;
  }> {
    try {
      const habits = await this.getHabits();
      const entries = await this.getHabitEntries();
      const today = new Date().toISOString().split('T')[0];

      const activeHabits = habits.filter(h => h.isActive).length;
      
      // Today's completion
      const todayEntries = entries.filter(e => e.date === today && e.completed);
      const completedToday = todayEntries.length;

      // Week's completion rate
      const weekDates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        weekDates.push(date.toISOString().split('T')[0]);
      }

      const weekEntries = entries.filter(e => weekDates.includes(e.date) && e.completed);
      const expectedWeeklyEntries = activeHabits * 7;
      const weeklyProgress = expectedWeeklyEntries > 0 ? Math.round((weekEntries.length / expectedWeeklyEntries) * 100) : 0;

      // Longest streak across all habits
      let longestStreak = 0;
      for (const habit of habits) {
        const streak = await this.getStreakForHabit(habit.id);
        longestStreak = Math.max(longestStreak, streak);
      }

      return {
        activeHabits,
        completedToday,
        longestStreak,
        totalHabits: habits.length,
        weeklyProgress
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        activeHabits: 0,
        completedToday: 0,
        longestStreak: 0,
        totalHabits: 0,
        weeklyProgress: 0
      };
    }
  }

  static async getWeeklyProgress(): Promise<{ date: string; dayName: string; completion: number; isToday: boolean }[]> {
    try {
      const habits = await this.getHabits();
      const entries = await this.getHabitEntries();
      const activeHabits = habits.filter(h => h.isActive);
      const result = [];
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];
        
        const dayEntries = entries.filter(e => e.date === dateStr && e.completed);
        const completion = activeHabits.length > 0 ? Math.round((dayEntries.length / activeHabits.length) * 100) : 0;
        const isToday = dateStr === today.toISOString().split('T')[0];
        
        result.push({
          date: dateStr,
          dayName,
          completion,
          isToday
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error calculating weekly progress:', error);
      return [];
    }
  }
}
