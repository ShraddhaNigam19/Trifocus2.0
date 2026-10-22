import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, Target, Timer, Plus, Search, Bell, MoreHorizontal, 
  RefreshCw, Lightbulb, Clock, Play, Pause, Square, Filter, Star, 
  Calendar, Tag, AlertCircle, TrendingUp, BarChart3, Edit2, Trash2,
  ChevronDown, ChevronUp, X, Save, FileText, Archive, Download,
  ArrowRight, Zap, Brain, Home, Layout, List, Grid3X3, SortAsc,
  Users, Flame, Award, Activity, PieChart, ArrowUp, ArrowDown,
  Flag, Bookmark, Layers, MapPin, Share2, Eye, EyeOff, ChevronLeft,
  Focus, Rocket, Lightning, Shield, Gem, Sparkles, Maximize2, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { TaskService, Task, TaskStats, TaskCategory } from "@/lib/dataServices";
import { FocusDataService } from "@/lib/focusData";
import { db } from "@/lib/firebase";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";

interface TaskFormData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
  dueDate: string;
  estimatedTime: number | null;
}

const Tasks = () => {
  const auth = useAuth();
  const user = auth?.user || auth?.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Debug authentication state
  console.log('Auth state:', { auth, user, uid: user?.uid });

  // Use demo user if no real user is authenticated (for development)
  const effectiveUser = user || { uid: 'demo-user', email: 'demo@user.com', displayName: 'Demo User' };

  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    thisWeekTasks: 0,
    completionRate: 0,
    averageCompletionTime: 0
  });
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'grid'>('board');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState<Task | null>(null);
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'Work',
    tags: [],
    dueDate: '',
    estimatedTime: null
  });

  const userName = effectiveUser?.displayName || effectiveUser?.email?.split('@')[0] || "Demo User";

  // Load data on component mount
  useEffect(() => {
    if (effectiveUser?.uid) {
      refreshData().catch(console.error);
    }
    // Handle navigation from other pages (like overdue tasks)
    if (location.state?.showOverdue) {
      setSelectedTab('overdue');
    }
  }, [effectiveUser?.uid, location.state]);

  const refreshData = async () => {
    if (!effectiveUser?.uid) {
      console.log('No user ID available for loading tasks');
      return;
    }
    try {
      console.log('Loading tasks for user:', effectiveUser.uid);
      const loadedTasks = await TaskService.getTasks(effectiveUser.uid);
      console.log('Loaded tasks count:', loadedTasks.length);
      console.log('Loaded tasks:', loadedTasks);

      const loadedStats = await TaskService.getTaskStats(effectiveUser.uid);
      console.log('Loaded stats:', loadedStats);

      const loadedCategories = await TaskService.getCategories(effectiveUser.uid);
      console.log('Loaded categories:', loadedCategories);

      setTasks(loadedTasks);
      setStats(loadedStats);
      setCategories(loadedCategories);

      // If user has no tasks and Firebase is configured
      if (loadedTasks.length === 0 && db) {
        console.log('No tasks found');
        toast({
          title: "Welcome to Tasks! 🎯",
          description: "Let's start by creating your first task",
        });
      } else if (loadedTasks.length === 0 && !db) {
        console.log('Demo mode: Using sample tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);

      if (!db) {
        // Firebase not configured - this is expected in demo mode
        console.log('Using demo mode fallback data');
        return;
      }

      // Initialize with empty data if service fails
      setTasks([]);
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        todayTasks: 0,
        thisWeekTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: "Error loading tasks",
        description: errorMessage.includes('Firebase') ?
          "Firebase configuration needed for full functionality" :
          "Please refresh the page or check your connection",
        variant: "destructive",
      });
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = tasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query)) ||
        task.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    if (showStarredOnly) {
      filtered = filtered.filter(task => task.isStarred);
    }

    // Tab filtering
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() + 7);
    const weekEnd = thisWeek.toISOString().split('T')[0];

    switch (selectedTab) {
      case "today":
        filtered = filtered.filter(task => 
          task.dueDate && task.dueDate.split('T')[0] === today
        );
        break;
      case "week":
        filtered = filtered.filter(task => 
          task.dueDate && task.dueDate.split('T')[0] <= weekEnd
        );
        break;
      case "overdue":
        const now = new Date().toISOString();
        filtered = filtered.filter(task => 
          task.dueDate && task.dueDate < now && task.status !== 'done'
        );
        break;
      case "completed":
        filtered = filtered.filter(task => task.status === 'done');
        break;
      case "high-priority":
        filtered = filtered.filter(task => task.priority === 'high' && task.status !== 'done');
        break;
    }

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "due-date":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, selectedCategory, showStarredOnly, selectedTab, sortBy]);

  // Group tasks by status for board view
  const tasksByStatus = {
    next: filteredAndSortedTasks.filter(task => task.status === 'next'),
    later: filteredAndSortedTasks.filter(task => task.status === 'later'),
    done: filteredAndSortedTasks.filter(task => task.status === 'done')
  };

  // Handle task creation
  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Task title required",
        description: "Please enter a title for your task",
        variant: "destructive",
      });
      return;
    }

    if (!effectiveUser?.uid) {
      toast({
        title: "Authentication required",
        description: "Please log in to create tasks.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newTask = await TaskService.createTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'next',
        category: formData.category,
        tags: formData.tags,
        dueDate: formData.dueDate || null,
        estimatedTime: formData.estimatedTime,
        isStarred: false,
        subtasks: []
      }, effectiveUser.uid);

      if (newTask) {
        setTasks(prev => [...prev, newTask]);
        const updatedStats = await TaskService.getTaskStats(effectiveUser.uid);
        setStats(updatedStats);
        setShowCreateModal(false);
        resetForm();

        toast({
          title: "Task created! 🎯",
          description: `"${newTask.title}" has been added to your tasks`,
        });
      }
    } catch (error) {
      toast({
        title: "Error creating task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle task update
  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return;
    if (!effectiveUser?.uid) return;

    try {
      console.log('Updating task with data:', {
        id: editingTask.id,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        tags: formData.tags,
        dueDate: formData.dueDate || null,
        estimatedTime: formData.estimatedTime
      });

      const updatedTask = await TaskService.updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        tags: formData.tags,
        dueDate: formData.dueDate || null,
        estimatedTime: formData.estimatedTime
      }, effectiveUser.uid);

      console.log('Update result:', updatedTask);

      if (updatedTask) {
        setTasks(prev => prev.map(task => task.id === editingTask.id ? updatedTask : task));
        const updatedStats = await TaskService.getTaskStats(effectiveUser.uid);
        setStats(updatedStats);
        setShowEditModal(false);
        setEditingTask(null);
        resetForm();

        toast({
          title: "Task updated! ✅",
          description: `"${updatedTask.title}" has been updated`,
        });
      } else {
        console.error('No updated task returned');
        toast({
          title: "Error updating task",
          description: "No response from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Update task error:', error);
      toast({
        title: "Error updating task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string, taskTitle?: string) => {
    if (!effectiveUser?.uid) return;

    console.log('Deleting task:', { taskId, userId: effectiveUser.uid });
    const deleteResult = await TaskService.deleteTask(taskId, effectiveUser.uid);
    console.log('Delete result:', deleteResult);

    if (deleteResult) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      const updatedStats = await TaskService.getTaskStats(effectiveUser.uid);
      setStats(updatedStats);
      setShowTaskDetails(null);
      setShowQuickActions(null);

      toast({
        title: "Task deleted",
        description: taskTitle ? `"${taskTitle}" has been removed` : "Task has been removed",
      });
    } else {
      toast({
        title: "Error deleting task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle task status change
  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!effectiveUser?.uid) return;
    const updatedTask = await TaskService.updateTask(taskId, { status: newStatus }, effectiveUser.uid);
    if (updatedTask) {
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      const updatedStats = await TaskService.getTaskStats(effectiveUser.uid);
      setStats(updatedStats);
      setShowQuickActions(null);

      toast({
        title: newStatus === 'done' ? "Task completed! 🎉" : "Task moved",
        description: newStatus === 'done'
          ? `Great job completing "${updatedTask.title}"!`
          : `"${updatedTask.title}" moved to ${newStatus}`,
      });
    }
  };

  // Toggle task completion for mobile interface
  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'next' : 'done';
    await handleStatusChange(taskId, newStatus);
  };

  // Handle star toggle
  const handleToggleStar = async (taskId: string) => {
    if (!effectiveUser?.uid) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = await TaskService.updateTask(taskId, { isStarred: !task.isStarred }, effectiveUser.uid);
    if (updatedTask) {
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      setShowQuickActions(null);
    }
  };

  // Start focus session with task - WORKING VERSION
  const startFocusWithTask = (task: Task) => {
    // Store task data in sessionStorage for focus timer to pick up
    const focusData = {
      taskId: task.id,
      taskTitle: task.title,
      estimatedTime: task.estimatedTime || 25,
      fromTasks: true
    };
    
    sessionStorage.setItem('focusTaskData', JSON.stringify(focusData));
    
    // Navigate to focus timer
    navigate('/focus-timer');
    
    toast({
      title: "Starting focus session 🎯",
      description: `Focus timer loaded with "${task.title}"`,
    });
  };

  // Handle overdue review - WORKING VERSION
  const handleOverdueReview = () => {
    const now = new Date().toISOString();
    const overdueTasks = tasks.filter(task => 
      task.dueDate && task.dueDate < now && task.status !== 'done'
    );
    
    if (overdueTasks.length === 0) {
      toast({
        title: "No overdue tasks! 🎉",
        description: "You're all caught up with your deadlines",
      });
      return;
    }
    
    setSelectedTab('overdue');
    setShowFilters(false);
    
    toast({
      title: `Reviewing ${overdueTasks.length} overdue tasks`,
      description: "Consider rescheduling or breaking them into smaller tasks",
    });
  };

  // Edit task
  const editTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      tags: task.tags,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedTime: task.estimatedTime
    });
    setShowEditModal(true);
    setShowQuickActions(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'Work',
      tags: [],
      dueDate: '',
      estimatedTime: null
    });
  };

  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': 
        return {
          gradient: 'from-red-500 to-pink-500',
          shadow: 'shadow-red-200',
          glow: 'group-hover:shadow-red-300',
          badge: 'bg-red-100 text-red-700 border-red-200'
        };
      case 'medium': 
        return {
          gradient: 'from-orange-500 to-yellow-500',
          shadow: 'shadow-orange-200',
          glow: 'group-hover:shadow-orange-300',
          badge: 'bg-orange-100 text-orange-700 border-orange-200'
        };
      case 'low': 
        return {
          gradient: 'from-green-500 to-emerald-500',
          shadow: 'shadow-green-200',
          glow: 'group-hover:shadow-green-300',
          badge: 'bg-green-100 text-green-700 border-green-200'
        };
      default: 
        return {
          gradient: 'from-gray-500 to-slate-500',
          shadow: 'shadow-gray-200',
          glow: 'group-hover:shadow-gray-300',
          badge: 'bg-gray-100 text-gray-700 border-gray-200'
        };
    }
  };

  // Get category styling
  const getCategoryStyle = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return 'bg-gray-100 text-gray-700';
    
    const colorMap: {[key: string]: string} = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      pink: 'bg-pink-100 text-pink-700',
      orange: 'bg-orange-100 text-orange-700',
      emerald: 'bg-emerald-100 text-emerald-700'
    };
    
    return colorMap[category.color] || 'bg-gray-100 text-gray-700';
  };

  // Format due date
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: "Today", urgent: true };
    if (diffDays === 1) return { text: "Tomorrow", urgent: false };
    if (diffDays === -1) return { text: "Yesterday", urgent: true };
    if (diffDays < -1) return { text: `${Math.abs(diffDays)} days overdue`, urgent: true };
    if (diffDays < 7) return { text: `In ${diffDays} days`, urgent: false };
    
    return { 
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
      urgent: false 
    };
  };

  // Unique Task-Oriented Card Component with Fixed Height
  const TaskCard = ({ task, compact = false }: { task: Task; compact?: boolean }) => {
    const priorityStyle = getPriorityStyle(task.priority);
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
    const completedSubtasks = (task.subtasks || []).filter(st => st.completed).length;
    const dueDateInfo = formatDueDate(task.dueDate);

    // Task-specific priority styling with checkboxes and status indicators
    const getPriorityTheme = (priority: string) => {
      switch (priority) {
        case 'high': return {
          cardBg: 'bg-white border-red-200',
          accentStripe: 'bg-gradient-to-r from-red-500 to-red-600',
          checkbox: 'border-red-300 bg-red-50',
          iconColor: 'text-red-600'
        };
        case 'medium': return {
          cardBg: 'bg-white border-amber-200',
          accentStripe: 'bg-gradient-to-r from-amber-500 to-orange-500',
          checkbox: 'border-amber-300 bg-amber-50',
          iconColor: 'text-amber-600'
        };
        case 'low': return {
          cardBg: 'bg-white border-emerald-200',
          accentStripe: 'bg-gradient-to-r from-emerald-500 to-green-500',
          checkbox: 'border-emerald-300 bg-emerald-50',
          iconColor: 'text-emerald-600'
        };
        default: return {
          cardBg: 'bg-white border-gray-200',
          accentStripe: 'bg-gradient-to-r from-gray-400 to-gray-500',
          checkbox: 'border-gray-300 bg-gray-50',
          iconColor: 'text-gray-600'
        };
      }
    };

    const theme = getPriorityTheme(task.priority);

    return (
      <div
        className={`group relative bg-white border-l-4 ${
          task.priority === 'high' ? 'border-l-red-500 shadow-red-100' :
          task.priority === 'medium' ? 'border-l-amber-500 shadow-amber-100' :
          'border-l-emerald-500 shadow-emerald-100'
        } border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer ${
          task.status === 'done' ? 'opacity-60' : ''
        } ${isOverdue ? 'border-red-300 bg-red-50' : ''}
        ${compact ? 'p-4 min-h-28' : 'p-5 min-h-64 max-h-80'} flex flex-col overflow-hidden`}
        onClick={() => !compact && setShowTaskDetails(task)}
      >
        {/* Top accent stripe */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${theme.accentStripe}`} />

        {/* Task status checkbox */}
        <div className="absolute top-4 right-4">
          <div className={`w-6 h-6 rounded-lg border-2 ${theme.checkbox} flex items-center justify-center transition-all duration-200 ${
            task.status === 'done' ? `${theme.accentStripe}` : 'hover:scale-110'
          }`}>
            {task.status === 'done' && (
              <CheckCircle2 className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        {/* Task Header with ID-style layout */}
        <div className="flex items-start space-x-4 mb-4 pr-8 min-w-0">
          {/* Task ID badge */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${theme.checkbox} border-2 ${theme.iconColor} flex items-center justify-center font-bold text-xs`}>
            #{tasks.indexOf(task) + 1}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold text-gray-900 leading-tight flex-1 ${
                  task.status === 'done' ? 'line-through text-gray-500' : ''
                } ${compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2'}`}>
                  {task.title}
                </h3>
                {task.isStarred && (
                  <div className="flex-shrink-0 bg-yellow-100 rounded-full p-1">
                    <Star className="w-3 h-3 text-yellow-600 fill-current" />
                  </div>
                )}
              </div>

              {/* Priority and Category badges right under title */}
              <div className="flex items-center space-x-2 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                  task.priority === 'high' ? 'bg-red-500 text-white' :
                  task.priority === 'medium' ? 'bg-amber-500 text-white' :
                  'bg-emerald-500 text-white'
                } shadow-sm`}>
                  {task.priority.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold truncate max-w-32 ${getCategoryStyle(task.category)} border border-current/20`}>
                  {categories.find(c => c.name === task.category)?.icon} {task.category}
                </span>
              </div>

              {task.description && !compact && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed opacity-80 mt-2 break-words">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative flex-shrink-0 ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickActions(showQuickActions === task.id ? null : task.id);
              }}
              className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>

            {showQuickActions === task.id && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowQuickActions(null)}
                />
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[160px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editTask(task);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                    <span>Edit task</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startFocusWithTask(task);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left"
                  >
                    <Focus className="w-4 h-4 text-purple-600" />
                    <span>Start focus</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(task.id);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left"
                  >
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{task.isStarred ? 'Unstar' : 'Star'} task</span>
                  </button>
                  {task.status === 'done' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, 'next');
                      }}
                      className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left text-orange-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Mark as incomplete</span>
                    </button>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id, task.title);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete task</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Meta Information - Flex container for consistent spacing */}
        <div className={`flex-1 space-y-3 ${compact ? 'min-h-0' : ''}`}>

          {/* Due date and time estimate */}
          {(task.dueDate || task.estimatedTime) && (
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {task.dueDate && dueDateInfo && (
                <div className={`flex items-center space-x-1 ${dueDateInfo.urgent ? 'text-red-600' : ''}`}>
                  <Clock className="w-3 h-3" />
                  <span>{dueDateInfo.text}</span>
                </div>
              )}
              {task.estimatedTime && (
                <div className="flex items-center space-x-1">
                  <Timer className="w-3 h-3" />
                  <span>{task.estimatedTime}m</span>
                </div>
              )}
            </div>
          )}

          {/* Progress bar for subtasks */}
          {(task.subtasks || []).length > 0 && !compact && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Subtasks</span>
                <span>{completedSubtasks}/{(task.subtasks || []).length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(completedSubtasks / (task.subtasks || []).length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  #{tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons - Always at bottom */}
        {task.status !== 'done' && !compact && (
          <div className="mt-auto pt-4 border-t border-gray-200/60 flex space-x-3">
            <Button
              size="sm"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg hover:shadow-emerald-200 transition-all duration-200 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(task.id, 'done');
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-blue-200 transition-all duration-200 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                startFocusWithTask(task);
              }}
            >
              <Focus className="w-4 h-4 mr-2" />
              Focus
            </Button>
          </div>
        )}

        {/* Completed status - Always at bottom */}
        {task.status === 'done' && (
          <div className="mt-auto p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold">Completed</span>
                <span className="text-lg">✅</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(task.id, 'next');
                }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Undo
              </Button>
            </div>
            {task.completedAt && (
              <p className="text-xs text-emerald-600 mt-2">
                Finished on {new Date(task.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="flex min-h-screen">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setShowMobileSidebar(false)} />
        )}
        
        {/* Sidebar */}
        <div className={`fixed lg:relative z-50 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300`}>
          <Sidebar currentPage="tasks" />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          {/* Modern Header */}
          <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-sm text-gray-500">
                      {stats.totalTasks} tasks • {stats.pendingTasks} pending • {stats.completionRate}% completed
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                
                {/* View Mode Toggle */}
                <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('board')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'board' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  >
                    <Layout className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''} rounded-xl`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>

                {/* Create Task */}
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg rounded-xl"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">New Task</span>
                </Button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="mt-4 sm:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="priority">Priority</option>
                      <option value="due-date">Due Date</option>
                      <option value="created">Created Date</option>
                      <option value="alphabetical">Alphabetical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <Button
                      size="sm"
                      variant={showStarredOnly ? 'default' : 'outline'}
                      onClick={() => setShowStarredOnly(!showStarredOnly)}
                      className="w-full"
                    >
                      <Star className="w-3 h-3 mr-2" />
                      Starred Only
                    </Button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOverdueReview}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <AlertCircle className="w-3 h-3 mr-2" />
                      Review Overdue
                    </Button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Focus</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done');
                        if (highPriorityTasks.length > 0) {
                          startFocusWithTask(highPriorityTasks[0]);
                        } else {
                          toast({
                            title: "No high priority tasks",
                            description: "All high priority tasks are completed!",
                          });
                        }
                      }}
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Rocket className="w-3 h-3 mr-2" />
                      Focus Mode
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 lg:p-6">
            {/* Demo Mode Notice */}
            {!db && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Demo Mode Active</h4>
                    <p className="text-sm text-blue-700">
                      You're viewing sample data. Changes won't be saved.
                      Configure Firebase to enable full functionality.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Modern Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
              <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-gray-200 overflow-x-auto">
                {(() => {
                  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
                  console.log('Tab counts debug:', {
                    totalTasks: stats.totalTasks,
                    todayTasks: stats.todayTasks,
                    thisWeekTasks: stats.thisWeekTasks,
                    highPriorityCount,
                    overdueTasks: stats.overdueTasks,
                    completedTasks: stats.completedTasks,
                    actualTasksLength: tasks.length
                  });

                  return [
                    { id: 'all', label: 'All Tasks', count: stats.totalTasks },
                    { id: 'today', label: 'Today', count: stats.todayTasks },
                    { id: 'week', label: 'This Week', count: stats.thisWeekTasks },
                    { id: 'high-priority', label: 'High Priority', count: highPriorityCount },
                    { id: 'overdue', label: 'Overdue', count: stats.overdueTasks },
                    { id: 'completed', label: 'Completed', count: stats.completedTasks }
                  ];
                })().map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                      selectedTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      } ${tab.id === 'overdue' && tab.count > 0 ? 'bg-red-100 text-red-600' : ''}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 overflow-x-auto">
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <TrendingUp className="w-4 h-4" />
                  <span>{stats.completionRate}% completion rate</span>
                </div>
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <Activity className="w-4 h-4" />
                  <span>{stats.averageCompletionTime}d avg completion</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {stats.overdueTasks > 0 && selectedTab !== 'overdue' && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 mb-6 border border-red-200">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">⚠️ Attention needed!</h4>
                    <p className="text-sm text-gray-700 mb-4">
                      You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}. 
                      Consider rescheduling or breaking them into smaller, manageable tasks.
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 rounded-xl"
                        onClick={handleOverdueReview}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review Overdue
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        <Calendar className="w-4 h-4 mr-2" />
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Task Views */}
            {viewMode === 'board' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Show tasks based on showAllTasks state */}
                {(showAllTasks ? filteredAndSortedTasks : filteredAndSortedTasks.slice(0, 2)).map((task, index) => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {filteredAndSortedTasks.length > 2 && !showAllTasks && (
                  <div className="col-span-full text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-2xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-4">
                      +{filteredAndSortedTasks.length - 2} more tasks
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAllTasks(true)}
                      className="rounded-xl"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View All Tasks
                    </Button>
                  </div>
                )}

                {showAllTasks && filteredAndSortedTasks.length > 2 && (
                  <div className="col-span-full text-center py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAllTasks(false)}
                      className="rounded-xl"
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </Button>
                  </div>
                )}

                {filteredAndSortedTasks.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold mb-2">No tasks found</h3>
                    <p className="text-sm mb-6">Create your first task to get started</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Task
                    </Button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-4">
                {(showAllTasks ? filteredAndSortedTasks : filteredAndSortedTasks.slice(0, 2)).map((task) => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
                {filteredAndSortedTasks.length > 2 && !showAllTasks && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 font-medium mb-3">
                      +{filteredAndSortedTasks.length - 2} more tasks
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAllTasks(true)}
                      className="rounded-xl"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View All Tasks
                    </Button>
                  </div>
                )}
                {showAllTasks && filteredAndSortedTasks.length > 2 && (
                  <div className="text-center py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAllTasks(false)}
                      className="rounded-xl"
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </Button>
                  </div>
                )}
                {filteredAndSortedTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold mb-2">No tasks found</h3>
                    <p className="text-sm mb-6">
                      {searchQuery ? `No tasks match "${searchQuery}"` : 'Create your first task to get started'}
                    </p>
                    <Button 
                      onClick={() => {
                        if (searchQuery) {
                          setSearchQuery('');
                        } else {
                          setShowCreateModal(true);
                        }
                      }}
                      className="rounded-xl"
                    >
                      {searchQuery ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Clear Search
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Task
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showAllTasks ? filteredAndSortedTasks : filteredAndSortedTasks.slice(0, 2)).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {filteredAndSortedTasks.length > 2 && !showAllTasks && (
                  <div className="col-span-full text-center py-4">
                    <p className="text-sm text-gray-500 font-medium mb-3">
                      +{filteredAndSortedTasks.length - 2} more tasks
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAllTasks(true)}
                      className="rounded-xl"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View All Tasks
                    </Button>
                  </div>
                )}
                {showAllTasks && filteredAndSortedTasks.length > 2 && (
                  <div className="col-span-full text-center py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAllTasks(false)}
                      className="rounded-xl"
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </Button>
                  </div>
                )}
                {filteredAndSortedTasks.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold mb-2">No tasks to display</h3>
                    <p className="text-sm mb-6">Create tasks to see them in grid view</p>
                    <Button onClick={() => setShowCreateModal(true)} className="rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Task
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen min-h-[100dvh] bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-4 pb-6" style={{paddingTop: 'max(60px, env(safe-area-inset-top) + 20px)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg leading-tight">Tasks</h1>
                <p className="text-emerald-100 text-sm">Get things done</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="px-4 pb-6 bg-gradient-to-r from-emerald-600 to-blue-600">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
                <div className="text-emerald-100 text-sm">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.pendingTasks}</div>
                <div className="text-emerald-100 text-sm">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.completionRate}%</div>
                <div className="text-emerald-100 text-sm">Done</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 pt-6 pb-28 space-y-4">
          {/* Mobile Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {['all', 'pending', 'completed', 'overdue'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setSelectedTab(filterType)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTab === filterType
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          {/* Mobile Task List */}
          <div className="space-y-3">
            {filteredAndSortedTasks.slice(0, showAllTasks ? undefined : 10).map((task) => {
              const priorityStyle = getPriorityStyle(task.priority);
              return (
                <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        task.status === 'done'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      {task.status === 'done' && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-gray-900 text-sm ${
                            task.status === 'done' ? 'line-through opacity-60' : ''
                          }`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              priorityStyle.bg
                            } ${priorityStyle.text}`}>
                              {task.priority}
                            </span>
                            {task.category && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {task.category}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowEditModal(true);
                              setFormData({
                                title: task.title,
                                description: task.description || '',
                                priority: task.priority,
                                category: task.category || '',
                                tags: task.tags || [],
                                dueDate: task.dueDate || '',
                                estimatedTime: task.estimatedTime || null
                              });
                            }}
                            className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAndSortedTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">No tasks yet</h3>
              <p className="text-sm mb-6">Create your first task to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Create Task
              </button>
            </div>
          )}

          {filteredAndSortedTasks.length > 10 && !showAllTasks && (
            <div className="text-center py-4">
              <button
                onClick={() => setShowAllTasks(true)}
                className="text-emerald-600 font-medium text-sm px-4 py-2 rounded-lg hover:bg-emerald-50"
              >
                View All {filteredAndSortedTasks.length} Tasks
              </button>
            </div>
          )}
        </div>

        <BottomNavigation />
      </div>

      {/* Modern Create/Edit Task Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">
                    {showCreateModal ? 'Create New Task' : 'Edit Task'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add more details about this task..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Priority and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="high">🔴 High Priority</option>
                      <option value="medium">🟠 Medium Priority</option>
                      <option value="low">�� Low Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date and Estimated Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Time Estimate
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.estimatedTime || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value ? parseInt(e.target.value) : null }))}
                        placeholder="25"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">min</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    placeholder="important, deadline, project"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <Button
                  onClick={showCreateModal ? handleCreateTask : handleUpdateTask}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl py-3 font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {showCreateModal ? 'Create Task' : 'Update Task'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className="px-6 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Task Details Modal */}
      {showTaskDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-3xl font-bold text-gray-900">{showTaskDetails.title}</h3>
                    {showTaskDetails.isStarred && (
                      <Star className="w-8 h-8 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${getPriorityStyle(showTaskDetails.priority).gradient} text-white`}>
                      {showTaskDetails.priority} priority
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getCategoryStyle(showTaskDetails.category)}`}>
                      {categories.find(c => c.name === showTaskDetails.category)?.icon} {showTaskDetails.category}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      showTaskDetails.status === 'done' ? 'bg-green-100 text-green-700' :
                      showTaskDetails.status === 'next' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {showTaskDetails.status === 'done' ? 'Completed' : showTaskDetails.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowTaskDetails(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {showTaskDetails.description && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Description</h4>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
                    {showTaskDetails.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  {showTaskDetails.dueDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Due Date</p>
                        <p className="text-sm text-gray-600">{formatDueDate(showTaskDetails.dueDate)?.text}</p>
                      </div>
                    </div>
                  )}
                  {showTaskDetails.estimatedTime && (
                    <div className="flex items-center space-x-3">
                      <Timer className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Time Estimate</p>
                        <p className="text-sm text-gray-600">{showTaskDetails.estimatedTime} minutes</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Created</p>
                      <p className="text-sm text-gray-600">
                        {new Date(showTaskDetails.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {showTaskDetails.completedAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Completed</p>
                        <p className="text-sm text-gray-600">
                          {new Date(showTaskDetails.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {showTaskDetails.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {showTaskDetails.tags.map((tag, index) => (
                      <span key={index} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                {showTaskDetails.status !== 'done' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(showTaskDetails.id, 'done');
                      setShowTaskDetails(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl py-3 font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    editTask(showTaskDetails);
                    setShowTaskDetails(null);
                  }}
                  className="flex-1 rounded-xl py-3 font-bold"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    startFocusWithTask(showTaskDetails);
                    setShowTaskDetails(null);
                  }}
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl py-3 font-bold"
                >
                  <Focus className="w-4 h-4 mr-2" />
                  Start Focus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tasks;
