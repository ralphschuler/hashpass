// UserInterface.tsx
import React, { useEffect, useCallback, useRef, useState } from 'react';
import debounce from 'debounce';
import { createUseStyles } from 'react-jss';

import fillInPassword from './fill-in-password';
import fireAndForget from './fire-and-forget';
import hashpass from './worker-client';
import { Button } from './button';

import DomainInput from './domain-input';
import UniversalPasswordInput from './universal-password-input';
import GeneratedPasswordInput from './generated-password-input';
import PinModal from './pin-modal';

// Import the functional smart card module
import { getSecretKey } from './smartcard'; // Adjust the path as necessary

const debounceMilliseconds = 200;
const copyToClipboardSuccessIndicatorMilliseconds = 1000;

const useStyles = createUseStyles({
  domain: {
    color: '#666666',
  },
  errorMessage: {
    color: 'red',
    marginTop: '8px',
  },
});

interface UserInterfaceProps {
  initialDomain: string | null;
  isPasswordFieldActive: boolean;
}

const UserInterface: React.FC<UserInterfaceProps> = ({
  initialDomain,
  isPasswordFieldActive,
}) => {
  const classes = useStyles();
  const [domain, setDomain] = useState<string | null>(initialDomain);
  const [universalPassword, setUniversalPassword] = useState('');
  const [isUniversalPasswordHidden, setIsUniversalPasswordHidden] =
    useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGeneratedPasswordHidden, setIsGeneratedPasswordHidden] =
    useState(true);
  const [updatesInProgress, setUpdatesInProgress] = useState(0);
  const [pendingCopyToClipboard, setPendingCopyToClipboard] = useState(false);
  const [copyToClipboardTimeoutId, setCopyToClipboardTimeoutId] =
    useState<ReturnType<typeof setTimeout> | null>(null);
  const [pendingFillInPassword, setPendingFillInPassword] = useState(false);
  const [smartCardError, setSmartCardError] = useState<string | null>(null);
  const [isSmartCardLoading, setIsSmartCardLoading] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const domainRef = useRef<HTMLInputElement>(null);
  const universalPasswordRef = useRef<HTMLInputElement>(null);

  // State to manage copy success indicator
  const [copySuccess, setCopySuccess] = useState(false);

  // Debounced function to update the generated password
  const updateGeneratedPassword = useCallback(
    debounce((newDomain: string, newUniversalPassword: string) => {
      setUpdatesInProgress((prev) => prev + 1);
      fireAndForget(
        (async (): Promise<void> => {
          try {
            const hashed = await hashpass(newDomain, newUniversalPassword);
            setGeneratedPassword(hashed);
          } catch (error) {
            console.error('Error hashing password:', error);
            // Optionally, handle the error (e.g., show a message to the user)
          } finally {
            setUpdatesInProgress((prev) => prev - 1);
          }
        })(),
      );
    }, debounceMilliseconds),
    [],
  );

  // Effect to set initial domain and focus
  useEffect(() => {
    const domainElement = domainRef.current;
    const universalPasswordElement = universalPasswordRef.current;

    if (initialDomain !== null && domain === null) {
      setDomain(initialDomain);

      if (document.activeElement === document.body) {
        if (initialDomain === '') {
          if (domainElement !== null) {
            domainElement.focus();
          }
        } else if (universalPasswordElement !== null) {
          universalPasswordElement.focus();
        }
      }
    }
  }, [domain, initialDomain]);

  // Effect to update generated password when domain or universalPassword changes
  useEffect(() => {
    updateGeneratedPassword(domain ?? '', universalPassword);
  }, [updateGeneratedPassword, domain, universalPassword]);

  // Handler to reset domain
  const onResetDomain = useCallback((): void => {
    setDomain(initialDomain ?? '');

    const universalPasswordElement = universalPasswordRef.current;

    if (universalPasswordElement !== null) {
      universalPasswordElement.focus();
    }
  }, [initialDomain]);

  // Handler to toggle universal password visibility
  const onToggleUniversalPasswordHidden = useCallback((): void => {
    setIsUniversalPasswordHidden((prev) => !prev);

    const universalPasswordElement = universalPasswordRef.current;

    if (universalPasswordElement !== null) {
      universalPasswordElement.focus();
    }
  }, []);

  // Handler to copy generated password to clipboard
  const onCopyGeneratedPasswordToClipboard = useCallback((): void => {
    updateGeneratedPassword.flush();
    setPendingCopyToClipboard(true);
  }, [updateGeneratedPassword]);

  // Handler to toggle generated password visibility
  const onToggleGeneratedPasswordHidden = useCallback((): void => {
    setIsGeneratedPasswordHidden((prev) => !prev);
  }, []);

  // Handler for form submission
  const onFormSubmit = useCallback(
    (event: React.FormEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      updateGeneratedPassword.flush();
      setPendingFillInPassword(true);
    },
    [updateGeneratedPassword],
  );

  // Handler to open the PIN modal
  const openPinModal = useCallback(() => {
    setIsPinModalOpen(true);
  }, []);

  // Handler to close the PIN modal
  const closePinModal = useCallback(() => {
    setIsPinModalOpen(false);
  }, []);

  // Handler when PIN is submitted from the modal
  const handlePinSubmit = useCallback(
    async (pin: string): Promise<void> => {
      closePinModal();

      // Check if the Smart Card API is available
      if (!('smartCard' in navigator)) {
        setSmartCardError('Smart Card API is not supported in this browser.');
        return;
      }

      setIsSmartCardLoading(true);
      setSmartCardError(null);

      try {
        // Retrieve the secret key using the functional module
        const secretKey = await getSecretKey(pin);
        setUniversalPassword(secretKey);
        // Optionally, you can also show a success message or perform additional actions
      } catch (error) {
        console.error('Error retrieving secret key from smart card:', error);
        setSmartCardError(
          (error as Error).message || 'Failed to retrieve secret key from smart card.',
        );
      } finally {
        setIsSmartCardLoading(false);
      }
    },
    [closePinModal],
  );

  // Effect to handle pending copy to clipboard and fill in password actions
  useEffect(() => {
    if (updatesInProgress === 0) {
      if (pendingCopyToClipboard) {
        setPendingCopyToClipboard(false);

        fireAndForget(
          (async (): Promise<void> => {
            try {
              await navigator.clipboard.writeText(generatedPassword);
              setCopySuccess(true);

              setCopyToClipboardTimeoutId((oldTimeoutId) => {
                if (oldTimeoutId !== null) {
                  clearTimeout(oldTimeoutId);
                }

                return setTimeout(() => {
                  setCopySuccess(false);
                  setCopyToClipboardTimeoutId(null);
                }, copyToClipboardSuccessIndicatorMilliseconds);
              });
            } catch (error) {
              console.error('Failed to copy to clipboard:', error);
              // Optionally, set an error state to inform the user
            }
          })(),
        );
      }

      if (pendingFillInPassword) {
        setPendingFillInPassword(false);

        fireAndForget(
          (async (): Promise<void> => {
            try {
              await fillInPassword(generatedPassword);
              window.close();
            } catch (error) {
              console.error('Failed to fill in password:', error);
              // Optionally, set an error state to inform the user
            }
          })(),
        );
      }
    }
  }, [
    updatesInProgress,
    pendingCopyToClipboard,
    pendingFillInPassword,
    generatedPassword,
  ]);

  return (
    <>
      <form onSubmit={onFormSubmit}>
        <DomainInput
          domain={domain}
          initialDomain={initialDomain}
          onChange={setDomain}
          onReset={onResetDomain}
          refProp={domainRef}
        />

        <UniversalPasswordInput
          universalPassword={universalPassword}
          isHidden={isUniversalPasswordHidden}
          onChange={setUniversalPassword}
          onToggleVisibility={onToggleUniversalPasswordHidden}
          onUseSmartCard={openPinModal}
          isSmartCardLoading={isSmartCardLoading}
          isSmartCardAvailable={'smartCard' in navigator}
          errorMessage={smartCardError}
          refProp={universalPasswordRef}
        />

        <GeneratedPasswordInput
          generatedPassword={generatedPassword}
          isHidden={isGeneratedPasswordHidden}
          onCopy={onCopyGeneratedPasswordToClipboard}
          onToggleVisibility={onToggleGeneratedPasswordHidden}
          copySuccess={copySuccess}
          domain={domain}
          isPasswordFieldActive={isPasswordFieldActive}
          onSubmit={onFormSubmit}
          isUpdating={updatesInProgress !== 0}
        />
      </form>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={closePinModal}
        onSubmit={handlePinSubmit}
      />
    </>
  );
};

export default UserInterface;