import React from 'react';
import { TextField, PrimaryButton } from '@fluentui/react';
import { utils } from '../Utils/Utils';

type InboundCallingInputProps = {
  disabled?: boolean;
  mri: string;
  className?: string;
  style?: React.CSSProperties;
};

const InboundCallingInput: React.FC<InboundCallingInputProps> = ({
  disabled: propsDisabled,
  mri,
  className,
  style
}) => {
  const [inputPhoneNumber, setInputPhoneNumber] = React.useState<string>('');
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [registeredPhoneNumbers, setRegisteredPhoneNumbers] = React.useState<string[]>([]);
  const disabled = propsDisabled != null && propsDisabled;

  const uploadPhoneNumber = async () => {
    if (isLoading) {
      return;
    }
    setLoading(true);
    await utils.registerInboundPhoneNumber(inputPhoneNumber, mri);
    setRegisteredPhoneNumbers((oldValue) => [...oldValue, inputPhoneNumber]);
    setInputPhoneNumber('');
    setLoading(false);
  };

  return (
    <div className={`ms-Grid-row mt-3 ${className ? className : ''}`} style={style}>
      <h3 className="mb-1">Receive PSTN Calls</h3>
      <div>Register phone numbers to be received in this application.</div>
      <div className="d-flex f-row mt-3">
        <TextField
          className="f-1"
          placeholder="+1234567890"
          value={inputPhoneNumber}
          disabled={disabled || isLoading}
          onChange={(event) => setInputPhoneNumber((event.target as HTMLTextAreaElement).value)}
        />
        <PrimaryButton
          className="primary-button w-auto ml-3"
          disabled={disabled || isLoading || registeredPhoneNumbers.includes(inputPhoneNumber)}
          onClick={uploadPhoneNumber}
        >
          {isLoading ? <div className="loader" /> : 'Register'}
        </PrimaryButton>
      </div>
      <div className="">
        {registeredPhoneNumbers.map((number) => (
          <p key={number}>{number}</p>
        ))}
      </div>
    </div>
  );
};

export default InboundCallingInput;
