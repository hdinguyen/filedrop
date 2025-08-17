import React, { useState } from 'react';
import { useTranslation } from 'react-i18not';
import { IoLockClosed, IoEye, IoEyeOff } from 'react-icons/io5';

import { Modal } from './Modal.js';
import { IconButton } from './IconButton.js';
import styles from './RoomAccessModal.module.scss';

interface RoomAccessModalProps {
  isOpen: boolean;
  networkName: string;
  onClose: () => void;
  onSubmit: (accessCode: string) => void;
  error?: string;
}

export const RoomAccessModal: React.FC<RoomAccessModalProps> = ({
  isOpen,
  networkName,
  onClose,
  onSubmit,
  error,
}) => {
  const { t } = useTranslation();
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      onSubmit(accessCode.trim());
    }
  };

  const handleClose = () => {
    setAccessCode('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('roomAccess.title', { defaultValue: 'Protected Room' })}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <IoLockClosed className={styles.lockIcon} />
          <div className={styles.message}>
            <div className={styles.networkName}>{networkName}</div>
            <div className={styles.description}>
              {t('roomAccess.description', { 
                defaultValue: 'This room is protected. Please enter the access code to join.' 
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder={t('roomAccess.placeholder', { defaultValue: 'Enter access code' })}
              className={styles.input}
              autoFocus
              maxLength={32}
            />
            <IconButton
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword 
                ? t('roomAccess.hideCode', { defaultValue: 'Hide code' })
                : t('roomAccess.showCode', { defaultValue: 'Show code' })
              }
              className={styles.toggleButton}
            >
              {showPassword ? <IoEyeOff /> : <IoEye />}
            </IconButton>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              {t('cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="submit"
              disabled={!accessCode.trim()}
              className={styles.submitButton}
            >
              {t('roomAccess.join', { defaultValue: 'Join Room' })}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};