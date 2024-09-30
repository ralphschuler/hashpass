// DomainInput.tsx
import React from 'react';
import { Button } from './button';
import Input from './input';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  resetButton: {
    marginLeft: '8px',
  },
});

interface DomainInputProps {
  domain: string | null;
  initialDomain: string | null;
  onChange: (value: string) => void;
  onReset: () => void;
  refProp: React.RefObject<HTMLInputElement>;
}

const DomainInput: React.FC<DomainInputProps> = ({
  domain,
  initialDomain,
  onChange,
  onReset,
  refProp,
}) => {
  const classes = useStyles();

  return (
    <Input
      buttons={
        initialDomain === null || domain === initialDomain
          ? []
          : [
              <Button
                buttonType={{ type: 'normal', onClick: onReset }}
                description="Reset the domain."
                imageName="refresh"
                key="refresh"
                className={classes.resetButton}
              />,
            ]
      }
      disabled={false}
      hideValue={false}
      label="Domain"
      monospace={false}
      onChange={onChange}
      placeholder="example.com"
      ref={refProp}
      updating={false}
      value={domain ?? ''}
    />
  );
};

export default DomainInput;