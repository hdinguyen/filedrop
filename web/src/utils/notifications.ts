export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window && Notification.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }
    return this.permission;
  }

  canShowNotifications(): boolean {
    return 'Notification' in window && this.permission === 'granted';
  }

  showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!this.canShowNotifications()) {
      return null;
    }

    const notification = new Notification(title, {
      icon: '/drop.svg',
      badge: '/drop.svg',
      tag: 'filedrop-message',
      renotify: true,
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  showMessageNotification(senderName: string, message: string, isGlobal = false): Notification | null {
    const title = isGlobal 
      ? `${senderName} (Everyone)` 
      : `${senderName} (Direct)`;
    
    return this.showNotification(title, {
      body: message,
      tag: 'filedrop-chat',
    });
  }

  showFileNotification(senderName: string, fileName: string, isGlobal = false): Notification | null {
    const title = isGlobal 
      ? `${senderName} (Everyone)` 
      : `${senderName} (Direct)`;
    
    return this.showNotification(title, {
      body: `📁 ${fileName}`,
      tag: 'filedrop-file',
    });
  }
}

export const notificationManager = NotificationManager.getInstance();