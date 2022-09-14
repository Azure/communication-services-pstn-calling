import { PhoneNumbersClient } from '@azure/communication-phone-numbers';
import { TagPicker } from '@fluentui/react';
import React from 'react';
import { utils } from '../Utils/Utils';

let phoneNumbersClient = null;

const AlternateCallerIdPicker = ({ disabled, label, onChange }) => {
    const [phoneNumbers, setPhoneNumbers] = React.useState([]);

    const filterSuggestedNumbers = (filterText, selectedNumbers) => {
        const numbers = filterText ? phoneNumbers.filter(number => number.name.indexOf(filterText) > -1) : phoneNumbers;
        return [{ name: filterText, key: filterText }, ...numbers];
    }

    const loadPhoneNumbers = async () => {
        const { connectionString } = await utils.getConnectionString();
        phoneNumbersClient = new PhoneNumbersClient(connectionString);

        const phoneNumbersPromises = phoneNumbersClient.listPurchasedPhoneNumbers();
        let foundPhoneNumbers = [];
        for await (const phoneNumber of phoneNumbersPromises) {
            foundPhoneNumbers = [...foundPhoneNumbers, phoneNumber.phoneNumber];
        }
        setPhoneNumbers(foundPhoneNumbers.map((number) => ({ key: number, name: number })));
        console.warn(`Phone numbers: ${JSON.stringify(foundPhoneNumbers)}`);

    }

    React.useEffect(() => {
        loadPhoneNumbers();   
    }, []);
    return (
        <div className={`alternateIdPicker ${disabled ? 'is-disabled' : ''}`}>
            <label htmlFor="alternateIdPicker">{label}</label>
            <TagPicker 
                removeButtonAriaLabel='Remove'
                selectionAriaLabel='Phone number'
                onResolveSuggestions={filterSuggestedNumbers}
                pickerSuggestionsProps={{
                    suggestionsHeaderText: 'Suggested Phone Numbers',
                    onResultsFoundText: 'Press enter to add'
                }}
                onChange={(items) => onChange(items[0].name)}
                getTextFromItem={(item) => item.name}
                disabled={disabled}
                itemLimit={1}
                inputProps={{ id: 'alternateIdPicker' }}
            />
        </div>
    )
}

export default AlternateCallerIdPicker;