import * as React from 'react';
import debounce from 'debounce';
import { createUseStyles } from 'react-jss';
import { useEffect, useCallback, useRef, useState } from 'react';

import Input from './input';
import fillInPassword from './fill-in-password';
import fireAndForget from './fire-and-forget';
import hashpass from './worker-client';
import { Button } from './button';

// Import or define the SmartCardWrapper class
// Assuming it's defined in the same project. If it's in a separate file, adjust the import accordingly.
import {SmartCardWrapper} from './smartcard-wrapper'; // Adjust the path as necessary

const debounceMilliseconds = 200;
const copyToClipboardSuccessIndicatorMilliseconds = 1000;

const useStyles = createUseStyles({
  domain: {
    color: '#666666',
  },
  smartCardButton: {
    marginLeft: '8px', // Adjust styling as needed
  },
  errorMessage: {
    color: 'red',
    marginTop: '8px',
  },
});

const UserInterface = ({
  initialDomain,
  isPasswordFieldActive,
}: {
  readonly initialDomain: string | null;
  readonly isPasswordFieldActive: boolean;
}): React.ReactElement => {
  const classes = useStyles();
  const [domain, setDomain] = useState<string | null>(initialDomain);
  const [universalPassword, setUniversalPassword] = useState('');
  const [isUniversalPasswordHidden, setIsUniversalPasswordHidden] =
    useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGeneratedPasswordHidden, setIsGeneratedPasswordHidden] =
    useState(true);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Start with 0 tasks in progress.
  const [updatesInProgress, setUpdatesInProgress] = useState(0);
  const [pendingCopyToClipboard, setPendingCopyToClipboard] = useState(false);
  const [copyToClipboardTimeoutId, setCopyToClipboardTimeoutId] =
    useState<ReturnType<typeof setTimeout> | null>(null);
  const [pendingFillInPassword, setPendingFillInPassword] = useState(false);
  const [smartCardError, setSmartCardError] = useState<string | null>(null);
  const [isSmartCardLoading, setIsSmartCardLoading] = useState(false);

  const domainRef = useRef<HTMLInputElement>(null);
  const universalPasswordRef = useRef<HTMLInputElement>(null);

  // Instantiate SmartCardWrapper
  const smartCardWrapperRef = useRef<SmartCardWrapper | null>(null);
  useEffect(() => {
    try {
      smartCardWrapperRef.current = new SmartCardWrapper();
    } catch (error) {
      console.warn("SmartCardWrapper initialization failed:", error);
      // Optionally, you can set a state to disable smart card functionality
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- We need to debounce this function.
  const updateGeneratedPassword = useCallback(
    debounce((newDomain: string, newUniversalPassword: string) => {
      setUpdatesInProgress(
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Increment = +1.
        (previousTasksInProgress) => previousTasksInProgress + 1,
      );
      fireAndForget(
        (async (): Promise<void> => {
          try {
            const hashed = await hashpass(newDomain, newUniversalPassword);
            setGeneratedPassword(hashed);
          } catch (error) {
            console.error("Error hashing password:", error);
            // Optionally, handle the error (e.g., show a message to the user)
          } finally {
            setUpdatesInProgress(
              // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Decrement = -1.
              (previousTasksInProgress) => previousTasksInProgress - 1,
            );
          }
        })(),
      );
    }, debounceMilliseconds),
    [],
  );

  useEffect(() => {
    const domainElement = domainRef.current;
    const universalPasswordElement = universalPasswordRef.current;

    // Set the domain and focus the appropriate input if necessary.
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

  useEffect(() => {
    updateGeneratedPassword(domain ?? '', universalPassword);
  }, [updateGeneratedPassword, domain, universalPassword]);

  const onResetDomain = useCallback((): void => {
    setDomain(initialDomain ?? '');

    const universalPasswordElement = universalPasswordRef.current;

    if (universalPasswordElement !== null) {
      universalPasswordElement.focus();
    }
  }, [initialDomain]);

  const onToggleUniversalPasswordHidden = useCallback((): void => {
    setIsUniversalPasswordHidden(!isUniversalPasswordHidden);

    const universalPasswordElement = universalPasswordRef.current;

    if (universalPasswordElement !== null) {
      universalPasswordElement.focus();
    }
  }, [isUniversalPasswordHidden]);

  const onCopyGeneratedPasswordToClipboard = useCallback((): void => {
    updateGeneratedPassword.flush();
    setPendingCopyToClipboard(true);
  }, [updateGeneratedPassword]);

  const onToggleGeneratedPasswordHidden = useCallback((): void => {
    setIsGeneratedPasswordHidden(!isGeneratedPasswordHidden);
  }, [isGeneratedPasswordHidden]);

  const onFormSubmit = useCallback(
    (event: React.FormEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      updateGeneratedPassword.flush();
      setPendingFillInPassword(true);
    },
    [updateGeneratedPassword],
  );

  // Handler for using the smart card to retrieve the password
  const onUseSmartCard = useCallback(async (): Promise<void> => {
    if (!smartCardWrapperRef.current) {
      setSmartCardError("Smart card functionality is not available.");
      return;
    }

    setIsSmartCardLoading(true);
    setSmartCardError(null);

    try {
      const secretKey = await smartCardWrapperRef.current.getSecretKey();
      setUniversalPassword(secretKey);
      // Optionally, you can also show a success message or perform additional actions
    } catch (error) {
      console.error("Error retrieving secret key from smart card:", error);
      setSmartCardError(
        (error as Error).message || "Failed to retrieve secret key from smart card."
      );
    } finally {
      setIsSmartCardLoading(false);
    }
  }, []);

  useEffect(() => {
    const domainElement = domainRef.current;
    const universalPasswordElement = universalPasswordRef.current;

    if (domainElement && initialDomain !== null && domain === null) {
      setDomain(initialDomain);

      if (document.activeElement === document.body) {
        if (initialDomain === '') {
          domainElement.focus();
        } else if (universalPasswordElement) {
          universalPasswordElement.focus();
        }
      }
    }
  }, [domain, initialDomain]);

  useEffect(() => {
    updateGeneratedPassword(domain ?? '', universalPassword);
  }, [updateGeneratedPassword, domain, universalPassword]);

  // Handle side effects when updates are not in progress
  useEffect(() => {
    if (updatesInProgress === 0) {
      if (pendingCopyToClipboard) {
        setPendingCopyToClipboard(false);

        fireAndForget(
          (async (): Promise<void> => {
            try {
              await navigator.clipboard.writeText(generatedPassword);

              setCopyToClipboardTimeoutId((oldTimeoutId) => {
                if (oldTimeoutId !== null) {
                  clearTimeout(oldTimeoutId);
                }

                return setTimeout(() => {
                  setCopyToClipboardTimeoutId(null);
                }, copyToClipboardSuccessIndicatorMilliseconds);
              });
            } catch (error) {
              console.error("Failed to copy to clipboard:", error);
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
              console.error("Failed to fill in password:", error);
              // Optionally, set an error state to inform the user
            }
          })(),
        );
      }
    }
  }, [updatesInProgress, pendingCopyToClipboard, pendingFillInPassword, generatedPassword]);

  return (
    <form onSubmit={onFormSubmit}>
      <Input
        buttons={
          initialDomain === null || domain === initialDomain
            ? []
            : [
                <Button
                  buttonType={{ type: 'normal', onClick: onResetDomain }}
                  description="Reset the domain."
                  imageName="refresh"
                  key="refresh"
                />,
              ]
        }
        disabled={false}
        hideValue={false}
        label="Domain"
        monospace={false}
        onChange={setDomain}
        placeholder="example.com"
        ref={domainRef}
        updating={false}
        value={domain ?? ''}
      />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Input
          buttons={[
            <Button
              buttonType={{
                type: 'normal',
                onClick: onToggleUniversalPasswordHidden,
              }}
              description={
                isUniversalPasswordHidden
                  ? 'Show the password.'
                  : 'Hide the password.'
              }
              imageName={isUniversalPasswordHidden ? 'eye-off' : 'eye'}
              key="eye"
            />,
            <Button
              buttonType={{
                type: 'normal',
                onClick: onUseSmartCard,
              }}
              description="Use Smart Card to retrieve password."
              imageName="smart-card" // Ensure you have an appropriate icon
              key="smart-card"
              disabled={isSmartCardLoading || !('smartCard' in navigator)}
              className={classes.smartCardButton}
            />,
          ]}
          disabled={false}
          hideValue={isUniversalPasswordHidden}
          label="Universal password"
          monospace
          onChange={setUniversalPassword}
          placeholder=""
          ref={universalPasswordRef}
          updating={false}
          value={universalPassword}
        />
        {isSmartCardLoading && <span>Loading...</span>}
      </div>
      {smartCardError && (
        <div className={classes.errorMessage}>{smartCardError}</div>
      )}
      <Input
        buttons={[
          ...(isPasswordFieldActive
            ? [
                <Button
                  buttonType={{ type: 'submit' }}
                  description="Fill in the password field and close Hashpass."
                  imageName="log-in"
                  key="log-in"
                />,
              ]
            : []),
          <Button
            buttonType={
              copyToClipboardTimeoutId
                ? { type: 'noninteractive' }
                : {
                    type: 'normal',
                    onClick: onCopyGeneratedPasswordToClipboard,
                  }
            }
            description="Copy the password to the clipboard."
            imageName={copyToClipboardTimeoutId ? 'check' : 'clipboard-copy'}
            key="clipboard-copy"
          />,
          <Button
            buttonType={{
              type: 'normal',
              onClick: onToggleGeneratedPasswordHidden,
            }}
            description={
              isGeneratedPasswordHidden
                ? 'Show the password.'
                : 'Hide the password.'
            }
            imageName={isGeneratedPasswordHidden ? 'eye-off' : 'eye'}
            key="eye"
          />,
        ]}
        disabled={updatesInProgress > 0}
        hideValue={isGeneratedPasswordHidden}
        label={
          (domain ?? '').trim() === '' ? (
            'Password for this domain'
          ) : (
            <span>
              Password for <span className={classes.domain}>{domain}</span>
            </span>
          )
        }
        monospace
        onChange={null}
        placeholder=""
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Any tasks in progress?
        updating={updatesInProgress !== 0}
        value={generatedPassword}
      />
    </form>
  );
};

export default UserInterface;