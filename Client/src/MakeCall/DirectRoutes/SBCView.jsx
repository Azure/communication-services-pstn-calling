import React from "react";
import { 
    PrimaryButton, 
    TextField, 
    Shimmer, 
    ShimmerElementType 
} from "@fluentui/react";

/**
 * Check whether a given string contains a number that can be turned into an int.
 * 
 * @see See [Stack Overflow](https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number)
 */
const isNumeric = (str) => typeof str == "string" && // we only process strings!  
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseInt(str)) // ...and ensure strings of whitespace fail

/**
 * Check whether an SBC contains valid fields.
 * Checks if the fqdn is unique and in the right format, 
 * and if the port is a number
 * 
 * @param {{fqdn, sipSignalingPort, key}} sbc the sbc to check
 * @param {*} isSbcDuplicated object of key -> boolean whether the SBC
 *  fqdn strings are duplicated
 * @returns object mapping the field to an error message, if errors are found.
 *   If no errors, {} is returned.
 */
const validateSbc = ({fqdn, sipSignalingPort, key}, isSbcDuplicated) => {
    let errors = {};
    if (fqdn.length == 0 && sipSignalingPort.length == 0) {
        return errors;
    }

    // Check if the FQDN is in a valid format and is unique
    // From: https://stackoverflow.com/questions/11809631/fully-qualified-domain-name-validation 
    if (fqdn.match(/(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)/) == null) {
        errors = {...errors, fqdn: 'Please enter a valid FQDN.'};
    }
    if (isSbcDuplicated[key]) {
        errors = {...errors, fqdn: 'Please enter unique FQDNs.'};
    }

    // Check if the port is a number.
    if (!isNumeric(sipSignalingPort)) {
        errors = {...errors, sipSignalingPort: 'Please enter a number.'}
    }
    if (parseInt(sipSignalingPort) < 0) {
        errors = {...errors, sipSignalingPort: 'Please enter a number greater than zero.'}
    }
    return errors;
}

/**
 * Validate a list of SBCs.
 * Tests them for unique FQDNs, and valid port numbers.
 * 
 * @param {*} sbcList list of SBC objects to check.
 * @returns sbcList where every SBC object has an error object added.
 */
const validateSbcList = (sbcList) => {
    if (sbcList.length == 0) {
        return ['Please add at least one SBC.'];
    }

    const fqdnCount = sbcList.reduce((acc, {fqdn}) => ({
        ...acc, 
        ...(fqdn in acc ? {[fqdn]: acc[fqdn] + 1} : {[fqdn]: 1})
    }), {});
    const isSbcDuplicated = sbcList.reduce((acc, {key, fqdn}) => ({...acc, [key]: fqdnCount[fqdn] > 1}), {});
    
    // Validate FQDN
    return sbcList.map((sbc) => ({...sbc, errors: validateSbc(sbc, isSbcDuplicated)}));
}

// How to show one line of the shimmering view when data is being loaded
const shimmerElements = [
    {type: ShimmerElementType.line, width: '60%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: '30%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: 80, height: 32}
];

/**
 * Show input fields for an SBC.
 * It shows a shimmering if *loading* is set to *true*.
 * 
 * @param {{
 * sbc: sbc to edit
 * onChange: function that is called with the field, the sbc, and the new values
 * disabled: boolean
 * loading: boolean
 * onDelete: function that is called with a click event
 * }} props Props for the component
 * @returns View
 */
const SBCView = ({ sbc, onChange, disabled, loading, onDelete }) => (
    <Shimmer 
        className={loading ? "mb-3" : ''}
        isDataLoaded={!loading} 
        shimmerElements={shimmerElements} 
        shimmerColors={{
            shimmer: '#292827',
            shimmerWave: '#484644',
            background: '#201f1e'
        }}>
    <div className='d-flex mb-1'>
        <div className="ms-Grid-row f-1 pr-3"> 
            <div className="ms-Grid-col ms-sm8">
                <TextField
                    className="w-100"
                    disabled={disabled}
                    placeholder='sbc.contoso.com'
                    value={sbc.fqdn} 
                    onChange={event => onChange('fqdn', sbc, event.target.value)} 
                    errorMessage={sbc.errors?.fqdn} />
            </div>
            <div className="ms-Grid-col ms-sm4">
                <TextField
                    className="w-100"
                    disabled={disabled}
                    value={sbc.sipSignalingPort}
                    placeholder='8080'
                    type='number'
                    onChange={event => onChange('sipSignalingPort', sbc, event.target.value)}
                    errorMessage={sbc.errors?.sipSignalingPort} />
            </div>
        </div>
        {onDelete != null && 
            <PrimaryButton
                className="primary-button w-auto"
                disabled={disabled}
                iconProps={{ iconName: 'Delete', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                onClick={onDelete} />
        }
    </div>
    </Shimmer>
);

/**
 * Header for the SBC view. Is to be put on top of a single SBC View.
 * 
 * @param {{style, className}} props Props of the Element
 * @returns View
 */
const SBCViewHeader = ({style, className}) => (
    <div 
        className={`${className ? className : ''} d-flex mb-1`} 
        style={{...(style ? style : {}), justifyContent: 'center', alignContent: 'center'}}>
        <div className="ms-Grid-row f-1 pr-4"> 
            <div className="ms-Grid-col ms-sm8">
                <h4>FQDN</h4>
            </div>
            <div className="ms-Grid-col ms-sm4">
                <h4>Port</h4>
            </div>
        </div>
        <div className='button-width' />
    </div>
)

export default SBCView;
export { SBCViewHeader, validateSbcList };