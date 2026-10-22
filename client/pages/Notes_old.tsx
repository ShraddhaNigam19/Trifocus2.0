import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2, Target, Brain, Timer, LogOut, Plus, Search, Bell, BookOpen, Zap,
  Bold, Italic, Underline, Link, Image, Save, Edit3, MoreHorizontal, Trash2, X,
  Pin, PinOff, Grid3X3, List, Filter, Tag, Calendar, Clock, Star, Copy, Share2,
  FolderPlus, Palette, StickyNote, Archive, AlertCircle, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService, fallbackSuggestions, LocalTextEnhancer } from "@/lib/openai";
import Sidebar from "@/components/Sidebar";

const Notes = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [lastEnhancedContent, setLastEnhancedContent] = useState('');

  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Project Ideas",
      content: "New app features to implement: Dark mode, Export functionality, Voice notes, Collaboration tools",
      category: "work",
      tags: ["ideas", "development", "features"],
      color: "blue",
      isPinned: true,
      isStarred: false,
      createdAt: "2024-08-02T10:30:00Z",
      updatedAt: "2024-08-02T14:20:00Z"
    },
    {
      id: 2,
      title: "Meeting Notes",
      content: "Discussed quarterly goals, budget allocation, and team restructuring. Key decisions made on resource allocation.",
      category: "work",
      tags: ["meetings", "quarterly", "goals"],
      color: "green",
      isPinned: false,
      isStarred: true,
      createdAt: "2024-08-01T15:45:00Z",
      updatedAt: "2024-08-01T15:45:00Z"
    },
    {
      id: 3,
      title: "Reading List",
      content: "Books to read: 'Atomic Habits', 'The Design of Everyday Things', 'Thinking Fast and Slow'",
      category: "personal",
      tags: ["books", "learning", "self-improvement"],
      color: "purple",
      isPinned: false,
      isStarred: false,
      createdAt: "2024-07-30T09:15:00Z",
      updatedAt: "2024-07-30T09:15:00Z"
    },
    {
      id: 4,
      title: "Recipe Collection",
      content: "Favorite recipes to try: Mediterranean quinoa bowl, Thai green curry, homemade pasta with pesto",
      category: "personal",
      tags: ["cooking", "recipes", "food"],
      color: "orange",
      isPinned: false,
      isStarred: true,
      createdAt: "2024-07-28T16:30:00Z",
      updatedAt: "2024-07-28T16:30:00Z"
    },
    {
      id: 5,
      title: "Travel Plans",
      content: "Places to visit this year: Japan for cherry blossoms, Iceland for northern lights, local hiking trails",
      category: "travel",
      tags: ["travel", "planning", "adventure"],
      color: "teal",
      isPinned: false,
      isStarred: false,
      createdAt: "2024-07-25T11:00:00Z",
      updatedAt: "2024-07-25T11:00:00Z"
    }
  ]);

  const categories = [
    { id: '', name: 'All', icon: StickyNote, count: notes.length },
    { id: 'work', name: 'Work', icon: Target, count: notes.filter(n => n.category === 'work').length },
    { id: 'personal', name: 'Personal', icon: User, count: notes.filter(n => n.category === 'personal').length },
    { id: 'travel', name: 'Travel', icon: Clock, count: notes.filter(n => n.category === 'travel').length },
    { id: 'ideas', name: 'Ideas', icon: Brain, count: notes.filter(n => n.category === 'ideas').length }
  ];

  const colors = [
    { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', button: 'bg-blue-500' },
    { name: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', button: 'bg-green-500' },
    { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', button: 'bg-purple-500' },
    { name: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', button: 'bg-orange-500' },
    { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', button: 'bg-pink-500' },
    { name: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', button: 'bg-teal-500' },
    { name: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', button: 'bg-indigo-500' },
    { name: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', button: 'bg-red-500' }
  ];

  const userName = user?.displayName || user?.email?.split('@')[0] || "User";

  const getColorClasses = (colorName: string) => {
    return colors.find(c => c.name === colorName) || colors[0];
  };

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

  const generateAISuggestions = async () => {
    setShowAIAssistant(true);
    setIsAILoading(true);
    try {
      const context = {
        title: newTitle,
        content: editorRef.current?.innerText || '',
        category: filterCategory,
        recentNotes: notes.slice(0, 3).map(n => ({ title: n.title, content: n.content }))
      };
      
      const suggestions = await OpenAIService.generateNoteSuggestions(context);
      setAiSuggestions(suggestions);
    } catch (error) {
      const fallback = [
        "Consider adding more specific details to make this note more actionable",
        "Break down complex ideas into bullet points for better readability",
        "Add relevant tags to help with future searches",
        "Include deadlines or timeframes if this is time-sensitive"
      ];
      setAiSuggestions(fallback);
    } finally {
      setIsAILoading(false);
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

    try {
      const enhanced = await OpenAIService.enhanceText(currentContent);
      setLastEnhancedContent(currentContent);
      editorRef.current.innerHTML = enhanced;
      toast({
        title: "Content enhanced!",
        description: "Your note has been improved with AI"
      });
    } catch (error) {
      const enhanced = LocalTextEnhancer.enhanceText(currentContent);
      setLastEnhancedContent(currentContent);
      editorRef.current.innerHTML = enhanced;
      toast({
        title: "Content enhanced!",
        description: "Your note has been improved"
      });
    }
  };

  const createNote = () => {
    if (!newTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your note",
        variant: "destructive"
      });
      return;
    }

    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<p><br></p>') {
      toast({
        title: "Content required",
        description: "Please write some content for your note",
        variant: "destructive"
      });
      return;
    }

    const newNote = {
      id: editingId || Date.now(),
      title: newTitle,
      content: content,
      category: filterCategory || 'personal',
      tags: currentTags,
      color: selectedColor,
      isPinned: false,
      isStarred: false,
      createdAt: editingId ? notes.find(n => n.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      setNotes(notes.map(note => note.id === editingId ? newNote : note));
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully"
      });
    } else {
      setNotes([newNote, ...notes]);
      toast({
        title: "Note created",
        description: "Your note has been saved successfully"
      });
    }

    // Reset form
    setNewTitle('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setCurrentTags([]);
    setSelectedColor('blue');
    setIsCreating(false);
    setEditingId(null);
    setShowAIAssistant(false);
  };

  const editNote = (note: any) => {
    setEditingId(note.id);
    setNewTitle(note.title);
    setCurrentTags(note.tags);
    setSelectedColor(note.color);
    setIsCreating(true);
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content;
      }
      if (titleRef.current) {
        titleRef.current.focus();
      }
    }, 100);
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
    toast({
      title: "Note deleted",
      description: "Note has been removed"
    });
  };

  const togglePin = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    ));
  };

  const toggleStar = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isStarred: !note.isStarred } : note
    ));
  };

  const duplicateNote = (note: any) => {
    const duplicated = {
      ...note,
      id: Date.now(),
      title: `${note.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false
    };
    setNotes([duplicated, ...notes]);
    toast({
      title: "Note duplicated",
      description: "A copy of the note has been created"
    });
  };

  const filteredNotes = notes.filter(note => {
    const matchesCategory = filterCategory === '' || note.category === filterCategory;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort notes: pinned first, then by updated date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const allTags = [...new Set(notes.flatMap(note => note.tags))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar currentPage="notes" />

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 lg:ml-72">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <StickyNote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Notes</h1>
                    <p className="text-sm text-gray-500">Organize your thoughts and ideas</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    title="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={() => {
                    setIsCreating(true);
                    setEditingId(null);
                    setNewTitle('');
                    setCurrentTags([]);
                    setSelectedColor('blue');
                    if (editorRef.current) editorRef.current.innerHTML = '';
                  }}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Note</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex h-full">
            {/* Categories Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-4 h-full">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
                  <div className="space-y-1">
                    {categories.map(category => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setFilterCategory(category.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                            filterCategory === category.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{category.name}</span>
                          </div>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            {category.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {allTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                    <div className="space-y-1">
                      {allTags.slice(0, 10).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSearchQuery(`#${tag}`)}
                          className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="w-full flex items-center space-x-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      <span>Starred</span>
                    </button>
                    <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Archive className="w-4 h-4" />
                      <span>Archived</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6">
              {/* Notes Display */}
              {sortedNotes.length === 0 ? (
                <div className="text-center py-12">
                  <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || filterCategory ? "No notes match your filter criteria." : "Start creating notes to organize your thoughts and ideas."}
                  </p>
                  {!searchQuery && !filterCategory && (
                    <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Note
                    </Button>
                  )}
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {sortedNotes.map((note) => {
                    const colorClasses = getColorClasses(note.color);
                    return (
                      <div
                        key={note.id}
                        className={`${colorClasses.bg} ${colorClasses.border} border rounded-xl p-4 ${
                          viewMode === 'grid' ? 'h-fit' : 'flex items-start space-x-4'
                        } transition-all hover:shadow-md cursor-pointer relative group`}
                        onClick={() => editNote(note)}
                      >
                        {note.isPinned && (
                          <Pin className="absolute top-2 right-2 w-4 h-4 text-gray-500 fill-current" />
                        )}

                        <div className={viewMode === 'grid' ? 'space-y-3' : 'flex-1 space-y-2'}>
                          <div className="flex items-start justify-between">
                            <h3 className={`font-semibold ${colorClasses.text} ${viewMode === 'grid' ? 'text-lg' : 'text-base'} line-clamp-1`}>
                              {note.title}
                            </h3>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStar(note.id);
                                }}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                <Star className={`w-4 h-4 ${note.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(note.id);
                                }}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                <Pin className={`w-4 h-4 ${note.isPinned ? 'text-blue-500 fill-current' : 'text-gray-400'}`} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateNote(note);
                                }}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                <Copy className="w-4 h-4 text-gray-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNote(note.id);
                                }}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>

                          <div className={`text-gray-600 ${viewMode === 'grid' ? 'text-sm' : 'text-base'} line-clamp-3`}>
                            <div dangerouslySetInnerHTML={{ __html: note.content.slice(0, 150) + (note.content.length > 150 ? '...' : '') }} />
                          </div>

                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {note.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-1 ${colorClasses.bg} ${colorClasses.text} rounded-full text-xs border ${colorClasses.border}`}
                                >
                                  #{tag}
                                </span>
                              ))}
                              {note.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{note.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                            <span className="capitalize">{note.category}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Create/Edit Note Modal */}
          {isCreating && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingId ? 'Edit Note' : 'New Note'}
                    </h3>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingId(null);
                        setShowAIAssistant(false);
                        setShowColorPicker(false);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Editor */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Title */}
                      <input
                        ref={titleRef}
                        type="text"
                        placeholder="Note title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xl font-semibold border-none outline-none placeholder-gray-400 bg-transparent"
                      />

                      {/* Rich Text Editor Toolbar */}
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
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
                          className="p-2 hover:bg-white rounded transition-colors text-blue-600"
                          title="Enhance with AI"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowColorPicker(!showColorPicker)}
                          className="p-2 hover:bg-white rounded transition-colors"
                          title="Choose Color"
                        >
                          <Palette className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Color Picker */}
                      {showColorPicker && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                          {colors.map(color => (
                            <button
                              key={color.name}
                              onClick={() => {
                                setSelectedColor(color.name);
                                setShowColorPicker(false);
                              }}
                              className={`w-8 h-8 rounded-lg ${color.button} ${
                                selectedColor === color.name ? 'ring-2 ring-gray-400 ring-offset-2' : ''
                              }`}
                              title={color.name}
                            />
                          ))}
                        </div>
                      )}

                      {/* Rich Text Editor */}
                      <div
                        ref={editorRef}
                        contentEditable
                        className="min-h-[300px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-sm max-w-none"
                        placeholder="Start writing your note..."
                        style={{ outline: 'none' }}
                      />

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {currentTags.map(tag => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center space-x-1"
                            >
                              <span>#{tag}</span>
                              <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-blue-900"
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
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                    {/* AI Assistant Sidebar */}
                    <div className="space-y-4">
                      <Button
                        onClick={generateAISuggestions}
                        disabled={isAILoading}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        {isAILoading ? 'Loading...' : 'AI Assistant'}
                      </Button>

                      {showAIAssistant && aiSuggestions.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                            <Brain className="w-4 h-4 mr-2" />
                            AI Suggestions
                          </h4>
                          <div className="space-y-2">
                            {aiSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="text-sm text-blue-800 p-2 bg-white/50 rounded"
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Note Preview */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
                        <div className={`p-3 rounded-lg border ${getColorClasses(selectedColor).bg} ${getColorClasses(selectedColor).border}`}>
                          <div className={`font-medium ${getColorClasses(selectedColor).text} mb-2`}>
                            {newTitle || 'Note title...'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {editorRef.current?.innerText?.slice(0, 100) || 'Note content...'}
                          </div>
                          {currentTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {currentTags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-white/60 text-xs rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
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
                        setShowColorPicker(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createNote}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? 'Update Note' : 'Save Note'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
