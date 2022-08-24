import { 
    PrimaryButton, 
    Dialog, 
    DialogType,
    DialogFooter
} from '@fluentui/react';
import React from 'react';
import { SipRoutingClient } from '@azure/communication-phone-numbers';
import SBCView, { 
    SBCViewHeader, 
    validateSbcList 
} from './SBCView';
import VoiceRouteView, { 
    validateVoiceRoutes, 
    VoiceRoutesHeader, 
} from './VoiceRouteView';
import { utils } from '../../Utils/Utils.js'

const emptySBC = {
    key: null,
    fqdn: '',
    sipSignalingPort: '',
}

const emptyVoiceRoute = {
    key: null,
    name: '',
    numberPattern: '',
    sbcKeys: [],
}

/**
 * Get a new unused key for a given list.
 * In sbcList and voiceRoutes, keys are being used to 
 * distinguish elements and their input fields.
 * This function finds an unused key if a new element is to be added.
 * It finds the highest key and adds one.
 * 
 * @param {} list the sbcList or the voiceRoutes list.
 * @returns number of the new key.
 */
const getNewKey = (list) => list.length == 0 ? 0 : 
    list.reduce((a, b) => Math.max(a, b.key), 0) + 1;

// Sip client that is initialized after the connectionString has been retrieved
let sipClient = null;

/**
 * Component that contains all the functionality regarding Direct Routing.
 * It provides the functionality to add and remove trunks and Voice Routes.
 * The input fields and buttons can be disabled by setting the *disabled* prop to *true*.
 * 
 * @param {{
 * disabled: boolean
 * className: string
 * style: object
 * }} props Props of the component.
 * @returns A view
 */
const DirectRouting = (props) => {
    // Whether the SBCs (true) or the VoiceRoutes (false) are being edited
    const [isEditingSbcs, setEditingSbcs] = React.useState(true);
    const [disabled, setDisabled] = React.useState(props.disabled);
    const [isDownloading, setDownloading] = React.useState(true);
    const [isUploading, setUploading] = React.useState(false);
    const [showUploadedDialog, setShowUploadedDialog] = React.useState(false);

    // Variables for tracking the sbcs and voice routes
    const [sbcList, setSbcList] = React.useState([
        {...emptySBC, key: 0},
        {...emptySBC, key: 1},
        {...emptySBC, key: 2}
    ]);
    const [voiceRoutes, setVoiceRoutes] = React.useState([
        {...emptyVoiceRoute, key: 0},
        {...emptyVoiceRoute, key: 1},
        {...emptyVoiceRoute, key: 2}
    ]);


    // Variables for tracking the sbcs with entered values
    const nonEmptySbcList = sbcList.filter(({fqdn, sipSignalingPort}) => fqdn.length > 0 || sipSignalingPort.length > 0);
    const nonEmptyVoiceRoutes = voiceRoutes.filter(route => 
        route.name.length > 0 || route.numberPattern.length > 0 || route.sbcKeys.length > 0);
    // Check whether errors exist in the data.
    const isSbcListFaulty = nonEmptySbcList.filter(({errors}) => errors && Object.keys(errors).length > 0).length > 0;
    const isVoicesRoutesFaulty = nonEmptyVoiceRoutes.filter(({errors}) => errors && Object.keys(errors).length > 0).length > 0

    /**
     * Update a change to any SBC field to the local SBC variable.
     * 
     * @param {str} field the field that is being edited ('fqdn' or 'sipSignalingPort')
     * @param {sbc} sbc the sbc that is being edited. 
     * @param {str} newValue the new value to set the field of the sbc to.
     * @returns void
     */
    const onSbcChange = (field, sbc, newValue) => setSbcList((oldList) => {
        const isEditingLastValue = getNewKey(oldList) - 1 == sbc.key;

        // Create a new list consisting of the old list with the element filtered
        // out, and add the element again. Lastly, make sure they are in the right
        // order again.
        // Also check whether the last value is being edited, and add a new value if necessary
        return validateSbcList([
            ...oldList.filter(value => value.key !== sbc.key),
            {...sbc, [field]: newValue},
            ...(isEditingLastValue ? [{...emptySBC, key: getNewKey(oldList)}] : [])
        ]).sort((a, b) => a.key - b.key);
    })


    /**
     * Update a change to any VoiceRoute field to the local VoiceRoute variable.
     * 
     * @param {str} field the field to update. Either name, numberPattern, or sbcKeys.
     * @param {voiceRoute} voiceRoute the voiceRoute to edit. 
     * @param {str, boolean} newValue the value to set the field of the voiceRoute to
     * @returns void
     */
    const onVoiceRouteChange = (field, voiceRoute, newValue) => setVoiceRoutes((oldList) => {
        const isEditingLastValue = getNewKey(oldList) - 1 == voiceRoute.key;
        
        // Create a new list consisting of the old list with the element filtered
        // out, and add the element again. Lastly, make sure they are in the right
        // order again.
        // Also check whether the last value is being edited, and add a new value if necessary
        return validateVoiceRoutes([
            ...oldList.filter(value => value.key !== voiceRoute.key),
            {...voiceRoute, [field]: newValue},
            ...(isEditingLastValue ? [{...emptyVoiceRoute, key: getNewKey(oldList)}] : [])
        ]).sort((a, b) => a.key - b.key);
    })

    /**
     * Delete a VoiceRoute from the local variables.
     * Does not delete a voiceroute if it is the last one (that one is always empty).
     * Only empties the voice route if there are only three left.
     * @param {number} key the key of the voiceroute to delete.
     * @returns void
     */
    const onVoiceRouteDelete = (key) => () => setVoiceRoutes((oldList) => {
        // Do not delete if the newest row is being deleted
        if (getNewKey(oldList) - 1 == key) {
            return oldList;
        }

        // Delete the row from the array, unless only three items are left
        // In that case, just empty the row.
        return [
            ...oldList.filter(route => route.key !== key), 
            ...(oldList.length == 3 ? [{...emptyVoiceRoute, key}] : [])
        ].sort((a, b) => a.key - b.key);
    })

    /**
     * Delete an SBC from the local variables.
     * Does not delete an sbc if it is the last one (that one is always empty).
     * Only empties the sbc if there are only three left.
     * Also checks if there is any voice route referencing this sbc.
     * 
     * @param {number} key the key of the sbc to delete.
     * @returns void
     */
    const onSbcDelete = (key) => () => {

        // Delete SBC from the list
        setSbcList((oldList) => {
            // Do not delete if the newest row is being deleted
            if (getNewKey(oldList) - 1 == key) {
                return oldList;
            }


            // Delete the row from the array, unless only three items are left
            // In that case, just empty the row.
            return [
                ...oldList.filter(sbc => sbc.key !== key), 
                ...(oldList.length == 3 ? [{...emptySBC, key}] : [])
            ].sort((a, b) => a.key - b.key)
        })

        // Delete the reference to this SBC from any VoiceRoute still referencing it
        setVoiceRoutes((oldList) => [
            ...oldList.filter(({sbcKeys}) => !sbcKeys.includes(key)),
            ...oldList.filter(({sbcKeys}) => sbcKeys.includes(key))
                .map(({sbcKeys, ...voiceRoute}) => ({
                    ...voiceRoute, 
                    sbcKeys: sbcKeys.filter((_key) => _key == key)
                }))
        ].sort((a, b) => a.key - b.key))
    }
    
    /**
     * Upload the data when the user clicks on *Create*.
     */
    const onCreateClick = async () => {
        setUploading(true);

        // Delete the key and errors fields from the sbc
        // and parse the sipSignaling port to an int
        const trunks = nonEmptySbcList.map(({key, sipSignalingPort, errors, ...sbc}) => ({
            ...sbc, 
            sipSignalingPort: parseInt(sipSignalingPort)
        }));

        // Delete the key and errors fields from the routes
        // and find the FQDNs of the selected trunks
        const routes = nonEmptyVoiceRoutes.map(({key, errors, sbcKeys, ...route}) => ({
            ...route, 
            description: null, 
            trunks: sbcKeys.map(key => nonEmptySbcList.find((sbc) => sbc.key == key).fqdn)
        }));
        await sipClient.setTrunks(trunks);
        await sipClient.setRoutes(routes);
        setUploading(false);
        setShowUploadedDialog(true);
    }

    /**
     * Download the current settings from Azure.
     * First retrieves the *connectionString* from the server, and then 
     * uses this to retrieve the trunks (SBCs) and the Voice Routes from Azure.
     */
    const downloadData = async () => {
        setDownloading(true);

        // Retrieve the connectionString, and the trunks and routes
        const { connectionString } = await utils.getConnectionString();
        sipClient = new SipRoutingClient(connectionString);
        const trunks = await sipClient.getTrunks();
        const routes = await sipClient.getRoutes();

        // Create a list of SBCs from the list of trunks
        // Parse the ports to strings, and add a key
        // The key is an internally used unique identifier for the trunk
        let newSbcList = trunks.map(({sipSignalingPort, ...trunk}, key) => ({
            ...trunk, 
            key, 
            sipSignalingPort: sipSignalingPort.toString()
        }));
        // Make sure at least three trunks are shown
        while (newSbcList.length < 3) {
            newSbcList = [...newSbcList, {...emptySBC, key: newSbcList.length}];
        }

        // Add a key to the voiceroutes (same as with SBCs) and
        // And change the fqdn list in the trunks field to this the key of the right sbc
        // This way the voice route points to the correct SBC
        let newVoiceRoutes = routes.map(({trunks, ...route}, key) => ({
            ...route, 
            key, 
            sbcKeys: trunks.map((trunk) => newSbcList.find(({fqdn}) => fqdn == trunk).key)
        }));
        while (newVoiceRoutes.length < 3) {
            newVoiceRoutes = [...newVoiceRoutes, {...emptyVoiceRoute, key: newVoiceRoutes.length}];
        }
        setSbcList(newSbcList);
        setVoiceRoutes(newVoiceRoutes);
        setDownloading(false);
    }

    // Download the data when the page loads
    React.useEffect(() => {
        downloadData()
    }, []);

    // Update the disabled field when the loading status changes.
    React.useLayoutEffect(() => 
        setDisabled(props.disabled || isUploading || isDownloading), 
        [props, isUploading, isDownloading]
    );

    return (
        <div className={props.className} style={props.style}>
            <div className="ms-Grid-row mt-3">
                <div className="call-input-panel ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl6">
                    
                    <h3 className="mb-1">Session Border Controllers</h3>
                    <div className="mb-3">Direct routing allows your Session Border Controllers (SBCs) to make calls through Azure Communication Services. Get started by adding your supported Session Border Controller (SBC).</div>
                    
                    <SBCViewHeader className="mt-1" />
                    {sbcList.map(sbc => (
                        <SBCView 
                            key={sbc.key}
                            sbc={sbc}
                            loading={isDownloading}
                            disabled={disabled || !isEditingSbcs}
                            onChange={onSbcChange}
                            onDelete={onSbcDelete(sbc.key)} />
                    ))}

                    <div>
                        <PrimaryButton
                            style={{float: 'right'}}
                            className="primary-button w-auto"
                            disabled={disabled || !isEditingSbcs || isSbcListFaulty}
                            onClick={() => setEditingSbcs(false)}>
                            Next
                        </PrimaryButton>
                    </div>
                </div>
                <div className="call-input-panel ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl6">
                    <h3 className="mb-1">Voice Routes</h3>
                    <div className="mb-3">Azure Communication Services allows balancing and routing outgoing calls based on called number. Set voice routes to complete your direct routing configuration. Use the move up and move down buttons to set the priority of voice routes.</div>
                    
                    <VoiceRoutesHeader className="mt-1" />
                    {voiceRoutes.map(route => (
                        <VoiceRouteView
                            key={route.key}
                            sbcs={nonEmptySbcList}
                            voiceRoute={route}
                            loading={isDownloading}
                            disabled={disabled || isEditingSbcs}
                            onChange={onVoiceRouteChange}
                            onDelete={onVoiceRouteDelete(route.key)} />
                    ))}

                    <div>
                        <PrimaryButton 
                            style={{float: 'left'}} 
                            className="primary-button w-auto"
                            disabled={disabled || isEditingSbcs}
                            onClick={() => setEditingSbcs(true)}>
                            Back
                        </PrimaryButton>
                        <PrimaryButton 
                            style={{float: 'right'}} 
                            className="primary-button w-auto"
                            disabled={disabled || isEditingSbcs || isVoicesRoutesFaulty}
                            onClick={onCreateClick}>
                            {isUploading ? <div className="loader" /> : 'Create' }
                        </PrimaryButton>
                    </div>
                </div>
            </div>
            <Dialog
                hidden={!showUploadedDialog}
                onDismiss={() => setShowUploadedDialog(false)}
                dialogContentProps={{
                    type: DialogType.normal,
                    title: 'Upload Successful',
                    closeButtonAriaLabel: 'Close',
                    subText: 'Azure is connecting to the SBCs. It might take up to six minutes for the changes to take effect.'
                }}
            >
                <DialogFooter>
                    <PrimaryButton 
                        className="primary-button" 
                        onClick={() => setShowUploadedDialog(false)}>
                        Close
                    </PrimaryButton>
                </DialogFooter>
            </Dialog>
        </div>
    )
}



export default DirectRouting;