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
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'next' | 'later' | 'done';
  category: string;
  tags: string[];
  dueDate: string | null;
  estimatedTime: number | null;
  isStarred: boolean;
  createdAt: string;
  completedAt?: string;
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  userId: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const defaultCategories: TaskCategory[] = [
  { id: '1', name: 'Work', icon: '💼', color: 'blue' },
  { id: '2', name: 'Personal', icon: '🏠', color: 'green' },
  { id: '3', name: 'Health', icon: '💪', color: 'emerald' },
  { id: '4', name: 'Learning', icon: '📚', color: 'purple' },
  { id: '5', name: 'Creative', icon: '🎨', color: 'pink' },
  { id: '6', name: 'Finance', icon: '💰', color: 'orange' }
];

export class TaskDataServiceFirebase {
  private static getTasksCollection(userId: string) {
    if (!db) throw new Error('Firebase not configured');
    return collection(db, `users/${userId}/tasks`);
  }

  private static getCategoriesCollection(userId: string) {
    if (!db) throw new Error('Firebase not configured');
    return collection(db, `users/${userId}/categories`);
  }

  static async initializeDefaultData(userId: string): Promise<void> {
    try {
      // Skip Firebase initialization if db is not available
      if (!db) {
        return;
      }
      // Initialize categories
      const categoriesRef = this.getCategoriesCollection(userId);
      for (const category of defaultCategories) {
        await addDoc(categoriesRef, {
          ...category,
          createdAt: Timestamp.now()
        });
      }

      // Initialize sample tasks
      const tasksRef = this.getTasksCollection(userId);
      const sampleTasks = [
        {
          title: "Review project proposal",
          description: "Review and finalize the project proposal for client presentation",
          priority: "high" as const,
          status: "next" as const,
          category: "Work",
          tags: ["important", "deadline"],
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          estimatedTime: 60,
          isStarred: false,
          subtasks: [],
          createdAt: Timestamp.now()
        },
        {
          title: "Plan weekend activities",
          description: "Organize activities for the upcoming weekend",
          priority: "low" as const,
          status: "later" as const,
          category: "Personal",
          tags: ["weekend", "planning"],
          dueDate: null,
          estimatedTime: 30,
          isStarred: false,
          subtasks: [],
          createdAt: Timestamp.now()
        }
      ];

      for (const task of sampleTasks) {
        await addDoc(tasksRef, task);
      }
    } catch (error) {
      console.error('Error initializing default task data:', error);
    }
  }

  static async getTasks(userId: string): Promise<Task[]> {
    try {
      const tasksRef = this.getTasksCollection(userId);
      const q = query(tasksRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || undefined,
        userId
      })) as Task[];

      // If no tasks exist, initialize sample data
      if (tasks.length === 0) {
        console.log('No tasks found for user, initializing sample data...');
        await this.initializeDefaultData(userId);
        // Fetch again after initialization
        const newSnapshot = await getDocs(q);
        return newSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || undefined,
          userId
        })) as Task[];
      }

      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  static async createTask(userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>): Promise<Task | null> {
    try {
      const tasksRef = this.getTasksCollection(userId);
      const docRef = await addDoc(tasksRef, {
        ...taskData,
        createdAt: Timestamp.now(),
        userId
      });

      return {
        id: docRef.id,
        ...taskData,
        createdAt: new Date().toISOString(),
        userId
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  static async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      console.log('Updating task:', { userId, taskId, updates });
      const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
      const updateData = { ...updates };

      if (updates.status === 'done' && !updates.completedAt) {
        updateData.completedAt = Timestamp.now();
      }

      // Clear completedAt if status is not done
      if (updates.status && updates.status !== 'done') {
        updateData.completedAt = null;
      }

      await updateDoc(taskRef, updateData);
      console.log('Task updated successfully');

      // Fetch the complete updated task
      const tasks = await this.getTasks(userId);
      const updatedTask = tasks.find(t => t.id === taskId);

      if (updatedTask) {
        return updatedTask;
      }

      // Fallback: return task with updates applied
      return {
        id: taskId,
        ...updates,
        userId
      } as Task;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  static async deleteTask(userId: string, taskId: string): Promise<boolean> {
    try {
      console.log('Deleting task:', { userId, taskId });
      const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
      await deleteDoc(taskRef);
      console.log('Task deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  static async toggleStar(userId: string, taskId: string): Promise<Task | null> {
    try {
      const tasks = await this.getTasks(userId);
      const task = tasks.find(t => t.id === taskId);
      if (!task) return null;

      return await this.updateTask(userId, taskId, { isStarred: !task.isStarred });
    } catch (error) {
      console.error('Error toggling star:', error);
      return null;
    }
  }

  static async getTaskStats(userId: string): Promise<TaskStats> {
    try {
      const tasks = await this.getTasks(userId);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() + 7);

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const pendingTasks = tasks.filter(t => t.status !== 'done').length;
      
      const overdueTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
      ).length;
      
      const todayTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()
      ).length;
      
      const thisWeekTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) <= thisWeek
      ).length;

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Calculate average completion time (simplified)
      const completedTasksWithDates = tasks.filter(t => 
        t.status === 'done' && t.completedAt && t.createdAt
      );
      
      let averageCompletionTime = 0;
      if (completedTasksWithDates.length > 0) {
        const totalCompletionTime = completedTasksWithDates.reduce((acc, task) => {
          const created = new Date(task.createdAt).getTime();
          const completed = new Date(task.completedAt!).getTime();
          return acc + (completed - created);
        }, 0);
        
        averageCompletionTime = Math.round(totalCompletionTime / completedTasksWithDates.length / (1000 * 60 * 60 * 24));
      }

      return {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        todayTasks,
        thisWeekTasks,
        completionRate,
        averageCompletionTime
      };
    } catch (error) {
      console.error('Error calculating task stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        todayTasks: 0,
        thisWeekTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0
      };
    }
  }

  static async getCategories(userId: string): Promise<TaskCategory[]> {
    try {
      const categoriesRef = this.getCategoriesCollection(userId);
      const snapshot = await getDocs(categoriesRef);

      if (snapshot.empty) {
        console.log('No categories found for user, initializing default categories...');
        // Initialize default categories if none exist
        for (const category of defaultCategories) {
          await addDoc(categoriesRef, {
            ...category,
            createdAt: Timestamp.now()
          });
        }
        return defaultCategories;
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TaskCategory[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return defaultCategories;
    }
  }

  // Real-time listener for tasks
  static subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
    const tasksRef = this.getTasksCollection(userId);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || undefined,
        userId
      })) as Task[];
      
      callback(tasks);
    });
  }
}
