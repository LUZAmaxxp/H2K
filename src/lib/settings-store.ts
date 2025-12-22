import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// User settings state
interface UserSettingsState {
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
  };
  appearance: {
    darkMode: boolean;
    compactView: boolean;
  };
  language: string;
  timezone: string;
  isLoading: boolean;
  setNotifications: (settings: Partial<UserSettingsState['notifications']>) => void;
  setAppearance: (settings: Partial<UserSettingsState['appearance']>) => void;
  setLanguage: (language: string) => void;
  setTimezone: (timezone: string) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  reset: () => void;
}

const initialUserSettings = {
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
  },
  appearance: {
    darkMode: false,
    compactView: false,
  },
  language: 'fr',
  timezone: 'UTC+1',
  isLoading: false,
};

// Helper functions for localStorage
const loadFromLocalStorage = () => {
  if (typeof window === 'undefined') return initialUserSettings;
  try {
    const stored = localStorage.getItem('user-settings');
    return stored ? { ...initialUserSettings, ...JSON.parse(stored) } : initialUserSettings;
  } catch {
    return initialUserSettings;
  }
};

const saveToLocalStorage = (state: Partial<UserSettingsState>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('user-settings', JSON.stringify({
      notifications: state.notifications,
      appearance: state.appearance,
      language: state.language,
      timezone: state.timezone,
    }));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const useSettingsStore = create<UserSettingsState>()(
  devtools(
    (set, get) => ({
      ...loadFromLocalStorage(),
      setNotifications: (settings) => {
        set((state) => {
          const newState = {
            notifications: { ...state.notifications, ...settings },
          };
          saveToLocalStorage({ ...state, ...newState });
          return newState;
        });
      },
      setAppearance: (settings) => {
        set((state) => {
          const newState = {
            appearance: { ...state.appearance, ...settings },
          };
          saveToLocalStorage({ ...state, ...newState });
          return newState;
        });
      },
      setLanguage: (language) => {
        set((state) => {
          const newState = { language };
          saveToLocalStorage({ ...state, ...newState });
          return newState;
        });
      },
      setTimezone: (timezone) => {
        set((state) => {
          const newState = { timezone };
          saveToLocalStorage({ ...state, ...newState });
          return newState;
        });
      },
      loadSettings: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const newState = {
                notifications: data.settings.notifications,
                appearance: data.settings.appearance,
                language: data.settings.language,
                timezone: data.settings.timezone,
              };
              set(newState);
              saveToLocalStorage(newState);
            }
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      saveSettings: async () => {
        set({ isLoading: true });
        try {
          const state = get();
          const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notifications: state.notifications,
              appearance: state.appearance,
              language: state.language,
              timezone: state.timezone,
            }),
          });
          if (!response.ok) {
            throw new Error('Failed to save settings');
          }
        } catch (error) {
          console.error('Failed to save settings:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      reset: () => {
        set(initialUserSettings);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-settings');
        }
      },
    }),
    { name: 'settings-store' }
  )
);
