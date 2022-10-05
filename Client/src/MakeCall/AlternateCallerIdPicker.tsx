import { ITag, TagPicker } from '@fluentui/react';
import React from 'react';
import { utils } from '../Utils/Utils';

type AlternateCallerIdPickerProps = {
  label: string;
  onChange: (name: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Component that provides a picker for existing DO phone numbers.
 * Also allows for custom phone numbers.
 *
 * @param {*} param0 whether it is disabled, what the label should be, etc
 * @returns  view
 */
const AlternateCallerIdPicker: React.FC<AlternateCallerIdPickerProps> = ({ disabled, label, onChange, className }) => {
  const [phoneNumbers, setPhoneNumbers] = React.useState<ITag[]>([]); // List of phone numbers found

  /**
   * Filter the suggestions for the phone numbers.
   * Also allows for picking the phone number that is currently being entered.
   *
   * @param {string} filterText the text that is currently entered
   * @param {*} selectedNumbers list of already selected numbers. Is not used.
   * @returns List of numbers that the user can choose from.
   */
  const filterSuggestedNumbers = (filter: string): ITag[] => {
    const numbers = phoneNumbers.filter((number) => number.name.indexOf(filter) > -1);
    return [{ name: filter, key: filter }, ...numbers];
  };

  /**
   * Load the bought direct offer phone numbers from Azure.
   */
  const loadPhoneNumbers = async () =>
    setPhoneNumbers((await utils.getPhoneNumbers()).map((number) => ({ key: number, name: number })));

  // When the page is loaded, load the phone numbers.
  React.useEffect(() => {
    loadPhoneNumbers();
  }, []);
  return (
    <div className={`alternateIdPicker ${disabled ? 'is-disabled' : ''} ${className}`}>
      <label htmlFor="alternateIdPicker">{label}</label>
      <TagPicker
        removeButtonAriaLabel="Remove"
        selectionAriaLabel="Phone number"
        onResolveSuggestions={filterSuggestedNumbers}
        pickerSuggestionsProps={{ suggestionsHeaderText: 'Suggested Phone Numbers' }}
        onChange={(items) => items != null && onChange(items.length > 0 ? items[0].name : '')}
        getTextFromItem={(item) => item.name}
        disabled={disabled}
        itemLimit={1}
        inputProps={{ id: 'alternateIdPicker' }}
      />
    </div>
  );
};

export default AlternateCallerIdPicker;
