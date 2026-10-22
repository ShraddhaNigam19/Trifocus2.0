// Simple notification store for mobile dashboard notifications
interface MobileNotification {
  id: string;
  title: string;
  message: string;
  type: 'focus' | 'habit' | 'task' | 'general';
  timestamp: number;
  read: boolean;
}

class NotificationStore {
  private notifications: MobileNotification[] = [];
  private listeners: ((notifications: MobileNotification[]) => void)[] = [];

  // Load notifications from localStorage
  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('mobile_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('mobile_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.warn('Failed to save notifications to storage:', error);
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Add a new notification
  add(notification: Omit<MobileNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: MobileNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveToStorage();
    this.notify();
  }

  // Get all notifications
  getAll(): MobileNotification[] {
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Mark notification as read
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notify();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notify();
  }

  // Remove notification
  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notify();
  }

  // Clear all notifications
  clear() {
    this.notifications = [];
    this.saveToStorage();
    this.notify();
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: MobileNotification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Export singleton instance
export const notificationStore = new NotificationStore();

// Helper function to add focus timer notifications
export const addFocusNotification = (title: string, message: string) => {
  notificationStore.add({
    title,
    message,
    type: 'focus'
  });
};

export type { MobileNotification };
