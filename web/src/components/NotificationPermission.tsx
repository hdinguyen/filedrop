import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18not';
import { IoNotifications, IoCloseSharp } from 'react-icons/io5';
import clsx from 'clsx';

import { notificationManager } from '../utils/notifications.js';
import { IconButton } from './IconButton.js';
import styles from './NotificationPermission.module.scss';

export const NotificationPermission: React.FC = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await notificationManager.requestPermission();
    setPermission(newPermission);
    if (newPermission === 'granted') {
      setDismissed(true);
    }
  };

  if (permission !== 'default' || dismissed || !('Notification' in window)) {
    return null;
  }

  return (
    <div className={clsx('subsection', styles.container)}>
      <div className={styles.content}>
        <IoNotifications className={styles.icon} />
        <div className={styles.text}>
          <div className={styles.title}>{t('notifications.title', { defaultValue: 'Enable Notifications' })}</div>
          <div className={styles.description}>
            {t('notifications.description', { 
              defaultValue: 'Get notified when you receive messages or files from other devices' 
            })}
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.button}
            onClick={handleRequestPermission}
          >
            {t('notifications.enable', { defaultValue: 'Enable' })}
          </button>
          <IconButton 
            title={t('notifications.dismiss', { defaultValue: 'Dismiss' })}
            onClick={() => setDismissed(true)}
          >
            <IoCloseSharp />
          </IconButton>
        </div>
      </div>
    </div>
  );
};