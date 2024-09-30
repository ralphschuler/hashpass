// PinModal.tsx
import React, { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { Button } from './button';

const useStyles = createUseStyles({
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    width: '300px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '8px',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  errorMessage: {
    color: 'red',
    marginBottom: '8px',
  },
});

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const classes = useStyles();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (pin.trim() === '') {
      setError('PIN cannot be empty.');
      return;
    }
    onSubmit(pin);
    setPin('');
    setError(null);
  };

  const handleClose = () => {
    setPin('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={classes.modalOverlay}>
      <div className={classes.modalContent}>
        <h2>Enter Smart Card PIN</h2>
        {error && <div className={classes.errorMessage}>{error}</div>}
        <input
          type="password"
          className={classes.input}
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <div className={classes.buttons}>
          <Button
            buttonType={{ type: 'normal', onClick: handleClose }}
            description="Cancel"
            imageName="cancel" // Ensure you have an appropriate icon
            key="cancel"
          />
          <Button
            buttonType={{ type: 'normal', onClick: handleSubmit }}
            description="Submit"
            imageName="submit" // Ensure you have an appropriate icon
            key="submit"
          />
        </div>
      </div>
    </div>
  );
};

export default PinModal;