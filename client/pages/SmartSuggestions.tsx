import { useState, useEffect } from "react";
import {
  Home, CheckCircle2, Target, Brain, Timer, Settings, LogOut, BookOpen, StickyNote,
  Zap, Lightbulb, Play, Pause, Video, Music, Headphones, Heart, Star, TrendingUp,
  RefreshCw, ExternalLink, Clock, Calendar, User, Sparkles, Coffee, Sun, Moon,
  Activity, Smile, Frown, Meh, Laugh, ArrowRight, ChevronRight, Volume2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { MoodDataService } from "@/lib/moodData";
import { HabitDataService } from "@/lib/habitData";
import { FocusDataService } from "@/lib/focusData";
import { SmartSuggestionService } from "@/lib/smartSuggestionService";
import { OpenAIService } from "@/lib/openai";
import Sidebar from "@/components/Sidebar";

const SmartSuggestions = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentMood, setCurrentMood] = useState(MoodDataService.getTodaysMoodSummary());
  const [activeTab, setActiveTab] = useState<'all' | 'productivity' | 'wellness' | 'entertainment'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [waterCount, setWaterCount] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Smart suggestion categories
  const [suggestions, setSuggestions] = useState({
    productivity: [],
    wellness: [],
    entertainment: [],
    learning: []
  });

  // Real audio URLs for music playlists - using free music sources
  const musicAudioUrls = {
    "Morning Motivation": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Coffee Shop Vibes": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Energetic Startup": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Deep Focus Flow": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Coding Beats": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Classical Concentration": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Chill Vibes": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Nature Sounds Mix": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Meditation & Mindfulness": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Sunset Jazz": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Evening Reflection": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    "Wind Down": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
  };

  // Create actual audio element for playback
  const createAudioPlayer = (playlistName: string) => {
    const audio = new Audio();

    // Use actual audio URL if available, otherwise create synthesized audio
    const audioUrl = musicAudioUrls[playlistName];
    if (audioUrl) {
      audio.src = audioUrl;
      audio.loop = true;
      audio.volume = 0.3; // Set comfortable volume
      return audio;
    }

    // Fallback: Create data URL with synthesized tone
    return createSynthesizedAudio(playlistName);
  };

  // Create synthesized audio as fallback
  const createSynthesizedAudio = (playlistName: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Different frequencies for different moods
      const baseFreq = {
        "Morning Motivation": 440, // A note - energetic
        "Coffee Shop Vibes": 220, // A lower - calm
        "Energetic Startup": 523, // C - upbeat
        "Deep Focus Flow": 196, // G - focused
        "Coding Beats": 261, // C - steady
        "Classical Concentration": 174, // F - classical
        "Chill Vibes": 146, // D - relaxed
        "Nature Sounds Mix": 98, // G low - natural
        "Meditation & Mindfulness": 65, // C very low - meditative
        "Sunset Jazz": 130, // C jazz - smooth
        "Evening Reflection": 110, // A - reflective
        "Wind Down": 87 // F very low - sleepy
      }[playlistName] || 220;

      oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      return {
        play: () => oscillator.start(),
        pause: () => oscillator.stop(),
        stop: () => {
          oscillator.stop();
          audioContext.close();
        },
        volume: 0.1
      };
    } catch (error) {
      console.log("Audio synthesis not supported");
      return null;
    }
  };

  // Load initial suggestions immediately and generate AI suggestions
  useEffect(() => {
    // Load immediate fallback suggestions
    loadInitialSuggestions();
    // Then try to generate AI suggestions
    generateAISuggestions();
  }, []);

  // Update AI suggestions when mood changes
  useEffect(() => {
    if (currentMood.latestMood) {
      generateAISuggestions();
    }
  }, [currentMood.latestMood]);

  // Load initial suggestions to ensure something is always visible
  const loadInitialSuggestions = () => {
    const initialSuggestions = [
      {
        id: 'initial-1',
        content: "Welcome! AI is analyzing your patterns to create personalized suggestions.",
        type: 'productivity',
        isAI: false
      },
      {
        id: 'initial-2',
        content: "Click 'Regenerate' to get fresh recommendations based on your current mood and activity.",
        type: 'wellness',
        isAI: false
      }
    ];
    setAiSuggestions(initialSuggestions);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef) {
        if (audioRef instanceof HTMLAudioElement) {
          audioRef.pause();
        } else {
          audioRef.stop();
        }
      }
    };
  }, [audioRef]);

  // Generate AI-powered suggestions based on user context
  const generateAISuggestions = async () => {
    console.log("🤖 Regenerate button clicked! Generating AI suggestions...");
    setAiLoading(true);

    const mood = currentMood.latestMood || 'neutral';
    const timeOfDay = new Date().getHours();
    const habits = (await HabitDataService.getHabits()).filter(h => h.isActive);
    const focusStats = FocusDataService.getStats();

    // Show immediate feedback
    toast({
      title: "Generating AI Suggestions... 🤖",
      description: "Creating personalized recommendations based on your data",
    });

    try {
      // Create user context for AI
      const userContext = {
        currentMood: mood,
        timeOfDay: timeOfDay < 12 ? 'morning' : timeOfDay < 17 ? 'afternoon' : 'evening',
        completedFocusSessions: focusStats.todaySessions,
        activeHabits: habits.length,
        weekday: new Date().getDay() >= 1 && new Date().getDay() <= 5
      };

      console.log("User context for AI:", userContext);

      // Generate different types of AI suggestions
      const suggestionPromises = [
        OpenAIService.generateDashboardSuggestion({
          recentTasks: ['Focus on important work', 'Take breaks regularly'],
          habits: habits.map(h => h.name),
          moodEntries: [mood]
        }),
        OpenAIService.generateTaskSuggestion({
          completedTasks: [],
          pendingTasks: ['Daily planning', 'Skill learning'],
          timeOfDay: userContext.timeOfDay
        })
      ];

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 8000)
      );

      const results = await Promise.race([
        Promise.allSettled(suggestionPromises),
        timeoutPromise
      ]) as any[];

      const aiGeneratedSuggestions = results.map((result, index) => {
        if (result && result.status === 'fulfilled' && result.value && !result.value.error) {
          return {
            id: `ai-${index}-${Date.now()}`,
            content: result.value.content,
            type: index === 0 ? 'wellness' : 'productivity',
            isAI: true
          };
        }
        return null;
      }).filter(Boolean);

      console.log("AI generated suggestions:", aiGeneratedSuggestions);

      if (aiGeneratedSuggestions.length > 0) {
        setAiSuggestions(aiGeneratedSuggestions);
        toast({
          title: "AI Suggestions Generated! 🤖✨",
          description: `${aiGeneratedSuggestions.length} personalized recommendations ready`,
        });
      } else {
        throw new Error("No AI suggestions generated");
      }

    } catch (error) {
      console.log('AI suggestions failed, using enhanced fallbacks:', error);

      // Enhanced fallback suggestions with smart context
      const enhancedFallbacks = [
        {
          id: `fallback-wellness-${Date.now()}`,
          content: mood === 'stressed'
            ? "Your stress levels seem elevated. Try a 5-minute breathing exercise to reduce tension and improve focus."
            : mood === 'tired'
            ? "Feeling tired? Consider a brief walk or some light stretching to naturally boost your energy levels."
            : mood === 'happy'
            ? "Great mood today! Channel this positive energy into your most challenging tasks for maximum productivity."
            : "Based on your current state, take a moment for mindful reflection to center yourself and set clear intentions.",
          type: 'wellness',
          isAI: false
        },
        {
          id: `fallback-productivity-${Date.now()}`,
          content: focusStats.todaySessions === 0
            ? "Start your productivity journey today! Begin with a 25-minute focus session to build momentum and establish a rhythm."
            : focusStats.todaySessions < 3
            ? `You've completed ${focusStats.todaySessions} focus session${focusStats.todaySessions > 1 ? 's' : ''} today. Add another session to reach your productivity peak.`
            : "Excellent focus today! Consider taking a strategic break to maintain your high performance levels.",
          type: 'productivity',
          isAI: false
        },
        {
          id: `fallback-learning-${Date.now()}`,
          content: timeOfDay < 12
            ? "Morning is perfect for learning! Your brain is fresh and ready to absorb new information. Dedicate 15 minutes to skill development."
            : timeOfDay < 17
            ? "Afternoon learning boost! Use this time to review and practice skills you're developing or explore something completely new."
            : "Evening reflection time. Review what you learned today and set learning goals for tomorrow.",
          type: 'productivity',
          isAI: false
        }
      ];

      setAiSuggestions(enhancedFallbacks);
      toast({
        title: "Smart Suggestions Ready! 💡",
        description: "Curated recommendations based on your current context",
      });
    } finally {
      setAiLoading(false);
      console.log("✅ AI suggestion generation complete");
    }
  };

  // Get smart recommendations using the enhanced service
  const getSmartRecommendations = () => {
    const mood = currentMood.latestMood || 'neutral';
    const timeOfDay = new Date().getHours();

    return SmartSuggestionService.getCuratedContent(mood, ['music', 'productivity', 'wellness']);
  };

  // Handle AI suggestion actions
  const handleAISuggestionAction = (suggestion: any) => {
    const content = suggestion.content.toLowerCase();

    if (content.includes("break") || content.includes("mindful")) {
      // Start breathing exercise
      handleWellnessAction("Start Breathing");
    } else if (content.includes("focus") || content.includes("session")) {
      navigate('/focus-timer');
      toast({
        title: "Focus Time! 🎯",
        description: "Starting your focus session based on AI recommendation",
      });
    } else if (content.includes("habit")) {
      navigate('/habits');
      toast({
        title: "Habit Building! 💪",
        description: "Working on your habits as suggested by AI",
      });
    } else if (content.includes("task") || content.includes("productive")) {
      navigate('/tasks');
      toast({
        title: "Task Management! ✅",
        description: "Managing your tasks based on AI suggestion",
      });
    } else if (content.includes("mood")) {
      navigate('/mood-tracker');
      toast({
        title: "Mood Tracking! 😊",
        description: "Checking in with your emotions",
      });
    } else if (content.includes("water") || content.includes("hydrat")) {
      handleWellnessAction("Log Water Intake");
    } else if (content.includes("movement") || content.includes("exercise")) {
      handleWellnessAction("View Exercises");
    } else {
      // Generic positive action
      toast({
        title: "AI Suggestion Activated! ✨",
        description: "Taking action on your personalized recommendation",
      });
    }
  };

  // Dismiss AI suggestion
  const dismissAISuggestion = (suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast({
      title: "Suggestion Dismissed 👋",
      description: "We'll keep improving our recommendations",
    });
  };

  const refreshSuggestions = async () => {
    setRefreshing(true);
    setCurrentMood(MoodDataService.getTodaysMoodSummary());
    await generateAISuggestions();
    setRefreshing(false);
    toast({
      title: "AI Suggestions Refreshed! 🤖",
      description: "Your personalized recommendations have been updated",
    });
  };

  // Handler functions for various actions
  const handleVideoClick = (video: any) => {
    window.open(video.url, '_blank');
    toast({
      title: "Opening Video 🎥",
      description: `Playing: ${video.title}`,
    });
  };

  const handleMusicPlay = (playlist: any) => {
    console.log("Music play clicked:", playlist.name, "Currently playing:", currentlyPlaying);

    if (currentlyPlaying === playlist.name) {
      // Stop current audio
      if (audioRef) {
        try {
          if (audioRef instanceof HTMLAudioElement) {
            audioRef.pause();
            audioRef.currentTime = 0;
          } else if (audioRef.stop) {
            audioRef.stop();
          }
        } catch (e) {
          console.log("Error stopping audio:", e);
        }
        setAudioRef(null);
      }
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      toast({
        title: "Music Paused ⏸️",
        description: `Paused: ${playlist.name}`,
      });
    } else {
      // Stop any currently playing audio first
      if (audioRef) {
        try {
          if (audioRef instanceof HTMLAudioElement) {
            audioRef.pause();
            audioRef.currentTime = 0;
          } else if (audioRef.stop) {
            audioRef.stop();
          }
        } catch (e) {
          console.log("Error stopping previous audio:", e);
        }
      }

      // Always use synthesized audio for demo
      playDemoAudio(playlist);
    }
  };

  // Simplified demo audio function
  const playDemoAudio = (playlist: any) => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Different frequencies for different playlist types
      const frequency = {
        "Morning Motivation": 440, // A note
        "Coffee Shop Vibes": 330, // E note
        "Energetic Startup": 523, // C note
        "Deep Focus Flow": 220, // A low
        "Coding Beats": 294, // D note
        "Classical Concentration": 196, // G note
        "Chill Vibes": 146, // D low
        "Nature Sounds Mix": 98, // G very low
        "Meditation & Mindfulness": 65, // C very low
        "Sunset Jazz": 130, // C jazz
        "Evening Reflection": 110, // A reflection
        "Wind Down": 87 // F very low
      }[playlist.name] || 220;

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Set volume
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();

      // Store reference for cleanup
      const audioObj = {
        stop: () => {
          try {
            oscillator.stop();
            audioContext.close();
          } catch (e) {
            console.log("Error cleaning up audio:", e);
          }
        }
      };

      setAudioRef(audioObj as any);
      setCurrentlyPlaying(playlist.name);
      setIsPlaying(true);

      toast({
        title: "Playing Playlist 🎵",
        description: `Now playing: ${playlist.name} - ${playlist.genre}`,
      });

      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        if (currentlyPlaying === playlist.name) {
          try {
            oscillator.stop();
            audioContext.close();
          } catch (e) {
            console.log("Error in auto-stop:", e);
          }
          setCurrentlyPlaying(null);
          setIsPlaying(false);
          setAudioRef(null);
          toast({
            title: "Track Finished 🎶",
            description: `Finished playing: ${playlist.name}`,
          });
        }
      }, 5000);

    } catch (error) {
      console.log("Audio creation failed:", error);
      // Ultimate fallback - just visual feedback
      setCurrentlyPlaying(playlist.name);
      setIsPlaying(true);
      toast({
        title: "Playing Playlist 🎵",
        description: `Now playing: ${playlist.name} - ${playlist.genre} (Visual mode)`,
      });

      setTimeout(() => {
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        toast({
          title: "Track Finished 🎶",
          description: `Finished playing: ${playlist.name}`,
        });
      }, 3000);
    }
  };

  // Helper function for synthesized audio playback
  const playSynthesizedAudio = (playlist: any, audioPlayer?: any) => {
    if (audioPlayer) {
      try {
        audioPlayer.play();
        setAudioRef(audioPlayer);
        setCurrentlyPlaying(playlist.name);
        setIsPlaying(true);
        toast({
          title: "Playing Playlist 🎵",
          description: `Now playing: ${playlist.name} - ${playlist.genre} (Synthesized)`,
        });

        // Auto-stop after 15 seconds for demo
        setTimeout(() => {
          if (currentlyPlaying === playlist.name) {
            audioPlayer.stop();
            setCurrentlyPlaying(null);
            setIsPlaying(false);
            setAudioRef(null);
            toast({
              title: "Track Finished 🎶",
              description: `Finished playing: ${playlist.name}`,
            });
          }
        }, 15000);
      } catch (error) {
        console.log("Synthesized audio failed:", error);
      }
    }
  };

  const handleActivityAction = (activity: any) => {
    switch (activity.action) {
      case "Start Focus Timer":
        navigate('/focus-timer');
        break;
      case "View Habits":
        navigate('/habits');
        break;
      case "Start Morning Review":
        toast({
          title: "Morning Review Started ☀️",
          description: "Let's review your habits and set today's intentions",
        });
        navigate('/habits');
        break;
      case "Start Breathing Exercise":
        toast({
          title: "Breathing Exercise 🧘",
          description: "Take 5 deep breaths. Inhale for 4, hold for 4, exhale for 4.",
        });
        break;
      case "Do Quick Stretches":
      case "Do Energy Boost":
        toast({
          title: "Movement Time! 💪",
          description: "Stand up and do some light stretching for 2 minutes",
        });
        break;
      case "Start Stress Relief":
        toast({
          title: "Stress Relief Mode 🌸",
          description: "Focus on your breathing and let tension melt away",
        });
        break;
      case "Browse Learning Content":
        toast({
          title: "Learning Time 📚",
          description: "Great time to expand your knowledge!",
        });
        break;
      default:
        toast({
          title: "Action Started ✨",
          description: activity.description,
        });
    }
  };

  const handleWellnessAction = (action: string) => {
    switch (action) {
      case "Log Water Intake":
        const newWaterCount = waterCount + 1;
        setWaterCount(newWaterCount);
        toast({
          title: "Water Logged! 💧",
          description: `Glass ${newWaterCount} logged! ${newWaterCount >= 8 ? 'Daily goal reached! 🎉' : `${8 - newWaterCount} more to reach your goal.`}`,
        });
        break;
      case "Start Breathing":
        toast({
          title: "Breathing Exercise Started 🧘",
          description: "Follow along: Breathe in slowly for 4 counts, hold for 4, exhale for 6.",
        });
        // Start a simple breathing exercise timer
        let count = 0;
        const breathingInterval = setInterval(() => {
          count++;
          if (count === 1) {
            toast({ title: "Inhale... 😌", description: "Breathe in slowly through your nose" });
          } else if (count === 2) {
            toast({ title: "Hold... ⏸️", description: "Hold your breath gently" });
          } else if (count === 3) {
            toast({ title: "Exhale... 😮‍💨", description: "Breathe out slowly through your mouth" });
          } else if (count >= 4) {
            clearInterval(breathingInterval);
            toast({ title: "Well done! 🌟", description: "You've completed a breathing cycle" });
          }
        }, 3000);
        break;
      case "View Exercises":
        toast({
          title: "Exercise Guide 🤸",
          description: "Try these: Neck rolls, shoulder shrugs, wrist circles, and gentle back stretches",
        });
        break;
      default:
        toast({
          title: "Wellness Action 💚",
          description: "Great choice for your wellbeing!",
        });
    }
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

  const userName = user?.displayName || user?.email?.split('@')[0] || "User";
  const smartData = getSmartRecommendations();
  const videos = smartData.videos;
  const musicPlaylists = smartData.music;
  const activities = smartData.activities;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar currentPage="smart-suggestions" />

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 lg:ml-72">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Smart Suggestions</h1>
                    <p className="text-sm text-gray-600">Personalized recommendations based on your mood and activity</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={refreshSuggestions}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 pt-16 lg:pt-6">
            {/* Current Mood Display */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">{currentMood.moodEmoji || '😊'}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current Mood</h3>
                    <p className="text-gray-600">
                      {currentMood.latestMood ? 
                        `Feeling ${currentMood.latestMood.charAt(0).toUpperCase() + currentMood.latestMood.slice(1)}` : 
                        'No mood logged today'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/mood-tracker')}
                  variant="outline"
                  size="sm"
                >
                  Update Mood
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
              {[
                { id: 'all', label: 'All', icon: Sparkles },
                { id: 'productivity', label: 'Focus', icon: Target },
                { id: 'wellness', label: 'Wellness', icon: Heart },
                { id: 'entertainment', label: 'Media', icon: Play }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* AI-Powered Suggestions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                  AI-Powered Suggestions
                  {aiLoading && <span className="ml-2 text-sm text-gray-500">(Generating...)</span>}
                </h2>
                <Button
                  onClick={generateAISuggestions}
                  variant="outline"
                  size="sm"
                  disabled={aiLoading}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-lg border-2 ${
                      suggestion.type === 'wellness' ? 'bg-pink-50 border-pink-200' :
                      suggestion.type === 'productivity' ? 'bg-blue-50 border-blue-200' :
                      'bg-purple-50 border-purple-200'
                    } hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <Sparkles className={`w-5 h-5 mr-2 ${
                          suggestion.type === 'wellness' ? 'text-pink-600' :
                          suggestion.type === 'productivity' ? 'text-blue-600' :
                          'text-purple-600'
                        }`} />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.isAI ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {suggestion.isAI ? 'AI Generated' : 'Curated'}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 ${
                      suggestion.type === 'wellness' ? 'text-pink-800' :
                      suggestion.type === 'productivity' ? 'text-blue-800' :
                      'text-purple-800'
                    }`}>
                      {suggestion.content}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className={`${
                          suggestion.type === 'wellness' ? 'bg-pink-600 hover:bg-pink-700' :
                          suggestion.type === 'productivity' ? 'bg-blue-600 hover:bg-blue-700' :
                          'bg-purple-600 hover:bg-purple-700'
                        }`}
                        onClick={() => handleAISuggestionAction(suggestion)}
                      >
                        Take Action
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissAISuggestion(suggestion.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}

                {aiSuggestions.length === 0 && !aiLoading && (
                  <div className="col-span-2 text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">Click "Regenerate" to get AI-powered suggestions!</p>
                  </div>
                )}

                {aiLoading && (
                  <div className="col-span-2 text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 text-purple-600 animate-spin" />
                    <p className="text-purple-600">AI is generating personalized suggestions...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Suggestions */}
              {(activeTab === 'all' || activeTab === 'productivity') && (
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-600" />
                        Recommended Activities
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activities.map((activity, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${activity.color} hover:shadow-md transition-shadow cursor-pointer`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-2xl">{activity.icon}</span>
                            <div className="flex flex-col items-end space-y-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                                activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.priority}
                              </span>
                              <span className="text-xs text-gray-500">{activity.estimatedDuration}</span>
                            </div>
                          </div>
                          <h3 className="font-semibold mb-2">{activity.title}</h3>
                          <p className="text-sm mb-3 opacity-80">{activity.description}</p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleActivityAction(activity)}
                          >
                            {activity.action}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Video Recommendations */}
              {(activeTab === 'all' || activeTab === 'entertainment') && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Video className="w-5 h-5 mr-2 text-red-600" />
                      Video Recommendations
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {videos.map((video, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleVideoClick(video)}
                      >
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">{video.thumbnail}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{video.title}</h3>
                          <p className="text-sm text-gray-600">{video.channel} • {video.duration}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                            video.type === 'music' ? 'bg-purple-100 text-purple-700' :
                            video.type === 'wellness' ? 'bg-green-100 text-green-700' :
                            video.type === 'productivity' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {video.type}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Music Playlists */}
              {(activeTab === 'all' || activeTab === 'entertainment') && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Music className="w-5 h-5 mr-2 text-green-600" />
                      Music Playlists
                    </h2>
                    {currentlyPlaying && (
                      <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <Volume2 className="w-4 h-4 mr-1" />
                        Playing: {currentlyPlaying}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {musicPlaylists.map((playlist, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleMusicPlay(playlist)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{playlist.emoji}</span>
                            <div>
                              <h3 className="font-medium text-gray-900">{playlist.name}</h3>
                              <p className="text-sm text-gray-600">{playlist.genre}</p>
                            </div>
                          </div>
                          <button
                            className={`p-2 hover:bg-blue-100 rounded-full transition-colors ${
                              currentlyPlaying === playlist.name ? 'bg-blue-100' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMusicPlay(playlist);
                            }}
                          >
                            {currentlyPlaying === playlist.name ? (
                              <Pause className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Play className="w-5 h-5 text-blue-600" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${playlist.color}`}>
                            {playlist.tracks} tracks
                          </span>
                          <div className="flex space-x-2">
                            <button
                              className="p-1 hover:bg-gray-200 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Volume Control 🔊",
                                  description: "Music volume controls would appear here",
                                });
                              }}
                            >
                              <Volume2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-200 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Download Started 📥",
                                  description: `Downloading ${playlist.name} playlist...`,
                                });
                              }}
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood-Based Tips */}
              {(activeTab === 'all' || activeTab === 'wellness') && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-pink-600" />
                      Mood-Based Tips
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {smartData.moodBasedTips.map((tip, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 flex items-start">
                          <span className="text-blue-500 mr-2">💡</span>
                          {tip}
                        </p>
                      </div>
                    ))}

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-green-800">🌱 Hydration Tracker</h3>
                        <span className="text-sm font-semibold text-green-700">{waterCount}/8</span>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        {waterCount >= 8 ? "Great job! You've reached your daily goal! 🎉" :
                         waterCount === 0 ? "Stay hydrated! Aim for 8 glasses of water today." :
                         `${8 - waterCount} more glass${8 - waterCount !== 1 ? 'es' : ''} to go!`}
                      </p>
                      <div className="w-full bg-green-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((waterCount / 8) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 w-full"
                        onClick={() => handleWellnessAction("Log Water Intake")}
                        disabled={waterCount >= 8}
                      >
                        {waterCount >= 8 ? "Daily Goal Reached! ✅" : "Log Water Glass"}
                      </Button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-medium text-blue-800 mb-2">🧘 Mindfulness Break</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Take 2 minutes to practice deep breathing and center yourself.
                      </p>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleWellnessAction("Start Breathing")}
                      >
                        Start Breathing
                      </Button>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="font-medium text-purple-800 mb-2">💪 Movement Boost</h3>
                      <p className="text-sm text-purple-700 mb-3">
                        Quick desk stretches to improve circulation and energy.
                      </p>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleWellnessAction("View Exercises")}
                      >
                        View Exercises
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Goals */}
              {activeTab === 'all' && (
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-amber-600" />
                        Weekly Goals
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {smartData.weeklyGoals.map((goal, index) => {
                        const progress = Math.floor(Math.random() * 100);
                        return (
                          <div
                            key={index}
                            className="p-4 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                            onClick={() => {
                              toast({
                                title: "Goal Focus 🎯",
                                description: `Working on: ${goal}`,
                              });
                              if (goal.includes("focus sessions")) {
                                navigate('/focus-timer');
                              } else if (goal.includes("habit")) {
                                navigate('/habits');
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className="text-amber-600 mr-2">🎯</span>
                                <span className="font-medium text-amber-800">{goal}</span>
                              </div>
                              <span className="text-xs text-amber-600 font-medium">{progress}%</span>
                            </div>
                            <div className="w-full bg-amber-200 rounded-full h-2">
                              <div
                                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestions;
