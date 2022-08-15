import React from "react";
import { PrimaryButton, TextField } from "@fluentui/react";

// From: https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
const isNumeric = (str) => typeof str == "string" && // we only process strings!  
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseInt(str)) // ...and ensure strings of whitespace fail

const validateSbc = ({fqdn, port, key}, isSbcDuplicated) => {
    let result = {key};
    if (fqdn.length == 0 && port.length == 0) {
        return result;
    }

    // From: https://stackoverflow.com/questions/11809631/fully-qualified-domain-name-validation 
    if (fqdn.match(/(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)/) == null) {
        result = {...result, fqdn: 'Please enter a valid FQDN.'};
    }
    if (isSbcDuplicated[key]) {
        result = {...result, fqdn: 'Please enter unique FQDNs.'};
    }

    if (!isNumeric(port)) {
        result = {...result, port: 'Please enter a number.'}
    }
    if (parseInt(port) < 0) {
        result = {...result, port: 'Please enter a number greater than zero.'}
    }
    return result;
}

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
    return sbcList
        .map(sbc => validateSbc(sbc, isSbcDuplicated))
        .filter((sbc) => Object.keys(sbc).length > 1)
        .reduce((acc, errors) => ({...acc, [errors.key]: errors}), {});
}

const SBCView = ({ sbc, onChange, disabled, onDelete }) => (
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
                    value={sbc.port}
                    placeholder='8080'
                    type='number'
                    onChange={event => onChange('port', sbc, event.target.value)}
                    errorMessage={sbc.errors?.port} />
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
);


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