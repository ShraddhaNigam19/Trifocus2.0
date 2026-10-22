import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Target, Brain, Timer, LogOut, Plus, Search, Bell, BookOpen, Zap, Bold, Italic, Underline, Link, Image, Save, Edit3, Calendar, Clock, MoreHorizontal, Trash2, X, Heart, Star, Smile, Lightbulb, TrendingUp, BarChart3, ChevronLeft, ChevronRight, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService, fallbackSuggestions, LocalTextEnhancer } from "@/lib/openai";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";

const Journal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("😊");
  const [newTitle, setNewTitle] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [sentiment, setSentiment] = useState<'positive' | 'energetic' | 'calm' | 'sad' | 'angry' | 'neutral'>('neutral');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterTag, setFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date()); // Current month
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  const [writingSuggestions, setWritingSuggestions] = useState<string[]>([]);
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);
  const [lastEnhancedContent, setLastEnhancedContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [writingGoal, setWritingGoal] = useState(300); // word count goal
  const [currentMood, setCurrentMood] = useState('');
  const [weatherToday, setWeatherToday] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const [entries, setEntries] = useState([
    {
      id: 1,
      title: "Morning Gratitude",
      content: "Started my day with a beautiful sunrise and a warm cup of coffee. Feeling grateful for the simple pleasures in life.",
      emoji: "☀️",
      date: new Date().toISOString().split('T')[0],
      time: "8:30 AM",
      tags: ["gratitude", "morning"],
      color: "from-orange-400 to-pink-400"
    },
    {
      id: 2,
      title: "Evening Reflection",
      content: "Reflecting on today's experiences and feeling grateful for the lessons learned along the way.",
      emoji: "🌙",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: "9:20 PM",
      tags: ["reflection", "growth"],
      color: "from-indigo-400 to-purple-400"
    }
  ]);

  const emojis = [
    "😊", "😢", "😡", "😴", "🤔", "🎉", "🌟", "⭐", "💫", "🌙", "☀️", "🔥",
    "❤️", "💖", "💜", "💙", "💚", "💛", "🧡", "🖤", "🤍", "🤎", "💕", "💞",
    "🌈", "⭐", "✨", "💫", "🌺", "🌻", "🌼", "🌹", "🌱", "🍀", "🌿", "🌳",
    "🦋", "🐝", "🐞", "🌊", "🏔️", "🌋", "🗻", "🏜️", "🏖️", "🌅", "🌄", "🌠",
    "🍎", "🍓", "🍊", "🍋", "🍌", "🍇", "🥝", "🍒", "🍑", "🥭", "🍍", "🥥",
    "☕", "🍵", "🧊", "🍯", "🍰", "🎂", "🍪", "🍫", "🍭", "🍮", "🧁", "🥧",
    "📚", "📖", "✏️", "🖊️", "📝", "📄", "📔", "📕", "📗", "📘", "📙", "📓",
    "🎯", "🎨", "🎭", "🎪", "🎵", "🎶", "🎸", "🎹", "🎤", "🎧", "🎬"
  ];
  const colors = [
    "from-blue-400 to-purple-400",
    "from-pink-400 to-red-400",
    "from-green-400 to-blue-400",
    "from-yellow-400 to-orange-400",
    "from-purple-400 to-pink-400",
    "from-indigo-400 to-blue-400"
  ];

  const journalTemplates = [
    {
      name: "Daily Reflection",
      content: "<h3>Today's Date: " + new Date().toLocaleDateString() + "</h3><br><p><strong>How I'm feeling:</strong></p><p><br></p><p><strong>Three things I'm grateful for:</strong></p><p>1. </p><p>2. </p><p>3. </p><br><p><strong>What went well today:</strong></p><p><br></p><p><strong>What I learned:</strong></p><p><br></p><p><strong>Tomorrow I want to:</strong></p><p><br></p>"
    },
    {
      name: "Goal Planning",
      content: "<h3>Goal Setting Session</h3><br><p><strong>My main goal:</strong></p><p><br></p><p><strong>Why is this important to me:</strong></p><p><br></p><p><strong>Steps to achieve this:</strong></p><p>1. </p><p>2. </p><p>3. </p><br><p><strong>Potential challenges:</strong></p><p><br></p><p><strong>How I'll overcome them:</strong></p><p><br></p>"
    },
    {
      name: "Gratitude Practice",
      content: "<h3>Gratitude Journal - " + new Date().toLocaleDateString() + "</h3><br><p><strong>I am grateful for:</strong></p><p><br></p><p><strong>Someone who made me smile today:</strong></p><p><br></p><p><strong>A simple pleasure I enjoyed:</strong></p><p><br></p><p><strong>Something about myself I appreciate:</strong></p><p><br></p><p><strong>A lesson I learned recently:</strong></p><p><br></p>"
    },
    {
      name: "Creative Writing",
      content: "<h3>Creative Exploration</h3><br><p><strong>If I could travel anywhere right now, I would go to...</strong></p><p><br></p><p><strong>A story that starts with 'The door creaked open and I saw...'</strong></p><p><br></p><p><strong>Describe your perfect day from start to finish:</strong></p><p><br></p><p><strong>What would you tell your younger self:</strong></p><p><br></p>"
    },
    {
      name: "Problem Solving",
      content: "<h3>Working Through Challenges</h3><br><p><strong>Current challenge I'm facing:</strong></p><p><br></p><p><strong>How this makes me feel:</strong></p><p><br></p><p><strong>Different perspectives on this situation:</strong></p><p><br></p><p><strong>Possible solutions:</strong></p><p>1. </p><p>2. </p><p>3. </p><br><p><strong>Next action I'll take:</strong></p><p><br></p>"
    }
  ];

  const moodOptions = [
    { emoji: "😊", label: "Happy", color: "bg-yellow-100 text-yellow-700" },
    { emoji: "😌", label: "Peaceful", color: "bg-green-100 text-green-700" },
    { emoji: "😴", label: "Tired", color: "bg-gray-100 text-gray-700" },
    { emoji: "😢", label: "Sad", color: "bg-blue-100 text-blue-700" },
    { emoji: "😠", label: "Frustrated", color: "bg-red-100 text-red-700" },
    { emoji: "🤔", label: "Thoughtful", color: "bg-purple-100 text-purple-700" },
    { emoji: "🥳", label: "Excited", color: "bg-orange-100 text-orange-700" },
    { emoji: "😰", label: "Anxious", color: "bg-pink-100 text-pink-700" }
  ];

  const weatherOptions = ["☀️ Sunny", "☁️ Cloudy", "🌧️ Rainy", "❄️ Snowy", "🌩️ Stormy", "🌫️ Foggy", "🌈 Clear"];

  const userName = user?.displayName || user?.email?.split('@')[0] || "User";

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

  const updateWordCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      setWordCount(text.split(/\s+/).filter(word => word.length > 0).length);
    }
  };

  useEffect(() => {
    updateWordCount();
  }, []);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      setCurrentTags([...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  const generateAISuggestion = async () => {
    setShowAIAssistant(true);
    try {
      const currentContent = editorRef.current?.innerText || '';
      const context = {
        title: newTitle,
        content: currentContent,
        tags: currentTags,
        recentEntries: entries.slice(0, 2).map(e => ({ title: e.title, content: e.content }))
      };
      
      const suggestion = await OpenAIService.generateJournalSuggestion(context);
      setAiSuggestion(suggestion);
    } catch (error) {
      const fallback = fallbackSuggestions.journal[Math.floor(Math.random() * fallbackSuggestions.journal.length)];
      setAiSuggestion(fallback);
    }
  };

  const enhanceWithAI = async () => {
    if (!editorRef.current) return;
    
    const currentContent = editorRef.current.innerText;
    if (!currentContent.trim()) {
      toast({
        title: "No content to enhance",
        description: "Please write some content first",
        variant: "destructive"
      });
      return;
    }

    setIsAIEnhancing(true);
    try {
      const enhanced = await OpenAIService.enhanceJournalEntry(currentContent);
      setLastEnhancedContent(currentContent);
      editorRef.current.innerHTML = enhanced;
      updateWordCount();
      toast({
        title: "Content enhanced!",
        description: "Your journal entry has been improved with AI"
      });
    } catch (error) {
      // Fallback to local enhancement
      const enhanced = LocalTextEnhancer.enhanceText(currentContent);
      setLastEnhancedContent(currentContent);
      editorRef.current.innerHTML = enhanced;
      updateWordCount();
      toast({
        title: "Content enhanced!",
        description: "Your journal entry has been improved"
      });
    } finally {
      setIsAIEnhancing(false);
    }
  };

  const generateWritingPrompts = async () => {
    setShowWritingAssistant(true);
    try {
      const prompts = await OpenAIService.generateWritingPrompts({
        mood: sentiment,
        recentTopics: entries.slice(0, 5).flatMap(e => e.tags),
        timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
      });
      setWritingSuggestions(prompts);
    } catch (error) {
      const fallbackPrompts = [
        "What are three things you're grateful for today?",
        "Describe a moment that made you smile recently.",
        "What challenge are you facing and how might you overcome it?",
        "What would you tell your past self from a year ago?",
        "What are you looking forward to most this week?"
      ];
      setWritingSuggestions(fallbackPrompts);
    }
  };

  const applyWritingPrompt = (prompt: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = `<p><strong>Prompt:</strong> ${prompt}</p><p><br></p><p>Your thoughts:</p><p><br></p>`;
      editorRef.current.focus();
      updateWordCount();
    }
    setShowWritingAssistant(false);
  };

  const applyTemplate = (template: any) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content;
      setNewTitle(template.name + " - " + new Date().toLocaleDateString());
      updateWordCount();
      editorRef.current.focus();
    }
    setShowTemplates(false);
  };

  const getWritingProgress = () => {
    return Math.min((wordCount / writingGoal) * 100, 100);
  };

  const getStreakDays = () => {
    // Calculate writing streak based on consecutive days with entries
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasEntry = entries.some(entry => entry.date === dateStr);
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break; // Break streak if no entry found (except for today)
      }
    }
    return streak;
  };

  const createEntry = () => {
    if (!newTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your journal entry",
        variant: "destructive"
      });
      return;
    }

    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<p><br></p>') {
      toast({
        title: "Content required",
        description: "Please write some content for your journal entry",
        variant: "destructive"
      });
      return;
    }

    const newEntry = {
      id: editingId || Date.now(),
      title: newTitle,
      content: editorRef.current?.innerHTML || '',
      emoji: selectedEmoji,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tags: currentTags,
      color: colors[Math.floor(Math.random() * colors.length)],
      mood: currentMood,
      weather: weatherToday,
      wordCount: wordCount
    };

    if (editingId) {
      setEntries(entries.map(entry => entry.id === editingId ? newEntry : entry));
      toast({
        title: "Entry updated",
        description: "Your journal entry has been updated successfully"
      });
    } else {
      setEntries([newEntry, ...entries]);
      toast({
        title: "Entry created",
        description: "Your journal entry has been saved successfully"
      });
    }

    // Reset form
    setNewTitle('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setCurrentTags([]);
    setSelectedEmoji('😊');
    setIsCreating(false);
    setEditingId(null);
    setWordCount(0);
  };

  const editEntry = (entry: any) => {
    setEditingId(entry.id);
    setNewTitle(entry.title);
    setCurrentTags(entry.tags);
    setSelectedEmoji(entry.emoji);
    setIsCreating(true);
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = entry.content;
        updateWordCount();
      }
      if (titleRef.current) {
        titleRef.current.focus();
      }
    }, 100);
  };

  const deleteEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id));
    toast({
      title: "Entry deleted",
      description: "Journal entry has been removed"
    });
  };

  const detectSentiment = (text: string) => {
    const positiveWords = ['happy', 'joy', 'excited', 'grateful', 'amazing', 'wonderful', 'great', 'love', 'fantastic'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'tired', 'stressed', 'worried', 'difficult', 'hard'];
    const energeticWords = ['energy', 'motivated', 'pumped', 'enthusiastic', 'dynamic'];
    const calmWords = ['peaceful', 'calm', 'serene', 'relaxed', 'quiet', 'still'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0, negativeCount = 0, energeticCount = 0, calmCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      if (energeticWords.some(ew => word.includes(ew))) energeticCount++;
      if (calmWords.some(cw => word.includes(cw))) calmCount++;
    });

    if (energeticCount > 0) return 'energetic';
    if (calmCount > 0) return 'calm';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return negativeCount > 2 ? 'angry' : 'sad';
    return 'neutral';
  };

  const handleContentChange = () => {
    updateWordCount();
    const text = editorRef.current?.innerText || '';
    setSentiment(detectSentiment(text));
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === '' || entry.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(entries.flatMap(entry => entry.tags))];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'energetic': return 'text-orange-600';
      case 'calm': return 'text-blue-600';
      case 'sad': return 'text-blue-800';
      case 'angry': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEntriesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.filter(entry => entry.date === dateStr);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <Sidebar currentPage="journal" />

        {/* Main Content */}
        <div className="flex-1 ml-72 min-h-screen">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Journal</h1>
                    <p className="text-sm text-gray-500">Capture your thoughts and experiences</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <div className="w-4 h-4 bg-current rounded-sm"></div>
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-orange-600">🔥 {getStreakDays()} day streak</span>
                      <span>•</span>
                      <span>{entries.length} entries</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setIsCreating(true);
                      setEditingId(null);
                      setNewTitle('');
                      setCurrentTags([]);
                      setSelectedEmoji('😊');
                      if (editorRef.current) editorRef.current.innerHTML = '';
                      setWordCount(0);
                      setCurrentMood('');
                      setWeatherToday('');
                    }}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Entry
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 max-w-6xl mx-auto">
            {/* Filter Tags */}
            {allTags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterTag('')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filterTag === '' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filterTag === tag ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Journal Entries */}
            {viewMode === 'list' ? (
              <div className="space-y-6">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || filterTag ? "No entries match your filter criteria." : "Start writing your first journal entry to capture your thoughts and experiences."}
                    </p>
                    {!searchQuery && !filterTag && (
                      <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Entry
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <div key={entry.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 bg-gradient-to-r ${entry.color} rounded-lg flex items-center justify-center text-2xl shadow-sm`}>
                            {entry.emoji}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{entry.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{entry.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editEntry(entry)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="prose prose-sm max-w-none mb-4" dangerouslySetInnerHTML={{ __html: entry.content }} />

                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag, index) => (
                            <span
                              key={`${entry.id}-${tag}-${index}`}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Calendar View */
              <div className="space-y-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {formatMonthYear(currentDate)}
                    </h2>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentDate).map((day, index) => {
                      if (!day) {
                        return <div key={index} className="p-3 h-20"></div>;
                      }

                      const dayEntries = getEntriesForDate(day);
                      const isToday = day.toDateString() === new Date().toDateString();
                      const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                      return (
                        <div
                          key={day.toDateString()}
                          className={`p-2 min-h-24 border border-gray-200 rounded-lg transition-colors relative ${
                            isToday
                              ? 'bg-purple-50 border-purple-300'
                              : isSelected
                              ? 'bg-purple-100 border-purple-400'
                              : dayEntries.length > 0
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedDate(day)}
                            className="w-full h-full text-left flex flex-col"
                          >
                            <div className={`text-sm font-medium mb-2 flex-shrink-0 ${
                              isToday ? 'text-purple-700' : 'text-gray-900'
                            }`}>
                              {day.getDate()}
                            </div>
                            <div className="flex-1 space-y-1 overflow-hidden">
                              {dayEntries.slice(0, 2).map(entry => (
                                <div
                                  key={entry.id}
                                  className="text-xs px-1.5 py-1 rounded bg-white/90 border border-gray-200 shadow-sm"
                                  title={entry.title}
                                >
                                  <div className="flex items-center space-x-1 w-full">
                                    <span className="flex-shrink-0 text-sm">{entry.emoji}</span>
                                    <span className="truncate text-xs font-medium text-gray-700 leading-tight">
                                      {entry.title.length > 12 ? entry.title.substring(0, 12) + '...' : entry.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {dayEntries.length > 2 && (
                                <div className="text-xs text-gray-500 font-medium px-1.5">
                                  +{dayEntries.length - 2} more
                                </div>
                              )}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <Button
                        onClick={() => {
                          setIsCreating(true);
                          setEditingId(null);
                          setNewTitle('');
                          setCurrentTags([]);
                          setSelectedEmoji('😊');
                          if (editorRef.current) editorRef.current.innerHTML = '';
                          setWordCount(0);
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Entry
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {getEntriesForDate(selectedDate).map(entry => (
                        <div key={entry.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 bg-gradient-to-r ${entry.color} rounded-lg flex items-center justify-center text-xl`}>
                                {entry.emoji}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{entry.title}</h4>
                                <p className="text-sm text-gray-500">{entry.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => editEntry(entry)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Edit3 className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                          <div className="prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: entry.content }} />
                          {entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {entry.tags.map((tag, index) => (
                                <span
                                  key={`${entry.id}-${tag}-${index}`}
                                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {getEntriesForDate(selectedDate).length === 0 && (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 mb-4">No entries for this date</p>
                          <Button
                            onClick={() => {
                              setIsCreating(true);
                              setEditingId(null);
                              setNewTitle('');
                              setCurrentTags([]);
                              setSelectedEmoji('😊');
                              if (editorRef.current) editorRef.current.innerHTML = '';
                              setWordCount(0);
                            }}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Entry for This Date
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen min-h-[100dvh] bg-gray-50">

        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-4 pb-6" style={{paddingTop: 'max(60px, env(safe-area-inset-top) + 20px)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg leading-tight">Journal</h1>
                <p className="text-pink-100 text-sm">Capture your thoughts</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
                setNewTitle('');
                setCurrentTags([]);
                setSelectedEmoji('😊');
                if (editorRef.current) editorRef.current.innerHTML = '';
                setWordCount(0);
                setCurrentMood('');
                setWeatherToday('');
              }}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="px-4 pb-6 bg-gradient-to-r from-pink-600 to-purple-600">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{getStreakDays()}</div>
                <div className="text-pink-100 text-sm">Day Streak 🔥</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{entries.length}</div>
                <div className="text-pink-100 text-sm">Total Entries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 pt-6 pb-48 space-y-6">
          {/* Mobile Search */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search your entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Mobile Journal Entries */}
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
                <p className="text-gray-500 mb-6 px-4">
                  {searchQuery || filterTag ? "No entries match your filter." : "Start writing your first journal entry."}
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Write First Entry
                </button>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${entry.color} rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                      {entry.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-2 leading-tight">{entry.title}</h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          <span className="whitespace-nowrap">{entry.date}</span>
                        </div>
                        <span className="mx-2 flex-shrink-0">•</span>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="whitespace-nowrap">{entry.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => editEntry(entry)}
                        className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3 line-clamp-3" dangerouslySetInnerHTML={{ __html: entry.content }} />

                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <span
                          key={`${entry.id}-${tag}-${index}`}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* Create/Edit Entry Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? 'Edit Journal Entry' : 'New Journal Entry'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setShowAIAssistant(false);
                    setShowWritingAssistant(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Title and Emoji */}
                  <div className="flex space-x-3 items-start">
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl hover:bg-gray-200 transition-colors"
                      >
                        {selectedEmoji}
                      </button>
                      {showEmojiPicker && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowEmojiPicker(false)}
                          />
                          <div className="absolute top-14 left-0 bg-white border border-gray-200 rounded-lg p-3 shadow-xl z-20 min-w-[240px]">
                            <div className="text-xs text-gray-500 mb-2 font-medium">Select an emoji</div>
                            <div className="grid grid-cols-8 gap-1">
                              {emojis.map((emoji, emojiIndex) => (
                                <button
                                  key={`emoji-${emojiIndex}-${emoji}`}
                                  onClick={() => {
                                    setSelectedEmoji(emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      ref={titleRef}
                      type="text"
                      placeholder="Give your entry a title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="flex-1 text-lg font-semibold border-none outline-none placeholder-gray-400 bg-transparent py-3"
                    />
                  </div>

                  {/* Rich Text Editor Toolbar */}
                  <div className="flex items-center flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border">
                    <button
                      onClick={() => formatText('bold')}
                      className="p-2 hover:bg-white rounded transition-colors"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('italic')}
                      className="p-2 hover:bg-white rounded transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('underline')}
                      className="p-2 hover:bg-white rounded transition-colors"
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button
                      onClick={() => formatText('insertUnorderedList')}
                      className="p-2 hover:bg-white rounded transition-colors"
                      title="Bullet List"
                    >
                      •
                    </button>
                    <button
                      onClick={() => formatText('insertOrderedList')}
                      className="p-2 hover:bg-white rounded transition-colors"
                      title="Numbered List"
                    >
                      1.
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button
                      onClick={enhanceWithAI}
                      disabled={isAIEnhancing}
                      className="p-2 hover:bg-white rounded transition-colors text-purple-600 disabled:opacity-50"
                      title="Enhance with AI"
                    >
                      {isAIEnhancing ? <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div> : <Zap className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={generateWritingPrompts}
                      className="p-2 hover:bg-white rounded transition-colors text-blue-600"
                      title="Writing Prompts"
                    >
                      <Lightbulb className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rich Text Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    className="min-h-[300px] p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 prose prose-sm max-w-none"
                    placeholder="What's on your mind today?"
                    style={{ outline: 'none' }}
                  />

                  {/* Editor Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{wordCount} words</span>
                      <span className={`flex items-center space-x-1 ${getSentimentColor(sentiment)}`}>
                        <Heart className="w-4 h-4" />
                        <span className="capitalize">{sentiment}</span>
                      </span>
                    </div>
                    <div className="text-xs">
                      {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {currentTags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center space-x-1"
                        >
                          <span>#{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-purple-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <Button
                        onClick={handleAddTag}
                        variant="outline"
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Writing Assistant Sidebar */}
                <div className="space-y-4">
                  {/* Writing Progress */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Writing Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Goal: {writingGoal} words</span>
                        <span>{wordCount} words</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getWritingProgress()}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {getWritingProgress() >= 100 ? "🎉 Goal achieved!" : `${Math.round(writingGoal - wordCount)} words to go`}
                      </div>
                    </div>
                  </div>

                  {/* Templates */}
                  <Button
                    onClick={() => setShowTemplates(!showTemplates)}
                    variant="outline"
                    className="w-full"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Writing Templates
                  </Button>

                  {showTemplates && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-3">Choose a Template</h4>
                      <div className="space-y-2">
                        {journalTemplates.map((template, index) => (
                          <button
                            key={`template-${index}-${template.name}`}
                            onClick={() => applyTemplate(template)}
                            className="w-full text-left p-2 text-sm text-purple-800 hover:bg-white/50 rounded transition-colors"
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={generateAISuggestion}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Writing Assistant
                  </Button>

                  {showAIAssistant && aiSuggestion && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        AI Suggestion
                      </h4>
                      <p className="text-blue-800 text-sm leading-relaxed">{aiSuggestion}</p>
                    </div>
                  )}

                  {showWritingAssistant && writingSuggestions.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-medium text-green-900 mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Writing Prompts
                      </h4>
                      <div className="space-y-2">
                        {writingSuggestions.map((prompt, index) => (
                          <button
                            key={`prompt-${index}-${prompt.slice(0, 20)}`}
                            onClick={() => applyWritingPrompt(prompt)}
                            className="text-left w-full p-2 text-sm text-green-800 hover:bg-white/50 rounded transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setShowAIAssistant(false);
                    setShowWritingAssistant(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createEntry}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Update Entry' : 'Save Entry'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
