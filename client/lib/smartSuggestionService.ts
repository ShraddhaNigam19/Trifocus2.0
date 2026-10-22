import { MoodDataService } from './moodData';
import { HabitDataService } from './habitData';
import { FocusDataService } from './focusData';

export interface VideoRecommendation {
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  type: 'music' | 'motivation' | 'wellness' | 'productivity' | 'exercise' | 'timer' | 'ambient' | 'rest';
  url: string;
  relevanceScore: number;
}

export interface MusicPlaylist {
  name: string;
  genre: string;
  tracks: number;
  emoji: string;
  color: string;
  mood: string[];
  timeOfDay: string[];
}

export interface ActivitySuggestion {
  title: string;
  description: string;
  action: string;
  icon: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  relevanceScore: number;
  category: 'productivity' | 'wellness' | 'learning' | 'social';
  estimatedDuration: string;
}

export class SmartSuggestionService {
  
  // Enhanced video recommendations with relevance scoring
  static getVideoRecommendations(mood: string, timeOfDay: number, userPreferences?: string[]): VideoRecommendation[] {
    const allVideos = [
      // Happy/Positive mood videos - Real YouTube videos
      { title: "Lofi Hip Hop Radio - Beats to Relax/Study To", channel: "Lofi Girl", duration: "Live", thumbnail: "🎵", type: "music" as const, url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", moods: ["happy", "excited", "energetic"], times: [6, 7, 8, 9, 10] },
      { title: "How to Stop Screwing Yourself Over | TEDx", channel: "TEDx Talks", duration: "22m", thumbnail: "☀️", type: "motivation" as const, url: "https://www.youtube.com/watch?v=Lp7E973zozc", moods: ["happy", "neutral", "motivated"], times: [6, 7, 8, 9] },
      { title: "Jazz Café Ambience - Relaxing Coffee Shop", channel: "Calmed By Nature", duration: "2h", thumbnail: "☕", type: "music" as const, url: "https://www.youtube.com/watch?v=hHW1oY26kxQ", moods: ["happy", "focused", "content"], times: [9, 10, 11, 14, 15, 16] },

      // Focused/Productive mood videos - Real YouTube videos
      { title: "Deep Focus Music - Enhanced Concentration", channel: "Greenred Productions", duration: "3h", thumbnail: "🧠", type: "music" as const, url: "https://www.youtube.com/watch?v=WPni755-Krg", moods: ["focused", "neutral", "determined"], times: [9, 10, 11, 14, 15, 16, 19, 20] },
      { title: "25 Min Pomodoro Timer with Nature Sounds", channel: "Study MD", duration: "25m", thumbnail: "🍅", type: "timer" as const, url: "https://www.youtube.com/watch?v=mNBmG24djoY", moods: ["focused", "neutral"], times: [9, 10, 11, 14, 15, 16] },
      { title: "Lofi Hip Hop Mix - Beats to Study/Relax", channel: "ChilledCow", duration: "1h", thumbnail: "📚", type: "music" as const, url: "https://www.youtube.com/watch?v=5qap5aO4i9A", moods: ["focused", "calm", "neutral"], times: [10, 11, 14, 15, 16, 19, 20] },
      
      // Stressed/Anxious mood videos - Real YouTube videos
      { title: "10 Minute Daily Meditation | Mindfulness", channel: "The Honest Guys", duration: "10m", thumbnail: "🧘", type: "wellness" as const, url: "https://www.youtube.com/watch?v=O-6f5wQXSu8", moods: ["stressed", "anxious", "overwhelmed"], times: [8, 12, 13, 17, 18, 21] },
      { title: "Rain Sounds for Sleeping | Heavy Rain", channel: "Relaxing White Noise", duration: "10h", thumbnail: "🌧️", type: "ambient" as const, url: "https://www.youtube.com/watch?v=mPZkdNFkNps", moods: ["stressed", "anxious", "tired"], times: [12, 13, 17, 18, 21, 22] },
      { title: "5 Minute Breathing Exercise You Can Do Anywhere", channel: "Yoga with Adriene", duration: "5m", thumbnail: "🌸", type: "wellness" as const, url: "https://www.youtube.com/watch?v=DbDoBzGY3vo", moods: ["stressed", "anxious"], times: [8, 12, 13, 17, 18] },

      // Tired/Low energy mood videos - Real YouTube videos
      { title: "10 Minute Energy Boosting Workout", channel: "FitnessBlender", duration: "10m", thumbnail: "⚡", type: "exercise" as const, url: "https://www.youtube.com/watch?v=ixkQaZXVQjs", moods: ["tired", "sluggish", "low"], times: [8, 9, 14, 15, 16] },
      { title: "20 Minute Power Nap Music", channel: "Soothing Relaxation", duration: "20m", thumbnail: "😴", type: "rest" as const, url: "https://www.youtube.com/watch?v=aWXo2ESB3QU", moods: ["tired", "exhausted"], times: [13, 14, 15] },
      { title: "Morning Yoga - Energy Practice", channel: "Yoga with Kassandra", duration: "15m", thumbnail: "🤸", type: "exercise" as const, url: "https://www.youtube.com/watch?v=g_tea8ZNk5A", moods: ["tired", "stiff"], times: [7, 8, 9] },
      
      // Neutral/General mood videos - Real YouTube videos
      { title: "Space Ambient Music - Deep Relaxation", channel: "Ambient Worlds", duration: "2h", thumbnail: "🎧", type: "music" as const, url: "https://www.youtube.com/watch?v=_tV5LEBDs7w", moods: ["neutral", "calm"], times: [10, 11, 14, 15, 16, 19, 20] },
      { title: "How to Be More Productive", channel: "Thomas Frank", duration: "8m", thumbnail: "📅", type: "productivity" as const, url: "https://www.youtube.com/watch?v=W9k_R6GNC4g", moods: ["neutral", "motivated"], times: [8, 9, 10, 17, 18] },
      { title: "5 Minute Walking Meditation", channel: "The Mindful Movement", duration: "5m", thumbnail: "🚶", type: "wellness" as const, url: "https://www.youtube.com/watch?v=6p0DAz_30qQ", moods: ["neutral", "restless"], times: [12, 13, 17, 18] },

      // Evening/Wind-down videos - Real YouTube videos
      { title: "Evening Gratitude Meditation", channel: "Great Meditation", duration: "15m", thumbnail: "🌅", type: "wellness" as const, url: "https://www.youtube.com/watch?v=I8ioJg6gFWE", moods: ["content", "grateful", "reflective"], times: [19, 20, 21, 22] },
      { title: "Relaxing Jazz Music for Evening", channel: "Jazz and Blues Experience", duration: "1h", thumbnail: "🌇", type: "music" as const, url: "https://www.youtube.com/watch?v=neV3EPgvZ3g", moods: ["content", "calm", "peaceful"], times: [18, 19, 20, 21] },
      { title: "Bedtime Yoga | Wind Down Flow", channel: "Yoga with Adriene", duration: "20m", thumbnail: "🌙", type: "wellness" as const, url: "https://www.youtube.com/watch?v=v7AYKMP6rOE", moods: ["tired", "restless", "peaceful"], times: [20, 21, 22] }
    ];

    return allVideos
      .map(video => {
        let relevanceScore = 0;
        
        // Mood matching (highest weight)
        if (video.moods.includes(mood)) relevanceScore += 50;
        if (video.moods.includes('neutral')) relevanceScore += 10; // Neutral is always somewhat relevant
        
        // Time of day matching
        if (video.times.includes(timeOfDay)) relevanceScore += 30;
        
        // Preference matching (if provided)
        if (userPreferences) {
          if (userPreferences.includes(video.type)) relevanceScore += 20;
        }
        
        // Add some randomization to prevent stale recommendations
        relevanceScore += Math.random() * 10;
        
        return {
          ...video,
          relevanceScore
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6); // Return top 6 recommendations
  }

  // Enhanced music playlists with mood and time context
  static getMusicPlaylists(mood: string, timeOfDay: number): MusicPlaylist[] {
    const allPlaylists = [
      // Morning playlists
      { name: "Morning Motivation", genre: "Upbeat Indie", tracks: 25, emoji: "☀️", color: "bg-yellow-100 text-yellow-700", mood: ["happy", "energetic", "motivated"], timeOfDay: ["morning"] },
      { name: "Coffee Shop Vibes", genre: "Acoustic/Jazz", tracks: 18, emoji: "☕", color: "bg-amber-100 text-amber-700", mood: ["content", "focused", "calm"], timeOfDay: ["morning", "afternoon"] },
      { name: "Energetic Startup", genre: "Electronic", tracks: 30, emoji: "⚡", color: "bg-blue-100 text-blue-700", mood: ["energetic", "excited", "motivated"], timeOfDay: ["morning"] },
      
      // Focus/Work playlists
      { name: "Deep Focus Flow", genre: "Ambient/Instrumental", tracks: 45, emoji: "🎯", color: "bg-purple-100 text-purple-700", mood: ["focused", "neutral", "determined"], timeOfDay: ["morning", "afternoon"] },
      { name: "Coding Beats", genre: "Lo-fi Hip Hop", tracks: 32, emoji: "💻", color: "bg-green-100 text-green-700", mood: ["focused", "content"], timeOfDay: ["morning", "afternoon", "evening"] },
      { name: "Classical Concentration", genre: "Classical", tracks: 28, emoji: "🎼", color: "bg-indigo-100 text-indigo-700", mood: ["focused", "calm", "peaceful"], timeOfDay: ["morning", "afternoon"] },
      
      // Relaxation playlists
      { name: "Chill Vibes", genre: "Downtempo", tracks: 22, emoji: "🌊", color: "bg-cyan-100 text-cyan-700", mood: ["calm", "content", "peaceful"], timeOfDay: ["afternoon", "evening"] },
      { name: "Nature Sounds Mix", genre: "Ambient Nature", tracks: 15, emoji: "🌲", color: "bg-emerald-100 text-emerald-700", mood: ["stressed", "anxious", "calm"], timeOfDay: ["afternoon", "evening"] },
      { name: "Meditation & Mindfulness", genre: "Spiritual", tracks: 20, emoji: "🧘", color: "bg-pink-100 text-pink-700", mood: ["stressed", "anxious", "peaceful"], timeOfDay: ["morning", "evening"] },
      
      // Evening playlists
      { name: "Sunset Jazz", genre: "Smooth Jazz", tracks: 24, emoji: "🌅", color: "bg-orange-100 text-orange-700", mood: ["content", "peaceful", "reflective"], timeOfDay: ["evening"] },
      { name: "Evening Reflection", genre: "Acoustic", tracks: 19, emoji: "🌙", color: "bg-slate-100 text-slate-700", mood: ["content", "peaceful", "grateful"], timeOfDay: ["evening"] },
      { name: "Wind Down", genre: "Soft Pop", tracks: 16, emoji: "🕯️", color: "bg-rose-100 text-rose-700", mood: ["tired", "peaceful", "calm"], timeOfDay: ["evening"] },
      
      // Mood-specific playlists
      { name: "Happy Hits", genre: "Pop/Indie", tracks: 35, emoji: "😊", color: "bg-yellow-100 text-yellow-700", mood: ["happy", "excited", "joyful"], timeOfDay: ["morning", "afternoon"] },
      { name: "Stress Relief", genre: "Ambient/New Age", tracks: 18, emoji: "🌸", color: "bg-pink-100 text-pink-700", mood: ["stressed", "anxious", "overwhelmed"], timeOfDay: ["afternoon", "evening"] },
      { name: "Energy Boost", genre: "Rock/Electronic", tracks: 28, emoji: "🔥", color: "bg-red-100 text-red-700", mood: ["tired", "sluggish", "unmotivated"], timeOfDay: ["morning", "afternoon"] }
    ];

    const timeCategory = timeOfDay < 12 ? 'morning' : timeOfDay < 17 ? 'afternoon' : 'evening';
    
    return allPlaylists
      .filter(playlist => 
        playlist.mood.includes(mood) || 
        playlist.timeOfDay.includes(timeCategory) ||
        playlist.mood.includes('neutral')
      )
      .slice(0, 6);
  }

  // Intelligent activity suggestions based on comprehensive user context
  static async getActivitySuggestions(): Promise<ActivitySuggestion[]> {
    const mood = MoodDataService.getTodaysMoodSummary().latestMood || 'neutral';
    const timeOfDay = new Date().getHours();
    const habits = (await HabitDataService.getHabits()).filter(h => h.isActive);
    const focusStats = FocusDataService.getStats();
    const today = new Date().toISOString().split('T')[0];
    
    const suggestions: ActivitySuggestion[] = [];

    // Time-based suggestions
    if (timeOfDay >= 6 && timeOfDay < 10) {
      suggestions.push({
        title: "Morning Routine Optimization",
        description: "Review and optimize your morning habits for a productive day",
        action: "Review Morning Habits",
        icon: "☀️",
        color: "bg-yellow-50 border-yellow-200 text-yellow-700",
        priority: "high",
        relevanceScore: 90,
        category: "productivity",
        estimatedDuration: "10 minutes"
      });
    }

    if (timeOfDay >= 12 && timeOfDay < 14) {
      suggestions.push({
        title: "Mindful Lunch Break",
        description: "Take a proper break and practice mindful eating",
        action: "Start Mindful Break",
        icon: "🍽️",
        color: "bg-green-50 border-green-200 text-green-700",
        priority: "medium",
        relevanceScore: 70,
        category: "wellness",
        estimatedDuration: "20 minutes"
      });
    }

    if (timeOfDay >= 17 && timeOfDay < 19) {
      suggestions.push({
        title: "End-of-Day Reflection",
        description: "Review your accomplishments and plan for tomorrow",
        action: "Start Daily Review",
        icon: "📝",
        color: "bg-blue-50 border-blue-200 text-blue-700",
        priority: "medium",
        relevanceScore: 75,
        category: "productivity",
        estimatedDuration: "15 minutes"
      });
    }

    // Mood-based suggestions
    switch (mood) {
      case 'stressed':
      case 'anxious':
        suggestions.push({
          title: "Stress Relief Session",
          description: "Try a guided breathing exercise or short meditation",
          action: "Start Stress Relief",
          icon: "🧘",
          color: "bg-pink-50 border-pink-200 text-pink-700",
          priority: "high",
          relevanceScore: 95,
          category: "wellness",
          estimatedDuration: "5-10 minutes"
        });
        break;
        
      case 'tired':
      case 'sluggish':
        suggestions.push({
          title: "Energy Revival",
          description: "Quick movement or stretching to boost energy levels",
          action: "Do Energy Boost",
          icon: "⚡",
          color: "bg-orange-50 border-orange-200 text-orange-700",
          priority: "high",
          relevanceScore: 90,
          category: "wellness",
          estimatedDuration: "5-15 minutes"
        });
        break;
        
      case 'happy':
      case 'excited':
        suggestions.push({
          title: "Momentum Building",
          description: "Channel your positive energy into productive tasks",
          action: "View High-Priority Tasks",
          icon: "🚀",
          color: "bg-blue-50 border-blue-200 text-blue-700",
          priority: "medium",
          relevanceScore: 80,
          category: "productivity",
          estimatedDuration: "varies"
        });
        break;
        
      case 'focused':
        suggestions.push({
          title: "Deep Work Session",
          description: "Perfect time for challenging, focused work",
          action: "Start Deep Focus",
          icon: "🎯",
          color: "bg-purple-50 border-purple-200 text-purple-700",
          priority: "high",
          relevanceScore: 95,
          category: "productivity",
          estimatedDuration: "45-90 minutes"
        });
        break;
    }

    // Focus session recommendations
    if (focusStats.todaySessions < 4) {
      const sessionsNeeded = 4 - focusStats.todaySessions;
      suggestions.push({
        title: "Focus Session Goal",
        description: `Complete ${sessionsNeeded} more focus session${sessionsNeeded > 1 ? 's' : ''} to reach your daily goal`,
        action: "Start Focus Timer",
        icon: "⏱️",
        color: "bg-indigo-50 border-indigo-200 text-indigo-700",
        priority: focusStats.todaySessions < 2 ? "high" : "medium",
        relevanceScore: 85 - (focusStats.todaySessions * 10),
        category: "productivity",
        estimatedDuration: "25 minutes"
      });
    }

    // Habit-based suggestions
    const incompleteHabitsPromises = habits.map(async (habit) => {
      const completion = await HabitDataService.getHabitCompletion(habit.id, today);
      return { habit, isComplete: !!completion };
    });
    
    const incompleteHabitsResults = await Promise.all(incompleteHabitsPromises);
    const incompleteHabits = incompleteHabitsResults
      .filter(result => !result.isComplete)
      .map(result => result.habit);

    if (incompleteHabits.length > 0) {
      const urgentHabitsPromises = incompleteHabits.map(async (habit) => {
        const streak = await HabitDataService.getStreakForHabit(habit.id);
        return { habit, streak };
      });
      
      const urgentHabitsResults = await Promise.all(urgentHabitsPromises);
      const urgentHabits = urgentHabitsResults
        .filter(result => result.streak > 7)
        .map(result => result.habit);

      if (urgentHabits.length > 0) {
        suggestions.push({
          title: "Streak Protection",
          description: `Don't break your ${urgentHabits[0].name} streak! Complete it now.`,
          action: "Complete Habit",
          icon: "🔥",
          color: "bg-red-50 border-red-200 text-red-700",
          priority: "high",
          relevanceScore: 100,
          category: "productivity",
          estimatedDuration: "varies"
        });
      } else {
        suggestions.push({
          title: "Daily Habits Check",
          description: `${incompleteHabits.length} habit${incompleteHabits.length > 1 ? 's' : ''} remaining for today`,
          action: "View Habits",
          icon: "✅",
          color: "bg-green-50 border-green-200 text-green-700",
          priority: "medium",
          relevanceScore: 60,
          category: "productivity",
          estimatedDuration: "varies"
        });
      }
    }

    // Learning and growth suggestions
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
      suggestions.push({
        title: "Daily Learning Goal",
        description: "Spend 15 minutes learning something new to grow your skills",
        action: "Browse Learning Content",
        icon: "📚",
        color: "bg-emerald-50 border-emerald-200 text-emerald-700",
        priority: "low",
        relevanceScore: 40,
        category: "learning",
        estimatedDuration: "15 minutes"
      });
    }

    // Social and connection suggestions
    if (timeOfDay >= 17) {
      suggestions.push({
        title: "Social Connection",
        description: "Reach out to a friend or family member you haven't talked to recently",
        action: "Send a Message",
        icon: "💌",
        color: "bg-rose-50 border-rose-200 text-rose-700",
        priority: "low",
        relevanceScore: 35,
        category: "social",
        estimatedDuration: "5-10 minutes"
      });
    }

    // Weather-based suggestions (mock data)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && timeOfDay >= 10 && timeOfDay < 16) {
      suggestions.push({
        title: "Weekend Outdoor Activity",
        description: "Take advantage of the weekend and get some fresh air",
        action: "Plan Outdoor Time",
        icon: "🌞",
        color: "bg-sky-50 border-sky-200 text-sky-700",
        priority: "low",
        relevanceScore: 45,
        category: "wellness",
        estimatedDuration: "30+ minutes"
      });
    }

    return suggestions
      .sort((a, b) => {
        // First sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by relevance score
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, 8); // Limit to 8 suggestions
  }

  // Get curated content based on current context
  static async getCuratedContent(mood: string, interests: string[] = []) {
    const timeOfDay = new Date().getHours();
    
    return {
      videos: this.getVideoRecommendations(mood, timeOfDay, interests),
      music: this.getMusicPlaylists(mood, timeOfDay),
      activities: await this.getActivitySuggestions(),
      moodBasedTips: this.getMoodBasedTips(mood),
      weeklyGoals: await this.getWeeklyGoals()
    };
  }

  // Mood-specific tips and advice
  private static getMoodBasedTips(mood: string): string[] {
    const tips = {
      happy: [
        "Use this positive energy to tackle challenging tasks",
        "Share your good mood - encourage a colleague or friend",
        "Set an ambitious but achievable goal for today"
      ],
      focused: [
        "This is perfect timing for deep work - minimize distractions",
        "Work on your most important task while you're in flow",
        "Set a longer focus session to maximize this mental state"
      ],
      stressed: [
        "Take 5 deep breaths before continuing with your day",
        "Break large tasks into smaller, manageable steps",
        "Consider what you can delegate or postpone"
      ],
      tired: [
        "Honor your body's need for rest - consider a short break",
        "Stay hydrated and consider a healthy snack",
        "Do some gentle movement to boost energy naturally"
      ],
      neutral: [
        "Perfect time to review and organize your priorities",
        "Use this steady state to build consistent habits",
        "Check in with your weekly and monthly goals"
      ]
    };

    return tips[mood] || tips.neutral;
  }

  // Weekly goal suggestions
  private static getWeeklyGoals(): string[] {
    const focusStats = FocusDataService.getStats();
    const habitStats = HabitDataService.getHabitStats();
    
    const goals = [];
    
    if (focusStats.totalSessions < 20) {
      goals.push("Complete 20 focus sessions this week");
    }
    
    if (habitStats.completionRate < 80) {
      goals.push("Achieve 80% habit completion rate");
    }
    
    goals.push("Try one new productivity technique");
    goals.push("Spend 2 hours learning a new skill");
    goals.push("Practice mindfulness for 10 minutes daily");
    
    return goals.slice(0, 3);
  }
}
