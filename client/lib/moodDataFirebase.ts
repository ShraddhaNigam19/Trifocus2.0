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
  limit, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface MoodEntry {
  id: string;
  date: string;
  time: string;
  mood: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad' | 'anxious' | 'excited' | 'calm' | 'stressed' | 'energetic' | 'tired' | 'grateful' | 'focused' | 'content';
  intensity: number; // 1-10 scale
  triggers: string[];
  note: string;
  activities: string[];
  createdAt: string;
  userId: string;
}

export interface MoodSummary {
  latestMood: string;
  moodEmoji: string;
  entryCount: number;
  averageIntensity: number;
  dominantMood: string;
}

export interface MoodInsight {
  pattern: string;
  suggestion: string;
  trend: 'improving' | 'stable' | 'declining';
}

const moodEmojis: Record<string, string> = {
  'very-happy': '😄',
  'happy': '😊',
  'neutral': '😐',
  'sad': '😢',
  'very-sad': '😭',
  'anxious': '😰',
  'excited': '🤩',
  'calm': '😌',
  'stressed': '😤',
  'energetic': '⚡',
  'tired': '😴',
  'grateful': '🙏',
  'focused': '🎯',
  'content': '😇'
};

const defaultTriggers = [
  'Work stress', 'Family time', 'Exercise', 'Weather', 'Sleep quality',
  'Social media', 'News', 'Money concerns', 'Health', 'Relationships',
  'Achievement', 'Relaxation', 'Music', 'Nature', 'Food'
];

const defaultActivities = [
  'Reading', 'Walking', 'Meditation', 'Exercise', 'Cooking',
  'Socializing', 'Working', 'Watching TV', 'Listening to music',
  'Hobby time', 'Cleaning', 'Shopping', 'Traveling', 'Learning'
];

export class MoodDataServiceFirebase {
  private static getMoodEntriesCollection(userId: string) {
    return collection(db, `users/${userId}/moodEntries`);
  }

  static async addMoodEntry(userId: string, entryData: Omit<MoodEntry, 'id' | 'userId' | 'createdAt'>): Promise<MoodEntry | null> {
    try {
      const entriesRef = this.getMoodEntriesCollection(userId);
      
      // Check if entry already exists for this date and time
      const existingQ = query(
        entriesRef,
        where('date', '==', entryData.date),
        where('time', '==', entryData.time)
      );
      const existingSnapshot = await getDocs(existingQ);
      
      if (!existingSnapshot.empty) {
        // Update existing entry
        const docRef = existingSnapshot.docs[0].ref;
        await updateDoc(docRef, {
          ...entryData,
          updatedAt: Timestamp.now()
        });
        
        return {
          id: existingSnapshot.docs[0].id,
          ...entryData,
          createdAt: existingSnapshot.docs[0].data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          userId
        };
      } else {
        // Create new entry
        const docRef = await addDoc(entriesRef, {
          ...entryData,
          createdAt: Timestamp.now(),
          userId
        });

        return {
          id: docRef.id,
          ...entryData,
          createdAt: new Date().toISOString(),
          userId
        };
      }
    } catch (error) {
      console.error('Error adding mood entry:', error);
      return null;
    }
  }

  static async getMoodEntries(userId: string, limitCount?: number): Promise<MoodEntry[]> {
    try {
      const entriesRef = this.getMoodEntriesCollection(userId);
      let q = query(entriesRef, orderBy('date', 'desc'));
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      })) as MoodEntry[];
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      return [];
    }
  }

  static async getMoodEntriesForDateRange(userId: string, startDate: string, endDate: string): Promise<MoodEntry[]> {
    try {
      const entriesRef = this.getMoodEntriesCollection(userId);
      const q = query(
        entriesRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      })) as MoodEntry[];
    } catch (error) {
      console.error('Error fetching mood entries for date range:', error);
      return [];
    }
  }

  static async updateMoodEntry(userId: string, entryId: string, updates: Partial<MoodEntry>): Promise<MoodEntry | null> {
    try {
      const entryRef = doc(db, `users/${userId}/moodEntries/${entryId}`);
      await updateDoc(entryRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      return {
        id: entryId,
        ...updates,
        userId
      } as MoodEntry;
    } catch (error) {
      console.error('Error updating mood entry:', error);
      return null;
    }
  }

  static async deleteMoodEntry(userId: string, entryId: string): Promise<boolean> {
    try {
      const entryRef = doc(db, `users/${userId}/moodEntries/${entryId}`);
      await deleteDoc(entryRef);
      return true;
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      return false;
    }
  }

  static async getTodaysMoodSummary(userId: string): Promise<MoodSummary> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysEntries = await this.getMoodEntriesForDateRange(userId, today, today);
      
      if (todaysEntries.length === 0) {
        return {
          latestMood: '',
          moodEmoji: '😐',
          entryCount: 0,
          averageIntensity: 0,
          dominantMood: ''
        };
      }

      const latestEntry = todaysEntries[0];
      const averageIntensity = todaysEntries.reduce((sum, entry) => sum + entry.intensity, 0) / todaysEntries.length;
      
      // Find dominant mood
      const moodCounts: Record<string, number> = {};
      todaysEntries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      });
      
      const dominantMood = Object.entries(moodCounts).reduce((a, b) => 
        moodCounts[a[0]] > moodCounts[b[0]] ? a : b
      )[0];

      return {
        latestMood: latestEntry.mood,
        moodEmoji: moodEmojis[latestEntry.mood] || '😐',
        entryCount: todaysEntries.length,
        averageIntensity: Math.round(averageIntensity * 10) / 10,
        dominantMood
      };
    } catch (error) {
      console.error('Error getting today\'s mood summary:', error);
      return {
        latestMood: '',
        moodEmoji: '😐',
        entryCount: 0,
        averageIntensity: 0,
        dominantMood: ''
      };
    }
  }

  static async getWeeklyMoodData(userId: string): Promise<{ date: string; mood: string; intensity: number }[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6); // Last 7 days
      
      const entries = await this.getMoodEntriesForDateRange(
        userId, 
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0]
      );

      // Group by date and calculate average mood for each day
      const dailyMoods: Record<string, { moods: string[], intensities: number[] }> = {};
      
      entries.forEach(entry => {
        if (!dailyMoods[entry.date]) {
          dailyMoods[entry.date] = { moods: [], intensities: [] };
        }
        dailyMoods[entry.date].moods.push(entry.mood);
        dailyMoods[entry.date].intensities.push(entry.intensity);
      });

      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (dailyMoods[dateStr]) {
          const avgIntensity = dailyMoods[dateStr].intensities.reduce((a, b) => a + b, 0) / dailyMoods[dateStr].intensities.length;
          const dominantMood = dailyMoods[dateStr].moods[0]; // Simplified - use first mood
          
          weeklyData.push({
            date: dateStr,
            mood: dominantMood,
            intensity: Math.round(avgIntensity * 10) / 10
          });
        } else {
          weeklyData.push({
            date: dateStr,
            mood: 'neutral',
            intensity: 5
          });
        }
      }

      return weeklyData;
    } catch (error) {
      console.error('Error getting weekly mood data:', error);
      return [];
    }
  }

  static async getMoodInsight(userId: string): Promise<string> {
    try {
      const recentEntries = await this.getMoodEntries(userId, 10);
      
      if (recentEntries.length === 0) {
        return "Start tracking your mood to get personalized insights and patterns.";
      }

      if (recentEntries.length < 3) {
        return "Keep logging your mood to discover patterns and get personalized insights.";
      }

      // Analyze recent patterns
      const avgIntensity = recentEntries.reduce((sum, entry) => sum + entry.intensity, 0) / recentEntries.length;
      const recentMoods = recentEntries.slice(0, 3).map(e => e.mood);
      
      // Check for patterns
      const positiveCount = recentMoods.filter(mood => ['very-happy', 'happy', 'excited', 'grateful', 'content'].includes(mood)).length;
      const negativeCount = recentMoods.filter(mood => ['sad', 'very-sad', 'anxious', 'stressed'].includes(mood)).length;
      
      if (positiveCount >= 2) {
        return "You've been feeling quite positive lately! Your mood entries show good emotional balance. Keep up the activities that make you feel good.";
      } else if (negativeCount >= 2) {
        return "I notice you've been experiencing some challenging emotions. Consider practicing self-care activities or reaching out to someone you trust.";
      } else if (avgIntensity > 7) {
        return "Your emotions have been quite intense lately. Whether positive or challenging, remember to take time for yourself and practice mindfulness.";
      } else if (avgIntensity < 4) {
        return "Your mood has been relatively calm. This could be a good time to try new activities that might bring more joy and energy to your day.";
      } else {
        return "Your mood patterns show good emotional stability. Continue with your current routines and self-care practices.";
      }
    } catch (error) {
      console.error('Error generating mood insight:', error);
      return "Keep tracking your mood to discover helpful patterns and insights.";
    }
  }

  static async getTopTriggers(userId: string, limitCount: number = 5): Promise<{ trigger: string; count: number }[]> {
    try {
      const entries = await this.getMoodEntries(userId, 50); // Last 50 entries
      const triggerCounts: Record<string, number> = {};
      
      entries.forEach(entry => {
        entry.triggers.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      });

      return Object.entries(triggerCounts)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting top triggers:', error);
      return [];
    }
  }

  static async getTopActivities(userId: string, limitCount: number = 5): Promise<{ activity: string; count: number }[]> {
    try {
      const entries = await this.getMoodEntries(userId, 50); // Last 50 entries
      const activityCounts: Record<string, number> = {};
      
      entries.forEach(entry => {
        entry.activities.forEach(activity => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
      });

      return Object.entries(activityCounts)
        .map(([activity, count]) => ({ activity, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting top activities:', error);
      return [];
    }
  }

  // Real-time listener for mood entries
  static subscribeToMoodEntries(userId: string, callback: (entries: MoodEntry[]) => void) {
    const entriesRef = this.getMoodEntriesCollection(userId);
    const q = query(entriesRef, orderBy('date', 'desc'), limit(30));
    
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId
      })) as MoodEntry[];
      
      callback(entries);
    });
  }

  // Helper functions
  static getDefaultTriggers(): string[] {
    return defaultTriggers;
  }

  static getDefaultActivities(): string[] {
    return defaultActivities;
  }

  static getMoodEmoji(mood: string): string {
    return moodEmojis[mood] || '😐';
  }

  static getAllMoodOptions(): { value: string; label: string; emoji: string }[] {
    return Object.entries(moodEmojis).map(([value, emoji]) => ({
      value,
      label: value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      emoji
    }));
  }
}
