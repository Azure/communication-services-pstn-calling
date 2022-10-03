import React from 'react';
import { PrimaryButton, TextField, Shimmer, ShimmerElementType, ITextFieldProps } from '@fluentui/react';
import { SipTrunk } from '@azure/communication-phone-numbers';

type TrunkError = {
  fqdn?: string;
  sipSignalingPort?: string;
};

type Trunk = {
  key: number;
  sipSignalingPort: number;
  errors?: TrunkError;
} & SipTrunk;

const emptyTrunk: Trunk = {
  key: 0,
  fqdn: '',
  sipSignalingPort: NaN
};

/**
 * Check whether an Trunk contains valid fields.
 * Checks if the fqdn is unique and in the right format,
 * and if the port is a number
 *
 * @param {{fqdn, sipSignalingPort, key}} trunk the trunk to check
 * @param {*} isTrunkDuplicated object of key -> boolean whether the Trunk
 *  fqdn strings are duplicated
 * @returns object mapping the field to an error message, if errors are found.
 *   If no errors, {} is returned.
 */
const validateTrunk = ({ fqdn, sipSignalingPort, key }: Trunk, isTrunkDuplicated: boolean) => {
  let errors = {};
  if (fqdn.length == 0 && isNaN(sipSignalingPort)) {
    return errors;
  }

  // Check if the FQDN is in a valid format and is unique
  // From: https://stackoverflow.com/questions/11809631/fully-qualified-domain-name-validation
  if (fqdn.match(/(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)/) == null) {
    errors = { ...errors, fqdn: 'Please enter a valid FQDN.' };
  }
  if (isTrunkDuplicated[key]) {
    errors = { ...errors, fqdn: 'Please enter unique FQDNs.' };
  }

  // Check if the port is a number.
  if (sipSignalingPort < 0) {
    errors = { ...errors, sipSignalingPort: 'Please enter a number greater than zero.' };
  }
  return errors;
};

/**
 * Validate a list of Trunks.
 * Tests them for unique FQDNs, and valid port numbers.
 *
 * @param {*} trunks list of Trunk objects to check.
 * @returns trunks where every Trunk object has an error object added.
 */
const validateTrunks = (trunks: Trunk[]): Trunk[] => {
  if (trunks.length == 0) {
    return trunks;
  }

  const fqdnCount = trunks.reduce(
    (acc, { fqdn }) => ({
      ...acc,
      ...(fqdn in acc ? { [fqdn]: acc[fqdn] + 1 } : { [fqdn]: 1 })
    }),
    {}
  );
  const isTrunkDuplicated: any = trunks.reduce((acc, { key, fqdn }) => ({ ...acc, [key]: fqdnCount[fqdn] > 1 }), {});

  // Validate FQDN
  return trunks.map((trunk) => ({ ...trunk, errors: validateTrunk(trunk, isTrunkDuplicated) }));
};

// How to show one line of the shimmering view when data is being loaded
const shimmerElements = [
  { type: ShimmerElementType.line, width: '60%', height: 32 },
  { type: ShimmerElementType.gap, width: '1em', height: 32 },
  { type: ShimmerElementType.line, width: '30%', height: 32 },
  { type: ShimmerElementType.gap, width: '1em', height: 32 },
  { type: ShimmerElementType.line, width: 80, height: 32 }
];

type TrunkViewProps = {
  trunk: Trunk;
  onChange?: (field: 'fqdn' | 'sipSignalingPort', trunk: Trunk, value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  onDelete?: () => void;
};

/**
 * Show input fields for an Trunk.
 * It shows a shimmering if *loading* is set to *true*.
 *
 * @param {{
 * trunk: trunk to edit
 * onChange: function that is called with the field, the trunk, and the new values
 * disabled: boolean
 * loading: boolean
 * onDelete: function that is called with a click event
 * }} props Props for the component
 * @returns View
 */
const TrunkView: React.FC<TrunkViewProps> = ({ trunk, onChange, disabled, loading, onDelete }) => (
  <Shimmer
    className={loading ? 'mb-3' : ''}
    isDataLoaded={!loading}
    shimmerElements={shimmerElements}
    shimmerColors={{
      shimmer: '#292827',
      shimmerWave: '#484644',
      background: '#201f1e'
    }}
  >
    <div className="d-flex mb-1">
      <div className="ms-Grid-row f-1 pr-3">
        <div className="ms-Grid-col ms-sm8">
          <TextField
            className="w-100"
            disabled={disabled}
            placeholder="trunk.contoso.com"
            value={trunk.fqdn}
            onChange={(event) =>
              onChange != null && onChange('fqdn', trunk, (event.target as HTMLTextAreaElement).value)
            }
            errorMessage={trunk.errors?.fqdn}
          />
        </div>
        <div className="ms-Grid-col ms-sm4">
          <NumberTextField
            className="w-100"
            disabled={disabled}
            value={trunk.sipSignalingPort}
            placeholder="8080"
            type="number"
            onChange={(event) =>
              onChange != null && onChange('sipSignalingPort', trunk, (event.target as HTMLTextAreaElement).value)
            }
            errorMessage={trunk.errors?.sipSignalingPort}
          />
        </div>
      </div>
      {onDelete != null && (
        <PrimaryButton
          className="primary-button w-auto"
          disabled={disabled}
          iconProps={{ iconName: 'Delete', style: { verticalAlign: 'middle', fontSize: 'large' } }}
          onClick={onDelete}
        />
      )}
    </div>
  </Shimmer>
);

type TrunkViewHeaderProps = {
  style?: React.CSSProperties;
  className: string;
};

/**
 * Header for the Trunk view. Is to be put on top of a single Trunk View.
 *
 * @param {{style, className}} props Props of the Element
 * @returns View
 */
const TrunkViewHeader: React.FC<TrunkViewHeaderProps> = ({ style, className }) => (
  <div className={`${className ? className : ''} d-flex mb-1 center-content`} style={style}>
    <div className="ms-Grid-row f-1 pr-4">
      <div className="ms-Grid-col ms-sm8">
        <h4>FQDN</h4>
      </div>
      <div className="ms-Grid-col ms-sm4">
        <h4>Port</h4>
      </div>
    </div>
    <div className="button-width" />
  </div>
);

type NumberTextFieldProps = Omit<ITextFieldProps, 'value' | 'onChange'> & {
  value: number;
  onChange: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: number) => void;
};

const NumberTextField: React.FC<NumberTextFieldProps> = ({ value, onChange: propsOnChange, ...props }) => {
  const [internalValue, setInternalValue] = React.useState(() =>
    value == null || isNaN(value) ? '' : value.toString()
  );

  const onChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void =>
    propsOnChange(event, Number(newValue));

  React.useEffect(() => {
    if (value == null || isNaN(value)) {
      setInternalValue('');
      return;
    }
    setInternalValue((oldValue) => (Number(oldValue) != value ? value?.toString() : oldValue));
  }, [value]);
  return <TextField type="number" value={internalValue} onChange={onChange} {...props} />;
};

export default TrunkView;
export { TrunkViewHeader, validateTrunks, emptyTrunk };
export type { Trunk, TrunkError };
