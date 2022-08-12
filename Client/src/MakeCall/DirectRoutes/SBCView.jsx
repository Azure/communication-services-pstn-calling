import React from "react";
import { PrimaryButton, TextField } from "@fluentui/react";

const SBCView = ({ sbc, onChange, disabled, onDelete }) => (
    <div className='d-flex mb-1'>
        <div className="ms-Grid-row f-1 pr-3"> 
            <div className="ms-Grid-col ms-sm8">
                <TextField
                    className="w-100"
                    disabled={disabled}
                    placeholder='sbc.contoso.com'
                    value={sbc.fqdn} 
                    onChange={event => onChange('fqdn', sbc, event.target.value)} />
            </div>
            <div className="ms-Grid-col ms-sm4">
                <TextField
                    className="w-100"
                    disabled={disabled}
                    value={sbc.port}
                    placeholder='8080'
                    type='number'
                    onChange={event => onChange('port', sbc, event.target.value)} />
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
export { SBCViewHeader };