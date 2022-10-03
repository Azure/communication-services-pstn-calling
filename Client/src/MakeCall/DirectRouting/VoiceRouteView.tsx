import React from "react";
import { 
    TextField, 
    Dropdown, 
    Shimmer, 
    ShimmerElementType, 
    PrimaryButton, 
    IShimmerElement,
    IDropdownOption,
    IDropdownProps
} from "@fluentui/react";
import { Trunk } from "./TrunkView";
import { SipTrunkRoute } from "@azure/communication-phone-numbers";

type VoiceRouteError = {
    name?: string
    numberPattern?: string
    trunks?: string
}

type VoiceRoute = SipTrunkRoute & {
    key: number
    errors?: VoiceRouteError
}

const emptyVoiceRoute: VoiceRoute = {
    key: -1,
    name: '',
    numberPattern: '',
    trunks: []
}

/**
 * Check whether a VoiceRoute contains valid fields.
 * Checks if the name has a value, the numberPattern is a valid regex,
 * and if at least one Trunk is selected.
 * 
 * @param {{name, numberPattern, trunkKeys}} voiceRoute The Voice Route to check
 * @returns object mapping the field to an error message, if errors are found.
 *   If no errors, {} is returned.
 */
const validateVoiceRoute = ({name, numberPattern, trunks}: VoiceRoute): VoiceRouteError  => {
    let errors = {};
    if (name.length == 0 && numberPattern.length == 0 && (trunks == null || trunks.length == 0)) {
        return errors;
    }
    if (name.length == 0) {
        errors = {...errors, name: 'Please enter a name.'};
    }
    try {
        new RegExp(numberPattern);
    } catch (error) {
        errors = {...errors, numberPattern: 'Please enter a valid Regular Expression.'};
    }
    if (trunks == null || trunks.length == 0) {
        errors = {...errors, trunkKeys: 'Please select at least one Trunk.'};
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
const validateVoiceRoutes = (voiceRoutes: VoiceRoute[]): VoiceRoute[] => voiceRoutes
    .map(route => ({...route, errors: validateVoiceRoute(route)}));

// How to show one line of shimmering when values are being loaded.
const shimmerElements: IShimmerElement[] = [
    {type: ShimmerElementType.line, width: '33%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: '33%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: '33%', height: 32},
    {type: ShimmerElementType.gap, width: '1em', height: 32},
    {type: ShimmerElementType.line, width: 80, height: 32}
];

interface VoiceRouteViewProps {
    voiceRoute: VoiceRoute;
    trunks: Trunk[];
    onChange(field: 'name' | 'numberPattern', voiceRoute: VoiceRoute, value: string): void;
    onChange(field: 'trunks', voiceRoute: VoiceRoute, value: string[]): void;
    onDelete(): void 
    disabled?: boolean
    loading?: boolean
}

/**
 * Show input fields for a Voice Route.
 * It shows a shimmering if *loading* is set to *true*.
 * 
 * @param {{
 * voiceRoute: Voice Route to edit
 * trunks: list of trunks to choose from
 * onChange: function that is called with the field, the voiceRoute, and the new value
 * disabled: boolean
 * loading: boolean
 * onDelete: function that is called with a click event
 * }} props Props for the component
 * @returns View
 */
const VoiceRouteView: React.FC<VoiceRouteViewProps> = ({ voiceRoute, trunks, onChange, disabled, loading, onDelete }) => (
    <Shimmer 
        className={loading ? "mb-3" : ''}
        isDataLoaded={!loading} 
        shimmerElements={shimmerElements} 
        shimmerColors={{
            shimmer: '#292827',
            shimmerWave: '#484644',
            background: '#201f1e'
        }}>

        <div className="d-flex mb-1 center-content">
            <div className="ms-Grid-row f-1 mr-3">
                <div className='ms-Grid-col ms-lg4'>
                    <TextField
                        disabled={disabled}
                        placeholder='Contoso Route'
                        value={voiceRoute.name}
                        onChange={event => onChange('name', voiceRoute, (event.target as HTMLTextAreaElement).value)} 
                        errorMessage={voiceRoute.errors?.name} />
                </div>
                <div className="ms-Grid-col ms-lg4">
                    <TextField
                        disabled={disabled}
                        placeholder='^\+(31|420){\dP7}}$'
                        value={voiceRoute.numberPattern}
                        onChange={event => onChange('numberPattern', voiceRoute, (event.target as HTMLTextAreaElement).value)} 
                        errorMessage={voiceRoute.errors?.numberPattern} />
                </div>
                <div className="ms-Grid-col ms-lg4">
                    <TrunkDropdown
                        voiceRoute={voiceRoute}
                        trunks={trunks}
                        onChange={onChange}
                        disabled={disabled} />
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

type VoiceRoutesHeaderProps = {
    style?: React.CSSProperties
    className?: string
}

/**
 * Header for the VoiceRoutesView. Is to be put on top of a single VoiceRoutesView.
 * 
 * @param {{style, className}} props Props of the Element
 * @returns View
 */
const VoiceRoutesHeader: React.FC<VoiceRoutesHeaderProps> = ({ style, className }) => (
    <div 
        className={`${className ? className : ''} d-flex mb-1 center-content`} 
        style={style}>
        <div className="ms-Grid-row f-1 mr-4">
            <div className='ms-Grid-col ms-lg4'>
                <h4>Route Name</h4>
            </div>
            <div className="ms-Grid-col ms-lg4">
                <h4>Route Regex</h4>
            </div>
            <div className="ms-Grid-col ms-lg4">
                <h4>Trunk</h4>
            </div>
        </div>
        <div className='button-width' />
    </div>
)

type TrunkDropdownProps = {
    voiceRoute: VoiceRoute
    trunks: Trunk[]
} & Omit<IDropdownProps, "options" | "onChange"> & Pick<VoiceRouteViewProps, "onChange">;

const initializeSelectedTrunks = (voiceRoute: VoiceRoute, trunks: Trunk[]): Trunk[] => 
    trunks.filter(({ fqdn }) => voiceRoute.trunks != null && voiceRoute.trunks.includes(fqdn)); 

const TrunkDropdown : React.FC<TrunkDropdownProps> = ({ voiceRoute, trunks, onChange: propsOnChange, ...props }) => {
    const [selectedTrunks, setSelectedTrunks] = React.useState<Trunk[]>(() => initializeSelectedTrunks(voiceRoute, trunks));

    const onChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption<any>) => {
        if (option != null && option.selected != null) {
            if (option.selected) {

                // If a new trunk is selected, find its reference and update the local and notify the caller.
                setSelectedTrunks((oldSelectedTrunks) => {
                    const newSelectedTrunk = trunks.find(({key}) => key == option.key);
                    if (newSelectedTrunk == null) {
                        return oldSelectedTrunks;
                    }

                    const newSelectedTrunks = [...oldSelectedTrunks, newSelectedTrunk];
                    propsOnChange('trunks', voiceRoute, newSelectedTrunks.map(({fqdn}) => fqdn));
                    return newSelectedTrunks;
                })
            } else {
                // If a trunk is unselected, filter that trunk out and notify the caller
                setSelectedTrunks((oldSelectedTrunks) => {
                    const newSelectedTrunks = oldSelectedTrunks.filter(({ key }) => option.key == key);
                    propsOnChange('trunks', voiceRoute, newSelectedTrunks.map(({fqdn}) => fqdn));
                    return newSelectedTrunks;
                });
            }
        }
    }

    React.useEffect(() => {
        // Update the selected trunks with the trunks that are still left in the new trunks list
        setSelectedTrunks((oldTrunks) => 
            trunks.filter((trunk) => 
                oldTrunks.some((oldTrunk) => oldTrunk.key == trunk.key)));
    }, [trunks]);

    // If the voice routes change, initialize the selected trunks with those that are left
    React.useEffect(() => {
        setSelectedTrunks(initializeSelectedTrunks(voiceRoute, trunks))
    }, [voiceRoute]);

    return (
        <Dropdown
            multiSelect
            options={selectedTrunks.map((trunk) => ({text: trunk.fqdn, key: trunk.key}))}
            selectedKeys={selectedTrunks.map(({key}) => key)}
            onChange={onChange}
            errorMessage={voiceRoute.errors?.trunks}
            {...props}
        />
    );
}

export default VoiceRouteView;
export { VoiceRoutesHeader, validateVoiceRoutes, validateVoiceRoute, emptyVoiceRoute };
export type { VoiceRoute, VoiceRouteError };