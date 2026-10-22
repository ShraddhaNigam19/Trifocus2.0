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
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  reminderTime?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  userId: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  count: number;
  note?: string;
  completedAt: string;
  userId: string;
}

export interface HabitStats {
  activeHabits: number;
  completedToday: number;
  longestStreak: number;
  totalHabits: number;
  weeklyProgress: number;
}

const defaultHabits = [
  {
    name: "Morning Meditation",
    description: "Start the day with mindfulness",
    category: "Wellness",
    frequency: "daily" as const,
    targetCount: 1,
    reminderTime: "07:00",
    color: "emerald",
    icon: "🧘",
    isActive: true
  },
  {
    name: "Daily Exercise",
    description: "Stay physically active",
    category: "Health",
    frequency: "daily" as const,
    targetCount: 1,
    reminderTime: "18:00",
    color: "blue",
    icon: "💪",
    isActive: true
  }
];

export class HabitDataServiceFirebase {
  private static getHabitsCollection(userId: string) {
    if (!db) throw new Error('Firebase not configured');
    return collection(db, `users/${userId}/habits`);
  }

  private static getCompletionsCollection(userId: string) {
    if (!db) throw new Error('Firebase not configured');
    return collection(db, `users/${userId}/habitCompletions`);
  }

  static async initializeDefaultData(userId: string): Promise<void> {
    try {
      // Skip Firebase initialization if db is not available
      if (!db) {
        return;
      }
      const habitsRef = this.getHabitsCollection(userId);
      
      for (const habit of defaultHabits) {
        await addDoc(habitsRef, {
          ...habit,
          createdAt: Timestamp.now(),
          userId
        });
      }
    } catch (error) {
      console.error('Error initializing default habit data:', error);
    }
  }

  static async getHabits(userId: string): Promise<Habit[]> {
    if (!db) {
      console.log('Firebase not configured, returning empty habits');
      return [];
    }
    try {
      const habitsRef = this.getHabitsCollection(userId);
      const q = query(habitsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await this.initializeDefaultData(userId);
        return defaultHabits.map((habit, index) => ({
          id: `default-${index}`,
          ...habit,
          createdAt: new Date().toISOString(),
          userId
        }));
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      })) as Habit[];
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  }

  static async createHabit(userId: string, habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'>): Promise<Habit | null> {
    try {
      const habitsRef = this.getHabitsCollection(userId);
      const docRef = await addDoc(habitsRef, {
        ...habitData,
        createdAt: Timestamp.now(),
        userId
      });

      return {
        id: docRef.id,
        ...habitData,
        createdAt: new Date().toISOString(),
        userId
      };
    } catch (error) {
      console.error('Error creating habit:', error);
      return null;
    }
  }

  static async updateHabit(userId: string, habitId: string, updates: Partial<Habit>): Promise<Habit | null> {
    try {
      const habitRef = doc(db, `users/${userId}/habits/${habitId}`);
      await updateDoc(habitRef, updates);
      
      return {
        id: habitId,
        ...updates,
        userId
      } as Habit;
    } catch (error) {
      console.error('Error updating habit:', error);
      return null;
    }
  }

  static async deleteHabit(userId: string, habitId: string): Promise<boolean> {
    try {
      const habitRef = doc(db, `users/${userId}/habits/${habitId}`);
      await deleteDoc(habitRef);
      
      // Also delete all completions for this habit
      const completionsRef = this.getCompletionsCollection(userId);
      const q = query(completionsRef, where('habitId', '==', habitId));
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
  }

  static async markHabitComplete(userId: string, habitId: string, date: string, count: number = 1, note?: string): Promise<HabitCompletion | null> {
    try {
      const completionsRef = this.getCompletionsCollection(userId);
      
      // Check if already completed for this date
      const existingQ = query(
        completionsRef, 
        where('habitId', '==', habitId),
        where('date', '==', date)
      );
      const existingSnapshot = await getDocs(existingQ);
      
      if (!existingSnapshot.empty) {
        // Update existing completion
        const docRef = existingSnapshot.docs[0].ref;
        const updateData = {
          completed: true,
          count,
          note,
          completedAt: Timestamp.now()
        };
        await updateDoc(docRef, updateData);
        
        return {
          id: existingSnapshot.docs[0].id,
          habitId,
          date,
          completed: true,
          count,
          note,
          completedAt: new Date().toISOString(),
          userId
        };
      } else {
        // Create new completion
        const docRef = await addDoc(completionsRef, {
          habitId,
          date,
          completed: true,
          count,
          note,
          completedAt: Timestamp.now(),
          userId
        });

        return {
          id: docRef.id,
          habitId,
          date,
          completed: true,
          count,
          note,
          completedAt: new Date().toISOString(),
          userId
        };
      }
    } catch (error) {
      console.error('Error marking habit complete:', error);
      return null;
    }
  }

  static async getHabitCompletion(userId: string, habitId: string, date: string): Promise<HabitCompletion | null> {
    try {
      const completionsRef = this.getCompletionsCollection(userId);
      const q = query(
        completionsRef,
        where('habitId', '==', habitId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      } as HabitCompletion;
    } catch (error) {
      console.error('Error fetching habit completion:', error);
      return null;
    }
  }

  static async getHabitCompletions(userId: string, habitId: string): Promise<HabitCompletion[]> {
    try {
      const completionsRef = this.getCompletionsCollection(userId);
      const q = query(
        completionsRef,
        where('habitId', '==', habitId)
      );
      const snapshot = await getDocs(q);
      
      const completions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      })) as HabitCompletion[];

      // Sort by date in memory to avoid composite index
      return completions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching habit completions:', error);
      return [];
    }
  }

  static async getStreakForHabit(userId: string, habitId: string): Promise<number> {
    try {
      const completions = await this.getHabitCompletions(userId, habitId);
      if (completions.length === 0) return 0;

      // Sort by date descending
      const sortedCompletions = completions
        .filter(c => c.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (sortedCompletions.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedCompletions.length; i++) {
        const completionDate = new Date(sortedCompletions[i].date);
        completionDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        if (completionDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  static async getHabitStats(userId: string): Promise<HabitStats> {
    if (!db) {
      console.log('Firebase not configured, returning default habit stats');
      return {
        activeHabits: 0,
        completedToday: 0,
        longestStreak: 0,
        totalHabits: 0,
        weeklyProgress: 0
      };
    }
    try {
      const habits = await this.getHabits(userId);
      const today = new Date().toISOString().split('T')[0];
      
      const activeHabits = habits.filter(h => h.isActive).length;
      
      // Get today's completions
      let completedToday = 0;
      for (const habit of habits.filter(h => h.isActive)) {
        const completion = await this.getHabitCompletion(userId, habit.id, today);
        if (completion && completion.completed) {
          completedToday++;
        }
      }

      // Calculate longest streak across all habits
      let longestStreak = 0;
      for (const habit of habits) {
        const streak = await this.getStreakForHabit(userId, habit.id);
        longestStreak = Math.max(longestStreak, streak);
      }

      // Calculate weekly progress
      const weekDates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        weekDates.push(date.toISOString().split('T')[0]);
      }

      let weeklyCompletions = 0;
      let weeklyPossible = 0;
      
      for (const habit of habits.filter(h => h.isActive)) {
        for (const date of weekDates) {
          weeklyPossible++;
          const completion = await this.getHabitCompletion(userId, habit.id, date);
          if (completion && completion.completed) {
            weeklyCompletions++;
          }
        }
      }

      const weeklyProgress = weeklyPossible > 0 ? Math.round((weeklyCompletions / weeklyPossible) * 100) : 0;

      return {
        activeHabits,
        completedToday,
        longestStreak,
        totalHabits: habits.length,
        weeklyProgress
      };
    } catch (error) {
      console.error('Error calculating habit stats:', error);
      return {
        activeHabits: 0,
        completedToday: 0,
        longestStreak: 0,
        totalHabits: 0,
        weeklyProgress: 0
      };
    }
  }

  // Real-time listeners
  static subscribeToHabits(userId: string, callback: (habits: Habit[]) => void) {
    const habitsRef = this.getHabitsCollection(userId);
    const q = query(habitsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const habits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      })) as Habit[];
      
      callback(habits);
    });
  }

  static subscribeToCompletions(userId: string, callback: (completions: HabitCompletion[]) => void) {
    const completionsRef = this.getCompletionsCollection(userId);
    const q = query(completionsRef, orderBy('date', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const completions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      })) as HabitCompletion[];
      
      callback(completions);
    });
  }
}
