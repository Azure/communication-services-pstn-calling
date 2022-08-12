import { Checkbox, Dropdown, PrimaryButton, ScrollablePaneContext, TextField } from '@fluentui/react';
import React from 'react';
import SBCView, { SBCViewHeader } from './SBCView';
import VoiceRoutes, { VoiceRoutesHeader } from './VoiceRoutes';

//
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
    const nonEmptySbcList = sbcList.filter(sbc => sbc.fqdn.length > 0);

    const onSbcChange = (field, sbc, newValue) => setSbcList((oldList) => {
        const isEditingLastValue = getNewKey(oldList) - 1 == sbc.key;

        // Create a new list consisting of the old list with the element filtered
        // out, and add the element again. Lastly, make sure they are in the right
        // order again.
        // Also check whether the last value is being edited, and add a new value if necessary
        return [
            ...oldList.filter(value => value.key !== sbc.key),
            {...sbc, [field]: newValue},
            ...(isEditingLastValue ? [{...emptySBC, key: getNewKey(oldList)}] : [])
        ].sort((a, b) => a.key - b.key);
    })


    const onVoiceRouteChange = (field, voiceRoute, newValue) => setVoiceRoutes((oldList) => {
        const isEditingLastValue = getNewKey(oldList) - 1 == voiceRoute.key;
        debugger;
        // Create a new list consisting of the old list with the element filtered
        // out, and add the element again. Lastly, make sure they are in the right
        // order again.
        // Also check whether the last value is being edited, and add a new value if necessary
        return [
            ...oldList.filter(value => value.key !== voiceRoute.key),
            {...voiceRoute, [field]: newValue},
            ...(isEditingLastValue ? [{...emptyVoiceRoute, key: getNewKey(oldList)}] : [])
        ].sort((a, b) => a.key - b.key);
    })

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
        ].sort((a, b) => a.key - b.key)
    })

    const onSbcDelete = (key) => () => setSbcList((oldList) => {
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

    return (
        <div className="ms-Grid-row mt-3">
            <div className="call-input-panel ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl6">
                <h3 className="mb-1">Session Border Controllers</h3>
                <div className="mb-3">Direct routing allows your Session Border Controllers (SBCs) to make calls through Azure Communication Services. Get started by adding your supported Session Border Controller (SBC).</div>
                
                <SBCViewHeader className="mt-1" />
                {sbcList.map(sbc => (
                    <SBCView 
                        key={sbc.key}
                        sbc={sbc}
                        disabled={disabled}
                        onChange={onSbcChange}
                        onDelete={onSbcDelete(sbc.key)} />
                ))}
            </div>
            <div className="call-input-panel ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl6">
                <h3 className="mb-1">Voice Routes</h3>
                <div className="mb-3">Azure Communication Services allows balancing and routing outgoing calls based on called number. Set voice routes to complete your direct routing configuration. Use the move up and move down buttons to set the priority of voice routes.</div>
                
                <VoiceRoutesHeader className="mt-1" />
                {voiceRoutes.map(route => (
                    <VoiceRoutes
                        key={route.key}
                        sbcs={nonEmptySbcList}
                        voiceRoute={route}
                        disabled={disabled}
                        onChange={onVoiceRouteChange}
                        onDelete={onVoiceRouteDelete(route.key)} />
                ))}
            </div>
        </div>
    )
}



export default DirectRouting;