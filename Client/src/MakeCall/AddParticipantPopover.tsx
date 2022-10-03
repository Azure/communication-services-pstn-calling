// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { TextField } from '@fluentui/react';
import { PrimaryButton } from '@fluentui/react'
import { Call } from "@azure/communication-calling";

type AddParticipantPopoverProps = {
    call: Call
}


const AddParticipantPopover: React.FC<AddParticipantPopoverProps> = ({ call }) => {
    const [userId, setUserId] = useState('');
    const [alternateCallerId, setAlternateCallerId] = useState('');
    const [showAddParticipantPanel, setShowAddParticipantPanel] = useState(false);

    const handleAddCommunicationUser = () => {
        console.log('handleAddCommunicationUser', userId);
        try {
            call.addParticipant({ communicationUserId: userId });
        } catch (error) {
            console.error(error);
        }
    }

    const handleAddPhoneNumber = () => {
        console.log('handleAddPhoneNumber', userId);
        try {
            call.addParticipant({ phoneNumber: userId }, { alternateCallerId: { phoneNumber: alternateCallerId }});
        } catch (error) {
            console.error(error);
        }
    }

    const toggleAddParticipantPanel = () => setShowAddParticipantPanel(!showAddParticipantPanel);

    return (
        <>
        <span><h3>Participants</h3></span>
        <span><a href="#" onClick={toggleAddParticipantPanel}><i className="add-participant-button ms-Icon ms-Icon--AddFriend" aria-hidden="true"></i></a></span>
        <div className="ms-Grid">
            <div className="ms-Grid-row">
                <div className="ms-Grid-col ms-lg12">
                    {
                        showAddParticipantPanel &&
                        <div className="add-participant-panel">
                            <h3 className="add-participant-panel-header">Add a participant</h3>
                            <div className="add-participant-panel-header">
                                <TextField className="text-left" label="Identifier" onChange={event => setUserId((event.target as HTMLTextAreaElement).value)} />
                                <TextField className="text-left" label="Alternate Caller Id (For adding phone number only)" onChange={event => setAlternateCallerId((event.target as HTMLTextAreaElement).value)} />
                                <PrimaryButton className="mt-3" onClick={handleAddCommunicationUser}>Add CommunicationUser</PrimaryButton>
                                <PrimaryButton className="mt-1" onClick={handleAddPhoneNumber}>Add Phone Number</PrimaryButton>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
        </>
    );
}

export default AddParticipantPopover;