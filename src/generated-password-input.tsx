// GeneratedPasswordInput.tsx
import React from 'react';
import { Button } from './button';
import Input from './input';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  domain: {
    color: '#666666',
  },
});

interface GeneratedPasswordInputProps {
  generatedPassword: string;
  isHidden: boolean;
  onCopy: () => void;
  onToggleVisibility: () => void;
  copySuccess: boolean;
  domain: string | null;
  isPasswordFieldActive: boolean;
  onSubmit: () => void;
  isUpdating: boolean;
}

const useStylesInternal = createUseStyles({
  domain: {
    color: '#666666',
  },
});

const GeneratedPasswordInput: React.FC<GeneratedPasswordInputProps> = ({
  generatedPassword,
  isHidden,
  onCopy,
  onToggleVisibility,
  copySuccess,
  domain,
  isPasswordFieldActive,
  onSubmit,
  isUpdating,
}) => {
  const classes = useStylesInternal();

  const label =
    (domain ?? '').trim() === '' ? (
      'Password for this domain'
    ) : (
      <span>
        Password for <span className={classes.domain}>{domain}</span>
      </span>
    );

  return (
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
            copySuccess
              ? { type: 'noninteractive' }
              : { type: 'normal', onClick: onCopy }
          }
          description="Copy the password to the clipboard."
          imageName={copySuccess ? 'check' : 'clipboard-copy'}
          key="clipboard-copy"
        />,
        <Button
          buttonType={{
            type: 'normal',
            onClick: onToggleVisibility,
          }}
          description={
            isHidden ? 'Show the password.' : 'Hide the password.'
          }
          imageName={isHidden ? 'eye-off' : 'eye'}
          key="toggle-visibility"
        />,
      ]}
      disabled={isUpdating}
      hideValue={isHidden}
      label={label}
      monospace
      onChange={null}
      placeholder=""
      updating={isUpdating}
      value={generatedPassword}
    />
  );
};

export default GeneratedPasswordInput;