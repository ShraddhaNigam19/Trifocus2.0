export interface MoodEntry {
  id: number;
  date: string;
  time: string;
  mood: string;
  intensity: number;
  triggers: string[];
  note: string;
  activities: string[];
}

const MOOD_STORAGE_KEY = 'trifocus_mood_entries';

export class MoodDataService {
  static getMoodEntries(): MoodEntry[] {
    try {
      const stored = localStorage.getItem(MOOD_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    }
    
    // Default mood entries
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    return [
      {
        id: 1,
        date: today,
        time: "14:30",
        mood: "happy",
        intensity: 8,
        triggers: ["work", "achievement"],
        note: "Feeling productive and accomplished today!",
        activities: ["work", "coffee"]
      },
      {
        id: 2,
        date: yesterday,
        time: "09:15",
        mood: "energetic",
        intensity: 7,
        triggers: ["exercise", "sleep"],
        note: "Great start to the day with morning exercise",
        activities: ["exercise", "coffee"]
      }
    ];
  }

  static saveMoodEntries(entries: MoodEntry[]): void {
    try {
      localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving mood entries:', error);
    }
  }

  static addMoodEntry(entry: Omit<MoodEntry, 'id'>): MoodEntry {
    const entries = this.getMoodEntries();
    const newEntry: MoodEntry = {
      ...entry,
      id: Date.now()
    };
    const updatedEntries = [newEntry, ...entries];
    this.saveMoodEntries(updatedEntries);
    return newEntry;
  }

  static getTodaysMoodSummary(): {
    latestMood: string | null;
    moodEmoji: string | null;
    entryCount: number;
    averageIntensity: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const entries = this.getMoodEntries();
    const todaysEntries = entries.filter(entry => entry.date === today);
    
    const moodEmojis: { [key: string]: string } = {
      happy: "😊",
      energetic: "⚡",
      content: "😌",
      focused: "🎯",
      relaxed: "😴",
      excited: "🤩",
      calm: "🧘",
      grateful: "🙏",
      neutral: "😐",
      tired: "😴",
      anxious: "😰",
      sad: "😢"
    };
    
    if (todaysEntries.length === 0) {
      return {
        latestMood: null,
        moodEmoji: null,
        entryCount: 0,
        averageIntensity: 0
      };
    }
    
    const latestEntry = todaysEntries[0]; // Already sorted by most recent
    const avgIntensity = todaysEntries.reduce((sum, entry) => sum + entry.intensity, 0) / todaysEntries.length;
    
    return {
      latestMood: latestEntry.mood,
      moodEmoji: moodEmojis[latestEntry.mood] || "😐",
      entryCount: todaysEntries.length,
      averageIntensity: Math.round(avgIntensity)
    };
  }

  static getWeeklyMoodData(): { [day: string]: string } {
    const entries = this.getMoodEntries();
    const weeklyData: { [day: string]: string } = {};
    
    const moodEmojis: { [key: string]: string } = {
      happy: "😊",
      energetic: "⚡",
      content: "😌",
      focused: "🎯",
      relaxed: "😴",
      excited: "🤩",
      calm: "🧘",
      grateful: "🙏",
      neutral: "😐",
      tired: "😴",
      anxious: "😰",
      sad: "😢"
    };
    
    // Get last 7 days
    const today = new Date();
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = days[date.getDay()];
      
      // Find the most recent mood entry for this day
      const dayEntries = entries.filter(entry => entry.date === dateStr);
      if (dayEntries.length > 0) {
        weeklyData[dayOfWeek] = moodEmojis[dayEntries[0].mood] || "😐";
      } else {
        weeklyData[dayOfWeek] = "⚪"; // No entry
      }
    }
    
    return weeklyData;
  }

  static getMoodInsight(): string {
    const entries = this.getMoodEntries();
    const recentEntries = entries.slice(0, 7); // Last 7 entries
    
    if (recentEntries.length === 0) {
      return "Start tracking your mood to get personalized insights!";
    }
    
    const avgIntensity = recentEntries.reduce((sum, entry) => sum + entry.intensity, 0) / recentEntries.length;
    const dominantMood = this.getDominantMood(recentEntries);
    
    if (avgIntensity >= 7) {
      return `You've been feeling ${dominantMood} & positive recently! Your energy levels are high.`;
    } else if (avgIntensity >= 5) {
      return `Your mood has been balanced lately. You're feeling ${dominantMood} most often.`;
    } else {
      return `Your recent mood shows ${dominantMood} patterns. Consider focusing on self-care.`;
    }
  }

  private static getDominantMood(entries: MoodEntry[]): string {
    const moodCounts: { [mood: string]: number } = {};
    
    entries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    return Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
  }
}
