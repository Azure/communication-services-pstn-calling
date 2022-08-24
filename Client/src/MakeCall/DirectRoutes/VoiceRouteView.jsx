import React from "react";
import { 
    TextField, 
    Dropdown, 
    Shimmer, 
    ShimmerElementType, 
    PrimaryButton 
} from "@fluentui/react";

/**
 * Check whether a VoiceRoute contains valid fields.
 * Checks if the name has a value, the numberPattern is a valid regex,
 * and if at least one SBC is selected.
 * 
 * @param {{name, numberPattern, sbcKeys}} voiceRoute The Voice Route to check
 * @returns object mapping the field to an error message, if errors are found.
 *   If no errors, {} is returned.
 */
const validateVoiceRoute = ({name, numberPattern, sbcKeys}) => {
    let errors = {};
    if (name.length == 0 && numberPattern.length == 0 && sbcKeys.length == 0) {
        return errors;
    }
    if (name.length == 0) {
        errors = {...errors, name: 'Please enter a name.'};
    }
    try {
        new RegExp(numberPattern);
    } catch (e) {
        errors = {...errors, numberPattern: 'Please enter a valid Regular Expression.'};
    }
    if (sbcKeys.length == 0) {
        errors = {...errors, sbcKeys: 'Please select at least one SBCs.'};
    }

    return errors;
}

/**
 * Checks for a list of Voice Route objects if they are valid.
 * An *errors* field is added to each Voice Route which contains an object
 * of field names -> error messages.
 * 
 * @param {*} voiceRoutes the voice routes to validate
 * @returns voiceRoutes, but with added *errors* object to each voice route.
 */
const validateVoiceRoutes = (voiceRoutes) => voiceRoutes
    .map(route => ({...route, errors: validateVoiceRoute(route)}));

// How to show one line of shimmering when values are being loaded.
const shimmerElements = [
    {type: ShimmerElementType.line, width: '33%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: '33%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: '33%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: 80, height: 32}
];

/**
 * Show input fields for a Voice Route.
 * It shows a shimmering if *loading* is set to *true*.
 * 
 * @param {{
 * voiceRoute: Voice Route to edit
 * sbcs: list of sbcs to choose from
 * onChange: function that is called with the field, the voiceRoute, and the new value
 * disabled: boolean
 * loading: boolean
 * onDelete: function that is called with a click event
 * }} props Props for the component
 * @returns View
 */
const VoiceRouteView = ({ voiceRoute, sbcs, onChange, disabled, loading, onDelete }) => (
    <Shimmer 
        className={loading ? "mb-3" : ''}
        isDataLoaded={!loading} 
        shimmerElements={shimmerElements} 
        shimmerColors={{
            shimmer: '#292827',
            shimmerWave: '#484644',
            background: '#201f1e'
        }}>

        <div className="d-flex mb-1" style={{justifyContent: 'center', alignContent: 'center'}}>
            <div className="ms-Grid-row f-1 mr-3">
                <div className='ms-Grid-col ms-lg4'>
                    <TextField
                        disabled={disabled}
                        placeholder='Contoso Route'
                        value={voiceRoute.name}
                        onChange={event => onChange('name', voiceRoute, event.target.value)} 
                        errorMessage={voiceRoute.errors?.name} />
                </div>
                <div className="ms-Grid-col ms-lg4">
                    <TextField
                        disabled={disabled}
                        placeholder='^\+(31|420){\dP7}}$'
                        value={voiceRoute.numberPattern}
                        onChange={event => onChange('numberPattern', voiceRoute, event.target.value)} 
                        errorMessage={voiceRoute.errors?.numberPattern} />
                </div>
                <div className="ms-Grid-col ms-lg4">
                    <Dropdown
                        disabled={disabled}
                        multiSelect
                        options={sbcs.map((sbc) => ({text: sbc.fqdn, key: sbc.key}))}
                        selectedKeys={voiceRoute.sbcKeys}
                        onChange={(event, {selected, key}) => 
                            onChange('sbcKeys', voiceRoute, selected ? 
                            [...voiceRoute.sbcKeys, key] 
                            : voiceRoute.sbcKeys.filter((i) => i != key)
                        )}
                        errorMessage={voiceRoute.errors?.sbcKeys}
                    />
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
 * Header for the VoiceRoutesView. Is to be put on top of a single VoiceRoutesView.
 * 
 * @param {{style, className}} props Props of the Element
 * @returns View
 */
const VoiceRoutesHeader = ({style, className}) => (
    <div 
        className={`${className ? className : ''} d-flex mb-1`} 
        style={{...(style ? style : {}), justifyContent: 'center', alignContent: 'center'}}>
        <div className="ms-Grid-row f-1 mr-4">
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