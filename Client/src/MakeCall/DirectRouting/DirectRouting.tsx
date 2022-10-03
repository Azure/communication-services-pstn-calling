import { 
    PrimaryButton, 
    Dialog, 
    DialogType,
    DialogFooter
} from '@fluentui/react';
import { RestError } from '@azure/core-http';
import React from 'react';
import { SipRoutingClient, SipTrunkRoute } from '@azure/communication-phone-numbers';
import TrunkView, { 
    emptyTrunk,
    Trunk,
    TrunkViewHeader, 
    validateTrunks 
} from './TrunkView';
import VoiceRouteView, { 
    emptyVoiceRoute,
    validateVoiceRoutes, 
    VoiceRoute, 
    VoiceRoutesHeader, 
} from './VoiceRouteView';
import { utils } from '../../Utils/Utils'

/**
 * Get a new unused key for a given list.
 * In trunks and voiceRoutes, keys are being used to 
 * distinguish elements and their input fields.
 * This function finds an unused key if a new element is to be added.
 * It finds the highest key and adds one.
 * 
 * @param {} list the trunks or the voiceRoutes list.
 * @returns number of the new key.
 */
const getNewKey = (list: VoiceRoute[] | Trunk []) => list.length == 0 ? 0 : 
    list.map((element) => element.key).reduce((a, b) => Math.max(a, b.key), 0) + 1;

// Sip client that is initialized after the connectionString has been retrieved
let sipClient: SipRoutingClient | null = null;

type DirectRoutingPropsType = {
    disabled?: boolean
    className?: string
    style?: React.CSSProperties
}

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
const DirectRouting: React.FC<DirectRoutingPropsType> = ({ disabled: propsDisabled, className, style }) => {
    // Whether the Trunks (true) or the VoiceRoutes (false) are being edited
    const [isEditingTrunks, setEditingTrunks] = React.useState<boolean>(true);
    const [isDownloading, setDownloading] = React.useState<boolean>(true);
    const [isUploading, setUploading] = React.useState<boolean>(false);
    const [showUploadedDialog, setShowUploadedDialog] = React.useState<boolean>(false);
    const [dialogTitle, setDialogTitle] = React.useState<string>('');
    const [dialogMessage, setDialogMessage] = React.useState<string>('');

    // Variables for tracking the trunks and voice routes
    const [trunks, setTrunks] = React.useState<Trunk[]>([0, 1, 2].map((key) => ({...emptyTrunk, key})));
    const [voiceRoutes, setVoiceRoutes] = React.useState<VoiceRoute[]>([0, 1, 2].map(key => ({...emptyVoiceRoute, key})));

    // Variables for tracking the trunks with entered values
    const nonEmptyTrunks = trunks.filter(({fqdn, sipSignalingPort}) => fqdn.length > 0 || !isNaN(sipSignalingPort));
    const nonEmptyVoiceRoutes = voiceRoutes.filter(route => 
        route.name.length > 0 || route.numberPattern.length > 0 || (route.trunks != null && route.trunks.length > 0));
    // Check whether errors exist in the data.
    const isTrunksFaulty = nonEmptyTrunks.filter(({errors}) => errors && Object.keys(errors).length > 0).length > 0;
    const isVoicesRoutesFaulty = nonEmptyVoiceRoutes.filter(({errors}) => errors && Object.keys(errors).length > 0).length > 0
    const disabled = (propsDisabled != null || propsDisabled) || isUploading || isDownloading

    /**
     * Update a change to any Trunk field to the local Trunk variable.
     * 
     * @param {str} field the field that is being edited ('fqdn' or 'sipSignalingPort')
     * @param {trunk} trunk the trunk that is being edited. 
     * @param {str} newValue the new value to set the field of the trunk to.
     * @returns void
     */
    const onTrunkChange = (field: 'fqdn' | 'sipSignalingPort', trunk: Trunk, newValue: string) => setTrunks((oldList) => validateTrunks([
        // Create a new list consisting of the old list with the element filtered
        // out, and add the element again. Lastly, make sure they are in the right
        ...oldList.filter(value => value.key !== trunk.key),
        {...trunk, [field]: newValue},
        // Also check whether the last value is being edited, and add a new value if necessary
        ...(getNewKey(oldList) - 1 == trunk.key ? [{...emptyTrunk, key: getNewKey(oldList)}] : [])
    ]).sort((a, b) => a.key - b.key));

    /**
     * Update a change to any VoiceRoute field to the local VoiceRoute variable.
     * 
     * @param {str} field the field to update. Either name, numberPattern, or trunkKeys.
     * @param {voiceRoute} voiceRoute the voiceRoute to edit. 
     * @param {str, boolean} newValue the value to set the field of the voiceRoute to
     * @returns void
     */
    const onVoiceRouteChange = (field: string, voiceRoute: VoiceRoute, newValue: string | string[]) => setVoiceRoutes((oldList) => validateVoiceRoutes([
        // Create a new list consisting of the old list with the element filtered
        // out, and add the element again. Lastly, make sure they are in the right
        // order again.
        ...oldList.filter(value => value.key !== voiceRoute.key),
        {...voiceRoute, [field]: newValue},
        // Also check whether the last value is being edited, and add a new value if necessary
        ...(getNewKey(oldList) - 1 == voiceRoute.key ? [{...emptyVoiceRoute, key: getNewKey(oldList)}] : [])
    ]).sort((a, b) => a.key - b.key));

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
        return validateVoiceRoutes([
            ...oldList.filter(route => route.key !== key), 
            ...(oldList.length == 3 ? [{...emptyVoiceRoute, key}] : [])
        ]).sort((a, b) => a.key - b.key);
    })

    /**
     * Delete an Trunk from the local variables.
     * Does not delete an trunk if it is the last one (that one is always empty).
     * Only empties the trunk if there are only three left.
     * Also checks if there is any voice route referencing this trunk.
     * 
     * @param {number} key the key of the trunk to delete.
     * @returns void
     */
    const onTrunkDelete = (key) => () => {
        const trunk = trunks.find((t) => t.key == key);
        if (trunk == null) {
            return;
        }

        // Delete Trunk from the list
        setTrunks((oldList) => {
            // Do not delete if the newest row is being deleted
            if (getNewKey(oldList) - 1 == key) {
                return oldList;
            }

            // Delete the row from the array, unless only three items are left
            // In that case, just empty the row.
            return validateTrunks([
                ...oldList.filter(trunk => trunk.key !== key), 
                ...(oldList.length == 3 ? [{...emptyTrunk, key}] : [])
            ]).sort((a, b) => a.key - b.key)
        })

        // Delete the reference to this Trunk from any VoiceRoute still referencing it
        setVoiceRoutes((oldRoutes) => {
            let newRoutes = [
            ...oldRoutes.filter(route => route.trunks == null || !route.trunks.includes(trunk.fqdn)),
            ...oldRoutes.filter((route) => route.trunks != null && route.trunks.includes(trunk.fqdn))
                .map((route) => ({
                    ...route,
                    trunks: route.trunks == null ? undefined : route.trunks.filter(fqdn => fqdn != trunk.fqdn)
                }))
            ];
            while (newRoutes.length < 3) {
                newRoutes = [...newRoutes, {...emptyVoiceRoute, key: getNewKey(newRoutes)}];
            }
            return validateVoiceRoutes(newRoutes).sort((a, b) => a.key - b.key);
        })
    }
    
    /**
     * Upload the data when the user clicks on *Create*.
     */
    const onCreateClick = async () => {
        if (sipClient == null) {
            return;
        }
        setUploading(true);
        
        // Find the new trunks and routes that have been created
        // Delete the key and errors fields from the trunk
        // and parse the sipSignaling port to an int
        const trunks = nonEmptyTrunks.map(({fqdn, sipSignalingPort}) => ({ fqdn, sipSignalingPort }));

        // Delete the key and errors fields from the routes
        // and find the FQDNs of the selected trunks
        const routes: SipTrunkRoute[] = nonEmptyVoiceRoutes.map(({ name, numberPattern, trunks }) => ({ name, numberPattern, trunks }));

        try {
            // TODO enable await sipClient.setRoutes([]);
            await sipClient.setTrunks(trunks);
            await sipClient.setRoutes(routes);
            setDialogTitle('Upload Successful');
            setDialogMessage('Azure is connecting to the Trunks. It might take up to six minutes for the changes to take effect.');
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error)}`);
            if (error instanceof RestError) {
                setDialogTitle('Uploading Failed.')
                if (error.code == 'REQUEST_SEND_ERROR') {
                    setDialogMessage('Could not connect to Azure. Please check your internet connection.');
                    return;
                }
                if (error.response?.status == 422) {
                    setDialogMessage(error.response?.parsedBody.error.innerError.message);
                    return;
                }
            }
            setDialogMessage('Unknown error occurred.');
        }
        setUploading(false);
        setShowUploadedDialog(true);
    }

    /**
     * Download the current settings from Azure.
     * First retrieves the *connectionString* from the server, and then 
     * uses this to retrieve the trunks (Trunks) and the Voice Routes from Azure.
     */
    const downloadData = async () => {
        setDownloading(true);

        // Retrieve the connectionString, and the trunks and routes
        const { connectionString } = await utils.getConnectionString();
        sipClient = new SipRoutingClient(connectionString);
        const trunks = await sipClient.getTrunks();
        const routes = await sipClient.getRoutes();

        // Create a list of Trunks from the list of trunks
        // Parse the ports to strings, and add a key
        // The key is an internally used unique identifier for the trunk
        let newTrunks = trunks.map((trunk, key) => ({ ...trunk, key }));
        // Make sure at least three trunks are shown
        while (newTrunks.length < 3) {
            newTrunks = [...newTrunks, {...emptyTrunk, key: newTrunks.length}];
        }

        // Add a key to the voiceroutes (same as with Trunks) and
        // And change the fqdn list in the trunks field to this the key of the right trunk
        // This way the voice route points to the correct Trunk
        let newVoiceRoutes = routes.map(({trunks, ...route}, key) => ({ ...route, key }));
        while (newVoiceRoutes.length < 3) {
            newVoiceRoutes = [...newVoiceRoutes, {...emptyVoiceRoute, key: newVoiceRoutes.length}];
        }
        setTrunks(newTrunks);
        setVoiceRoutes(newVoiceRoutes);
        setDownloading(false);
    }

    // Download the data when the page loads
    React.useEffect(() => {
        downloadData()
    }, []);
    return (
        <div className={className} style={style}>
            <div className="ms-Grid-row mt-3">
                <div className="call-input-panel ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl6">
                    
                    <h3 className="mb-1">Session Border Controllers</h3>
                    <div className="mb-3">Direct routing allows your Session Border Controllers (Trunks) to make calls through Azure Communication Services. Get started by adding your supported Session Border Controller (Trunk).</div>
                    
                    <TrunkViewHeader className="mt-1" />
                    {trunks.map(trunk => (
                        <TrunkView 
                            key={trunk.key}
                            trunk={trunk}
                            loading={isDownloading}
                            disabled={disabled || !isEditingTrunks}
                            onChange={onTrunkChange}
                            onDelete={onTrunkDelete(trunk.key)} />
                    ))}

                    <div>
                        <PrimaryButton
                            style={{float: 'right'}}
                            className="primary-button w-auto"
                            disabled={disabled || !isEditingTrunks || isTrunksFaulty}
                            onClick={() => setEditingTrunks(false)}>
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
                            trunks={nonEmptyTrunks}
                            voiceRoute={route}
                            loading={isDownloading}
                            disabled={disabled || isEditingTrunks}
                            onChange={onVoiceRouteChange}
                            onDelete={onVoiceRouteDelete(route.key)} />
                    ))}

                    <div>
                        <PrimaryButton 
                            style={{float: 'left'}} 
                            className="primary-button w-auto"
                            disabled={disabled || isEditingTrunks}
                            onClick={() => setEditingTrunks(true)}>
                            Back
                        </PrimaryButton>
                        <PrimaryButton 
                            style={{float: 'right'}} 
                            className="primary-button w-auto"
                            disabled={disabled || isEditingTrunks || isVoicesRoutesFaulty}
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
                    title: dialogTitle,
                    closeButtonAriaLabel: 'Close',
                    subText: dialogMessage
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