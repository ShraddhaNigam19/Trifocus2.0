export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'next' | 'later' | 'done';
  category: string;
  tags: string[];
  dueDate: string | null;
  estimatedTime: number | null; // in minutes
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  isStarred: boolean;
  subtasks: SubTask[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;
  completionRate: number;
  averageCompletionTime: number; // in days
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

class TaskDataServiceImpl {
  private storageKey = 'focus_app_tasks';
  private categoriesKey = 'focus_app_task_categories';

  // Default categories
  private defaultCategories: TaskCategory[] = [
    { id: '1', name: 'Work', color: 'blue', icon: '💼' },
    { id: '2', name: 'Personal', color: 'green', icon: '🏠' },
    { id: '3', name: 'Health', color: 'pink', icon: '🏃' },
    { id: '4', name: 'Learning', color: 'purple', icon: '📚' },
    { id: '5', name: 'Creative', color: 'orange', icon: '🎨' },
    { id: '6', name: 'Finance', color: 'emerald', icon: '💰' },
  ];

  // Initialize with sample data if no tasks exist
  private initializeSampleData(): Task[] {
    const sampleTasks: Task[] = [
      {
        id: '1',
        title: 'Review project proposal',
        description: 'Review and finalize the project proposal for client presentation',
        priority: 'high',
        status: 'next',
        category: 'Work',
        tags: ['important', 'deadline'],
        dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        estimatedTime: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        isStarred: false,
        subtasks: [
          { id: '1-1', title: 'Review timeline', completed: false, createdAt: new Date().toISOString() }
        ]
      },
      {
        id: '2',
        title: 'Plan weekend activities',
        description: 'Organize activities for the upcoming weekend',
        priority: 'low',
        status: 'later',
        category: 'Personal',
        tags: ['weekend', 'planning'],
        dueDate: null,
        estimatedTime: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        isStarred: false,
        subtasks: []
      }
    ];

    this.saveTasks(sampleTasks);
    return sampleTasks;
  }

  // Get all tasks
  getTasks(): Task[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.initializeSampleData();
      }
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Error loading tasks:', error);
      return this.initializeSampleData();
    }
  }

  // Save tasks to localStorage
  private saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  // Get task by ID
  getTask(id: string): Task | undefined {
    const tasks = this.getTasks();
    return tasks.find(task => task.id === id);
  }

  // Create new task
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'subtasks'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      subtasks: []
    };

    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  // Update task
  updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) return null;

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      // Set completedAt when status changes to done
      completedAt: updates.status === 'done' && tasks[taskIndex].status !== 'done' 
        ? new Date().toISOString() 
        : updates.status !== 'done' 
        ? null 
        : tasks[taskIndex].completedAt
    };

    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  // Delete task
  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (filteredTasks.length === tasks.length) return false;
    
    this.saveTasks(filteredTasks);
    return true;
  }

  // Toggle task star status
  toggleStar(id: string): Task | null {
    const task = this.getTask(id);
    if (!task) return null;
    
    return this.updateTask(id, { isStarred: !task.isStarred });
  }

  // Move task to different status
  moveTask(id: string, newStatus: Task['status']): Task | null {
    return this.updateTask(id, { status: newStatus });
  }

  // Get tasks by status
  getTasksByStatus(status: Task['status']): Task[] {
    return this.getTasks().filter(task => task.status === status);
  }

  // Get tasks by category
  getTasksByCategory(category: string): Task[] {
    return this.getTasks().filter(task => task.category === category);
  }

  // Search tasks
  searchTasks(query: string): Task[] {
    const tasks = this.getTasks();
    const lowercaseQuery = query.toLowerCase();
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      task.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get tasks due today
  getTasksDueToday(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getTasks().filter(task => 
      task.dueDate && task.dueDate.split('T')[0] === today && task.status !== 'done'
    );
  }

  // Get overdue tasks
  getOverdueTasks(): Task[] {
    const now = new Date().toISOString();
    return this.getTasks().filter(task => 
      task.dueDate && task.dueDate < now && task.status !== 'done'
    );
  }

  // Get task statistics
  getTaskStats(): TaskStats {
    const tasks = this.getTasks();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const pendingTasks = tasks.filter(task => task.status !== 'done').length;
    const overdueTasks = this.getOverdueTasks().length;
    const todayTasks = tasks.filter(task => 
      task.dueDate && task.dueDate.split('T')[0] === today
    ).length;
    const thisWeekTasks = tasks.filter(task => 
      task.dueDate && task.dueDate.split('T')[0] >= weekStart
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average completion time
    const completedTasksWithDates = tasks.filter(task => 
      task.status === 'done' && task.completedAt && task.createdAt
    );
    
    const averageCompletionTime = completedTasksWithDates.length > 0
      ? completedTasksWithDates.reduce((acc, task) => {
          const created = new Date(task.createdAt);
          const completed = new Date(task.completedAt!);
          const diffDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return acc + diffDays;
        }, 0) / completedTasksWithDates.length
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      todayTasks,
      thisWeekTasks,
      completionRate: Math.round(completionRate),
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10
    };
  }

  // Get categories
  getCategories(): TaskCategory[] {
    try {
      const stored = localStorage.getItem(this.categoriesKey);
      if (!stored) {
        this.saveCategories(this.defaultCategories);
        return this.defaultCategories;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Error loading categories:', error);
      return this.defaultCategories;
    }
  }

  // Save categories
  private saveCategories(categories: TaskCategory[]): void {
    try {
      localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  }

  // Add subtask
  addSubtask(taskId: string, title: string): Task | null {
    const task = this.getTask(taskId);
    if (!task) return null;

    const newSubtask: SubTask = {
      id: `${taskId}-${Date.now()}`,
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updatedSubtasks = [...task.subtasks, newSubtask];
    return this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  // Toggle subtask completion
  toggleSubtask(taskId: string, subtaskId: string): Task | null {
    const task = this.getTask(taskId);
    if (!task) return null;

    const updatedSubtasks = task.subtasks.map(subtask =>
      subtask.id === subtaskId 
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );

    return this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  // Delete subtask
  deleteSubtask(taskId: string, subtaskId: string): Task | null {
    const task = this.getTask(taskId);
    if (!task) return null;

    const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
    return this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  // Get tasks for focus session (today's high priority tasks)
  getTasksForFocus(): Task[] {
    const tasks = this.getTasks();
    const today = new Date().toISOString().split('T')[0];
    
    return tasks
      .filter(task => 
        task.status !== 'done' && 
        (task.priority === 'high' || 
         (task.dueDate && task.dueDate.split('T')[0] === today))
      )
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5); // Return top 5 tasks
  }

  // Export tasks (for backup)
  exportTasks(): string {
    const data = {
      tasks: this.getTasks(),
      categories: this.getCategories(),
      exported: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  // Import tasks (from backup)
  importTasks(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        this.saveTasks(parsed.tasks);
        if (parsed.categories && Array.isArray(parsed.categories)) {
          this.saveCategories(parsed.categories);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing tasks:', error);
      return false;
    }
  }
}

export const TaskDataService = new TaskDataServiceImpl();
