import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { TaskDataServiceFirebase } from './taskDataFirebase';
import { HabitDataServiceFirebase } from './habitDataFirebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    reminderSound: boolean;
    weekStartsOn: 'sunday' | 'monday';
    timeFormat: '12h' | '24h';
    focusSessionDuration: number;
    breakDuration: number;
  };
  isInitialized: boolean;
  subscription: {
    type: 'free' | 'premium';
    startDate?: string;
    endDate?: string;
  };
}

const defaultPreferences = {
  theme: 'system' as const,
  notifications: true,
  reminderSound: true,
  weekStartsOn: 'monday' as const,
  timeFormat: '12h' as const,
  focusSessionDuration: 25,
  breakDuration: 5
};

export class UserInitializationService {
  static async initializeNewUser(user: User): Promise<boolean> {
    try {
      // Skip Firebase initialization if db is not available
      if (!db) {
        console.warn('Firebase not configured, skipping user initialization');
        return true;
      }

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      // Check if user is already initialized
      if (userDoc.exists() && userDoc.data().isInitialized) {
        console.log('User already initialized');
        return true;
      }

      // Create user profile
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: defaultPreferences,
        isInitialized: false,
        subscription: {
          type: 'free'
        }
      };

      // Save user profile
      await setDoc(userRef, {
        ...userProfile,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      });

      // Initialize default data for all services
      await Promise.all([
        TaskDataServiceFirebase.initializeDefaultData(user.uid),
        HabitDataServiceFirebase.initializeDefaultData(user.uid),
        this.initializeDefaultJournalEntries(user.uid),
        this.initializeDefaultNotes(user.uid)
      ]);

      // Mark user as initialized
      await setDoc(userRef, { isInitialized: true }, { merge: true });

      console.log('User initialization completed successfully');
      return true;
    } catch (error) {
      console.error('Error initializing new user:', error);
      return false;
    }
  }

  static async updateLastLogin(userId: string): Promise<void> {
    try {
      if (!db) return;
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        lastLoginAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!db) return null;
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<boolean> {
    try {
      if (!db) return false;
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        preferences: {
          ...defaultPreferences,
          ...preferences
        }
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  private static async initializeDefaultJournalEntries(userId: string): Promise<void> {
    try {
      if (!db) return;
      const journalRef = doc(db, `users/${userId}/journalEntries/welcome`);
      await setDoc(journalRef, {
        title: "Welcome to Your Digital Journal! 📖",
        content: `# Welcome to Trifocus! 

I'm excited to start this productivity journey with you. This is your digital space for reflection, planning, and growth.

## Getting Started
- Use this journal to capture your thoughts, ideas, and daily reflections
- Try different writing prompts to explore new perspectives
- Track your progress and celebrate your wins

## Today's Reflection
What are you most excited about achieving with Trifocus? What goals do you want to focus on?

---

*This is a sample entry to get you started. Feel free to edit or delete it anytime!*`,
        tags: ["welcome", "getting-started"],
        mood: "excited",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId,
        isTemplate: false
      });
    } catch (error) {
      console.error('Error initializing default journal entries:', error);
    }
  }

  private static async initializeDefaultNotes(userId: string): Promise<void> {
    try {
      const notesData = [
        {
          id: "productivity-tips",
          title: "Productivity Tips & Tricks 💡",
          content: `# Productivity Tips & Tricks

## Focus Techniques
- **Pomodoro Technique**: Work for 25 minutes, then take a 5-minute break
- **Time blocking**: Schedule specific time slots for different tasks
- **Deep work sessions**: Set aside distraction-free time for important work

## Task Management
- Break large tasks into smaller, manageable steps
- Use the 2-minute rule: if it takes less than 2 minutes, do it now
- Prioritize using the Eisenhower Matrix (urgent vs important)

## Habit Building
- Start small and be consistent
- Stack new habits onto existing ones
- Track your progress to stay motivated

## Mood & Wellness
- Take regular breaks throughout the day
- Practice gratitude and mindfulness
- Get enough sleep and exercise

*Feel free to add your own tips and strategies!*`,
          tags: ["productivity", "tips", "reference"],
          category: "Reference",
          isStarred: true
        },
        {
          id: "project-ideas",
          title: "Project Ideas & Goals 🎯",
          content: `# Project Ideas & Goals

## Personal Projects
- [ ] Learn a new skill or hobby
- [ ] Organize digital files and photos
- [ ] Create a personal budget
- [ ] Start a side project

## Professional Goals
- [ ] Complete online course or certification
- [ ] Network with industry professionals
- [ ] Update resume and LinkedIn profile
- [ ] Develop new technical skills

## Health & Wellness
- [ ] Establish morning routine
- [ ] Try meal prepping
- [ ] Join a fitness class
- [ ] Practice meditation regularly

## Creative Pursuits
- [ ] Start journaling
- [ ] Learn to cook new recipes
- [ ] Take up photography
- [ ] Write or blog regularly

*Add your own goals and ideas here!*`,
          tags: ["goals", "projects", "planning"],
          category: "Planning",
          isStarred: false
        }
      ];

      if (!db) return;
      for (const note of notesData) {
        const noteRef = doc(db, `users/${userId}/notes/${note.id}`);
        await setDoc(noteRef, {
          ...note,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          userId
        });
      }
    } catch (error) {
      console.error('Error initializing default notes:', error);
    }
  }

  static async checkUserInitialization(userId: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userId);
      return userProfile?.isInitialized || false;
    } catch (error) {
      console.error('Error checking user initialization:', error);
      return false;
    }
  }

  static async upgradeUserToPremiumi(userId: string): Promise<boolean> {
    try {
      if (!db) return false;
      const userRef = doc(db, 'users', userId);
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
      
      await setDoc(userRef, {
        subscription: {
          type: 'premium',
          startDate: new Date().toISOString(),
          endDate: endDate.toISOString()
        }
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error upgrading user to premium:', error);
      return false;
    }
  }

  static async deleteUserData(userId: string): Promise<boolean> {
    try {
      if (!db) return false;
      // This would require admin privileges to delete user collections
      // For now, just delete the user profile
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        isActive: false,
        deletedAt: Timestamp.now()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error deleting user data:', error);
      return false;
    }
  }
}
