// UniversalPasswordInput.tsx
import React from 'react';
import { Button } from './button';
import Input from './input';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  smartCardButton: {
    marginLeft: '8px',
  },
  loadingIndicator: {
    marginLeft: '8px',
    fontStyle: 'italic',
    color: '#555',
  },
});

interface UniversalPasswordInputProps {
  universalPassword: string;
  isHidden: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  onUseSmartCard: () => void;
  isSmartCardLoading: boolean;
  isSmartCardAvailable: boolean;
  errorMessage: string | null;
  refProp: React.RefObject<HTMLInputElement>;
}

const UniversalPasswordInput: React.FC<UniversalPasswordInputProps> = ({
  universalPassword,
  isHidden,
  onChange,
  onToggleVisibility,
  onUseSmartCard,
  isSmartCardLoading,
  isSmartCardAvailable,
  errorMessage,
  refProp,
}) => {
  const classes = useStyles();

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Input
          buttons={[
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
            <Button
              buttonType={{
                type: 'normal',
                onClick: onUseSmartCard,
              }}
              description="Use Smart Card to retrieve password."
              imageName="smart-card" // Ensure you have an appropriate icon
              key="smart-card"
              disabled={isSmartCardLoading || !isSmartCardAvailable}
              className={classes.smartCardButton}
            />,
          ]}
          disabled={false}
          hideValue={isHidden}
          label="Universal password"
          monospace
          onChange={onChange}
          placeholder=""
          ref={refProp}
          updating={false}
          value={universalPassword}
        />
        {isSmartCardLoading && (
          <span className={classes.loadingIndicator}>Loading...</span>
        )}
      </div>
      {errorMessage && (
        <div style={{ color: 'red', marginTop: '8px' }}>{errorMessage}</div>
      )}
    </>
  );
};

export default UniversalPasswordInput;