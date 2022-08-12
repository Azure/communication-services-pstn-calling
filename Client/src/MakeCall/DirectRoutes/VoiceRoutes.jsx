import React from "react";
import { TextField, Dropdown, Checkbox } from "@fluentui/react";

const VoiceRoutes = ({ voiceRoute, sbcs, onChange, disabled, onDelete }) => (
    <div className="d-flex mb-2" style={{justifyContent: 'center', alignContent: 'center'}}>
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

export default VoiceRoutes;
export { VoiceRoutesHeader };