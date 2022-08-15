import { PrimaryButton } from '@fluentui/react';
import React from 'react';
import SBCView, { 
    SBCViewHeader, 
    validateSbcList 
} from './SBCView';
import VoiceRouteView, { 
    validateVoiceRoutes, 
    VoiceRoutesHeader, 
} from './VoiceRouteView';

const emptySBC = {
    key: null,
    fqdn: '',
    port: '',
}

const emptyVoiceRoute = {
    key: null,
    enabled: false,
    voiceRouteName: '',
    numberPattern: '',
    sbcKey: -1,
}

const getNewKey = (list) => list.length == 0 ? 0 : 
    list.reduce((a, b) => Math.max(a, b.key), 0) + 1;

const DirectRouting = ({ disabled }) => {
    // Whether the SBCs (true) or the VoiceRoutes (false) are being edited
    const [isEditingSbcs, setEditingSbcs] = React.useState(true);

    // Variables for tracking the sbcs
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
    let isSbcListFaulty, isVoicesRoutesFaulty, nonEmptySbcList, nonEmptyVoiceRoutes;
    try {
        nonEmptySbcList = sbcList.filter(({fqdn, port}) => fqdn.length > 0 || port.length > 0);
        nonEmptyVoiceRoutes = voiceRoutes.filter(route => 
        route.enabled || route.voiceRouteName.length > 0 || route.numberPattern.length > 0 || route.sbcKey != -1);
        // Check whether errors exist in the data.
        isSbcListFaulty = nonEmptySbcList.filter(({errors}) => errors != undefined).length > 0;
        isVoicesRoutesFaulty = nonEmptyVoiceRoutes.filter(({errors}) => errors != undefined).length > 0
    } catch (e) {
        debugger;
    }

    console.log(JSON.stringify(sbcList));

    /**
     * Update a change to any SBC field to the local SBC variable.
     * 
     * @param {str} field the field that is being edited ('fqdn' or 'port')
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
        const newList = [
            ...oldList.filter(value => value.key !== sbc.key),
            {...sbc, [field]: newValue},
            ...(isEditingLastValue ? [{...emptySBC, key: getNewKey(oldList)}] : [])
        ];
        const errors = validateSbcList(newList);
        return newList
            .map(sbc => ({...sbc, errors: errors[sbc.key]}))
            .sort((a, b) => a.key - b.key);
    })


    /**
     * Update a change to any VoiceRoute field to the local VoiceRoute variable.
     * 
     * @param {str} field the field to update. Either enabled, voiceRouteName, 
     *  numberPattern, or sbcKey.
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
        const newList = [
            ...oldList.filter(value => value.key !== voiceRoute.key),
            {...voiceRoute, [field]: newValue},
            ...(isEditingLastValue ? [{...emptyVoiceRoute, key: getNewKey(oldList)}] : [])
        ];
        const errors = validateVoiceRoutes(newList);
        return newList
            .map(route => ({...route, errors: errors[route.key]}))
            .sort((a, b) => a.key - b.key);
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
            ...oldList.filter(({sbcKey}) => sbcKey != key),
            ...oldList.filter(({sbcKey}) => sbcKey == key)
                .map(voiceRoute => ({...voiceRoute, sbcKey: -1}))
        ].sort((a, b) => a.key - b.key))
    }

    const onNextClick = () => {
        // TODO make work with errors
        if (isSbcListFaulty) {
            console.log(JSON.stringify(sbcErrors));
            return;
        }
        setEditingSbcs(false);
    }

    const createDirectRouting = () => {
        if (isVoicesRoutesFaulty) {
            console.log(JSON.stringify(voiceRouteErrors));
            return
        }
        // Todo upload
        console.log('Uploading!');
    }

    return (
        <div>
            <div className="ms-Grid-row mt-3">
                <div className="call-input-panel ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl6">
                    <h3 className="mb-1">Session Border Controllers</h3>
                    <div className="mb-3">Direct routing allows your Session Border Controllers (SBCs) to make calls through Azure Communication Services. Get started by adding your supported Session Border Controller (SBC).</div>
                    
                    <SBCViewHeader className="mt-1" />
                    {sbcList.map(sbc => (
                        <SBCView 
                            key={sbc.key}
                            sbc={sbc}
                            disabled={disabled || !isEditingSbcs}
                            onChange={onSbcChange}
                            onDelete={onSbcDelete(sbc.key)} />
                    ))}

                    <div>
                        <PrimaryButton
                            style={{float: 'right'}}
                            className="primary-button w-auto"
                            disabled={disabled || !isEditingSbcs || isSbcListFaulty}
                            onClick={onNextClick}>
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
                            onClick={createDirectRouting}>
                            Create
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    )
}



export default DirectRouting;