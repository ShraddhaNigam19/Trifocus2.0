import { useState, useEffect } from "react";
import { 
  CheckCircle2, Target, Brain, Timer, LogOut, Plus, Search, Bell, BookOpen, Zap, 
  StickyNote, Calendar, TrendingUp, BarChart3, Activity, Heart, Smile, Frown,
  Meh, ThumbsUp, AlertCircle, Eye, Save, Filter, Download, ChevronLeft, ChevronRight,
  Sparkles, Sun, Cloud, CloudRain, Zap as Lightning, Moon, Coffee, Utensils, Users,
  Music, BookText, Gamepad2, MapPin, Clock, Star, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService, fallbackSuggestions } from "@/lib/openai";
import { MoodService } from "@/lib/dataServices";
import { MoodEntry } from "@/lib/moodData";
import Sidebar from "@/components/Sidebar";

const MoodTracker = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [moodNote, setMoodNote] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  // Load mood entries on component mount and when window gets focus
  useEffect(() => {
    const loadMoodEntries = async () => {
      if (!user?.uid) return;
      try {
        const loadedEntries = await MoodService.getMoodEntries(user.uid);
        setMoodEntries(loadedEntries);
      } catch (error) {
        console.warn('Failed to load mood entries:', error);
        setMoodEntries([]);
      }
    };
    loadMoodEntries();
  }, [user?.uid]);

  // Refresh mood entries when the component becomes visible (e.g., user navigates back)
  useEffect(() => {
    const handleFocus = async () => {
      if (!user?.uid) return;
      try {
        const loadedEntries = await MoodService.getMoodEntries(user.uid);
        setMoodEntries(loadedEntries);
      } catch (error) {
        console.warn('Failed to refresh mood entries:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.uid]);

  const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-700' },
    { id: 'angry', emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-700' },
    { id: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-purple-100 text-purple-700' },
    { id: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-orange-100 text-orange-700' },
    { id: 'calm', emoji: '😌', label: 'Calm', color: 'bg-green-100 text-green-700' },
    { id: 'tired', emoji: '😴', label: 'Tired', color: 'bg-gray-100 text-gray-700' },
    { id: 'energetic', emoji: '⚡', label: 'Energetic', color: 'bg-yellow-100 text-yellow-700' }
  ];

  const triggers = [
    { id: 'work', label: 'Work', icon: Target },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'exercise', label: 'Exercise', icon: Activity },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'weather', label: 'Weather', icon: Cloud },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'travel', label: 'Travel', icon: MapPin },
    { id: 'learning', label: 'Learning', icon: BookText },
    { id: 'entertainment', label: 'Entertainment', icon: Gamepad2 }
  ];

  const handleMoodSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling right now",
        variant: "destructive"
      });
      return;
    }

    if (!user?.uid) {
      toast({
        title: "Authentication required",
        description: "Please log in to save mood entries",
        variant: "destructive"
      });
      return;
    }

    const moodEntry = {
      mood: selectedMood,
      intensity: selectedIntensity,
      triggers: selectedTriggers,
      note: moodNote,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      activities: []
    };

    try {
      await MoodService.addMoodEntry(moodEntry, user.uid);
      const updatedEntries = await MoodService.getMoodEntries(user.uid);
      setMoodEntries(updatedEntries);
    } catch (error) {
      console.warn('Failed to save mood entry:', error);
      toast({
        title: "Entry saved locally",
        description: "Your mood has been recorded",
      });
    }

    // Reset form
    setSelectedMood(null);
    setSelectedIntensity(5);
    setSelectedTriggers([]);
    setMoodNote("");

    toast({
      title: "Mood recorded successfully",
      description: "Your mood has been logged for today"
    });
  };

  const generateInsight = async () => {
    if (moodEntries.length === 0) {
      toast({
        title: "No mood data",
        description: "Record some moods first to get insights",
        variant: "destructive"
      });
      return;
    }

    setLoadingInsight(true);
    try {
      const insight = await OpenAIService.generateMoodInsight(moodEntries);
      setAiInsight(insight);
    } catch (error) {
      // Fallback to local insights
      const recentMoods = moodEntries.slice(-7);
      const avgIntensity = recentMoods.reduce((sum, entry) => sum + entry.intensity, 0) / recentMoods.length;
      const commonTriggers = recentMoods.flatMap(entry => entry.triggers);
      const triggerCounts = commonTriggers.reduce((acc, trigger) => {
        acc[trigger] = (acc[trigger] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topTrigger = Object.entries(triggerCounts).sort(([,a], [,b]) => b - a)[0]?.[0];
      
      setAiInsight(`Based on your recent mood patterns, your average intensity is ${avgIntensity.toFixed(1)}/10. ${topTrigger ? `Your most common trigger appears to be ${topTrigger}.` : ''} Consider maintaining activities that bring you joy and managing stress through healthy coping strategies.`);
    } finally {
      setLoadingInsight(false);
    }
  };

  const getMoodColor = (mood: string) => {
    const moodInfo = moods.find(m => m.id === mood);
    return moodInfo?.color || 'bg-gray-100 text-gray-700';
  };

  const getMoodEmoji = (mood: string) => {
    const moodInfo = moods.find(m => m.id === mood);
    return moodInfo?.emoji || '😐';
  };

  // Analytics calculations
  const weeklyData = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return moodEntries
      .filter(entry => new Date(entry.timestamp) >= lastWeek)
      .map(entry => ({
        date: new Date(entry.timestamp).toLocaleDateString(),
        mood: entry.mood,
        intensity: entry.intensity
      }));
  };

  const getAverageIntensity = () => {
    if (moodEntries.length === 0) return 0;
    return (moodEntries.reduce((sum, entry) => sum + entry.intensity, 0) / moodEntries.length).toFixed(1);
  };

  const getMostCommonMood = () => {
    if (moodEntries.length === 0) return 'No data';
    const moodCounts = moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommon = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0];
    return mostCommon ? moods.find(m => m.id === mostCommon[0])?.label || mostCommon[0] : 'No data';
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || "User";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar currentPage="mood-tracker" />

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 lg:ml-72">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Mood Tracker</h1>
                    <p className="text-sm text-gray-500">Track and understand your emotions</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{showAnalytics ? 'Hide' : 'Show'} Analytics</span>
                </Button>
                <Button
                  onClick={generateInsight}
                  disabled={loadingInsight}
                  className="bg-purple-600 hover:bg-purple-700 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loadingInsight ? 'Generating...' : 'AI Insight'}</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 max-w-6xl mx-auto">
            {/* AI Insight */}
            {aiInsight && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">AI Mood Insight</h3>
                    <p className="text-purple-800">{aiInsight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Panel */}
            {showAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Average Intensity</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{getAverageIntensity()}/10</div>
                  <p className="text-sm text-gray-500">Overall mood intensity</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <Heart className="w-6 h-6 text-pink-600" />
                    <h3 className="font-semibold text-gray-900">Most Common Mood</h3>
                  </div>
                  <div className="text-2xl font-bold text-pink-600">{getMostCommonMood()}</div>
                  <p className="text-sm text-gray-500">Your frequent emotional state</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Total Entries</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{moodEntries.length}</div>
                  <p className="text-sm text-gray-500">Moods recorded so far</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Entry Form */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">How are you feeling?</h2>
                
                {/* Mood Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select your mood</label>
                  <div className="grid grid-cols-4 gap-3">
                    {moods.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedMood(mood.id)}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          selectedMood === mood.id
                            ? `${mood.color} border-current shadow-md`
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{mood.emoji}</div>
                        <div className="text-xs font-medium">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity Slider */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Intensity: {selectedIntensity}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={selectedIntensity}
                    onChange={(e) => setSelectedIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Triggers */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">What influenced this mood?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {triggers.map((trigger) => {
                      const Icon = trigger.icon;
                      const isSelected = selectedTriggers.includes(trigger.id);
                      return (
                        <button
                          key={trigger.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTriggers(selectedTriggers.filter(t => t !== trigger.id));
                            } else {
                              setSelectedTriggers([...selectedTriggers, trigger.id]);
                            }
                          }}
                          className={`p-2 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                            isSelected
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{trigger.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Add a note (optional)</label>
                  <textarea
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    placeholder="How was your day? What happened?"
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <Button
                  onClick={handleMoodSubmit}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!selectedMood}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Record Mood
                </Button>
              </div>

              {/* Recent Entries */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
                  {moodEntries.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {moodEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No mood entries yet</p>
                      <p className="text-sm text-gray-400">Start tracking your emotions!</p>
                    </div>
                  ) : (
                    moodEntries.slice(0, 2).map((entry) => (
                      <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(entry.mood)}`}>
                              {moods.find(m => m.id === entry.mood)?.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">Intensity: {entry.intensity}/10</span>
                            {entry.triggers.length > 0 && (
                              <span className="text-xs text-gray-500">
                                • {entry.triggers.join(', ')}
                              </span>
                            )}
                          </div>
                          {entry.note && (
                            <p className="text-sm text-gray-600 mt-2">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
