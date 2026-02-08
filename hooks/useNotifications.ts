
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export const useNotifications = () => {
  const { settings } = useApp();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted' || !settings.notificationsEnabled) {
      return;
    }

    try {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [isSupported, permission, settings.notificationsEnabled]);

  const scheduleNotification = useCallback((title: string, delayMs: number, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted' || !settings.notificationsEnabled) {
      return () => {};
    }

    const timeoutId = setTimeout(() => {
      sendNotification(title, options);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [isSupported, permission, settings.notificationsEnabled, sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification
  };
};

// Hook for workout reminders
export const useWorkoutReminders = () => {
  const { scheduleNotification } = useNotifications();
  const [activeReminders, setActiveReminders] = useState<Set<string>>(new Set());

  const setWorkoutReminder = useCallback((time: Date, message?: string) => {
    const now = new Date();
    let delay = time.getTime() - now.getTime();
    
    // If time has passed for today, schedule for tomorrow
    if (delay < 0) {
      delay += 24 * 60 * 60 * 1000;
    }

    const cancel = scheduleNotification(
      message || 'Time to workout! 💪',
      delay,
      {
        body: 'Your scheduled workout time has arrived. Let\'s crush it!',
        tag: 'workout-reminder',
        requireInteraction: true
      }
    );

    const id = Date.now().toString();
    setActiveReminders(prev => new Set(prev).add(id));
    
    return {
      id,
      cancel: () => {
        cancel();
        setActiveReminders(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };
  }, [scheduleNotification]);

  const setRestTimer = useCallback((durationSeconds: number) => {
    const cancel = scheduleNotification(
      'Rest time over! ⏱️',
      durationSeconds * 1000,
      {
        body: 'Your rest period is complete. Ready for the next set?',
        tag: 'rest-timer',
        requireInteraction: false
      }
    );

    const id = `rest-${Date.now()}`;
    setActiveReminders(prev => new Set(prev).add(id));

    return {
      id,
      cancel: () => {
        cancel();
        setActiveReminders(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };
  }, [scheduleNotification]);

  const clearAllReminders = useCallback(() => {
    activeReminders.forEach(() => {
      // Cancel logic would go here if we stored cancel functions
    });
    setActiveReminders(new Set());
  }, [activeReminders]);

  return {
    setWorkoutReminder,
    setRestTimer,
    clearAllReminders,
    activeReminderCount: activeReminders.size
  };
};

// Hook for meal reminders
export const useMealReminders = () => {
  const { scheduleNotification } = useNotifications();

  const setMealReminder = useCallback((mealType: 'breakfast' | 'lunch' | 'dinner', time: Date) => {
    const now = new Date();
    let delay = time.getTime() - now.getTime();
    
    if (delay < 0) {
      delay += 24 * 60 * 60 * 1000;
    }

    const messages: Record<string, string> = {
      breakfast: 'Time for breakfast! 🍳',
      lunch: 'Lunch time! 🥗',
      dinner: 'Dinner time! 🍽️'
    };

    return scheduleNotification(
      messages[mealType],
      delay,
      {
        body: `Don't forget to log your ${mealType} and track your macros!`,
        tag: `meal-${mealType}`,
        requireInteraction: false
      }
    );
  }, [scheduleNotification]);

  return { setMealReminder };
};
