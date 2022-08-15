import React from "react";
import { TextField, Dropdown, Checkbox, PrimaryButton } from "@fluentui/react";

const validateVoiceRoute = ({key, voiceRouteName, numberPattern, sbcKey, enabled}) => {
    let result = {key};
    if (!enabled && voiceRouteName.length == 0 && numberPattern.length == 0 && sbcKey == -1) {
        return result;
    }
    if (voiceRouteName.length == 0) {
        result = {...result, voiceRouteName: 'Please enter a name.'};
    }
    try {
        new RegExp(numberPattern);
    } catch (e) {
        result = {...result, numberPattern: 'Please enter a valid Regular Expression.'};
    }
    if (sbcKey == -1) {
        result = {...result, sbcKey: 'Please select an SBC.'};
    }

    return result;
}

const validateVoiceRoutes = (voiceRoutes) => voiceRoutes
    .map(route => validateVoiceRoute(route))
    .filter(route => Object.keys(route) > 1)
    .reduce((acc, errors) => ({...acc, [errors.key]: errors}), {});

const VoiceRouteView = ({ voiceRoute, sbcs, onChange, disabled, onDelete }) => (
    <div className="d-flex mb-1" style={{justifyContent: 'center', alignContent: 'center'}}>
        <Checkbox
                value={voiceRoute.enabled}
                disabled={disabled}
                defaultChecked={voiceRoute.enabled}
                onChange={event => onChange('enabled', voiceRoute, event.checked)} 
        />
        <div className="ms-Grid-row f-1 mr-3 ml-3">
            <div className='ms-Grid-col ms-lg4'>
                <TextField
                    disabled={disabled}
                    placeholder='Contoso Route'
                    value={voiceRoute.voiceRouteName}
                    onChange={event => onChange('voiceRouteName', voiceRoute, event.target.value)} />
            </div>
            <div className="ms-Grid-col ms-lg4">
                <TextField
                    disabled={disabled}
                    placeholder='^\\+(31|420){\dP7}}$'
                    value={voiceRoute.numberPattern}
                    onChange={event => onChange('numberPattern', voiceRoute, event.target.value)} />
            </div>
            <div className="ms-Grid-col ms-lg4">
                <Dropdown
                    disabled={disabled}
                    options={sbcs.map((sbc) => ({text: sbc.fqdn, key: sbc.key}))}
                    selectedKey={voiceRoute.sbcKey}
                    onChange={(event, {key}) => onChange('sbcKey', voiceRoute, key)} />
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

const VoiceRoutesHeader = ({style, className}) => (
    <div 
        className={`${className ? className : ''} d-flex mb-1`} 
        style={{...(style ? style : {}), justifyContent: 'center', alignContent: 'center'}}>
        <div style={{width: '24px'}} />
        <div className="ms-Grid-row f-1 mr-3 ml-3">
            <div className='ms-Grid-col ms-lg4'>
                <h4>Route Name</h4>
            </div>
            <div className="ms-Grid-col ms-lg4">
                <h4>Route Regex</h4>
            </div>
            <div className="ms-Grid-col ms-lg4">
                <h4>SBC</h4>
            </div>
        </div>
        <div className='button-width' />
    </div>
)

export default VoiceRouteView;
export { VoiceRoutesHeader, validateVoiceRoutes, validateVoiceRoute };