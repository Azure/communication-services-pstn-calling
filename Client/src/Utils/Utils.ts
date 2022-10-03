// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Call, RemoteParticipant } from '@azure/communication-calling';
import {
    isCommunicationUserIdentifier,
    isPhoneNumberIdentifier,
    isMicrosoftTeamsUserIdentifier,
    isUnknownIdentifier,
    CommunicationIdentifierKind,
    MicrosoftTeamsUserKind,
    UnknownIdentifier,
    CommunicationUserKind,
    PhoneNumberKind,
    UnknownIdentifierKind
} from '@azure/communication-common';
import { CommunicationUserToken } from '@azure/communication-identity';

type ConnectionStringType = {
    connectionString: string
}

let connectionString = {
    connectionString: '',
};

export const utils = {
    getAppServiceUrl: (): string => {
        return window.location.origin;
    },
    provisionNewUser: async (userId: string): Promise<CommunicationUserToken> => {
        let response = await fetch('/tokens/provisionUser', {
            method: 'POST',
            body: JSON.stringify({ userId }),
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            return await response.json();
        }
        throw new Error('Invalid token response');
    },
    getIdentifierText: (identifier: CommunicationIdentifierKind): string => {
        if (isCommunicationUserIdentifier(identifier)) {
            return identifier.communicationUserId;
        } else if (isPhoneNumberIdentifier(identifier)) {
            return identifier.phoneNumber;
        } else if (isMicrosoftTeamsUserIdentifier(identifier)) {
            return identifier.microsoftTeamsUserId;
        } else if (isUnknownIdentifier(identifier) && identifier.id === '8:echo123'){
            return 'Echo Bot';
        } else {
            return 'Unknown Identifier';
        }
    },
    getSizeInBytes(str: string): number {
        return new Blob([str]).size;
    },
    getRemoteParticipantObjFromIdentifier(call: Call, identifier: CommunicationIdentifierKind): RemoteParticipant | undefined {
        switch(identifier.kind) {
            case 'communicationUser': {
                return call.remoteParticipants.find(rm =>
                    (rm.identifier as CommunicationUserKind).communicationUserId === identifier.communicationUserId
                );
            }
            case 'microsoftTeamsUser': {
                return call.remoteParticipants.find(rm =>
                    (rm.identifier as MicrosoftTeamsUserKind).microsoftTeamsUserId === identifier.microsoftTeamsUserId
                );
            }
            case 'phoneNumber': {
                return call.remoteParticipants.find(rm =>
                    (rm.identifier as PhoneNumberKind).phoneNumber === identifier.phoneNumber
                );
            }
            case 'unknown': {
                return call.remoteParticipants.find(rm =>
                    (rm.identifier as UnknownIdentifierKind).id === identifier.id
                );
            }
        }
    },
    getConnectionString: async (): Promise<ConnectionStringType> => {
        if (connectionString.connectionString.length > 0) {
            return connectionString;
        }
        let response = await fetch('/connectionString', {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            connectionString = await response.json() as ConnectionStringType;
            return connectionString;
        }
        throw new Error('Invalid connectionString response');
    },
    registerInboundPhoneNumber: async (phoneNumber: string, mri: string): Promise<void> => {
        let response = await fetch('/configure?'  + new URLSearchParams({
            phoneNumber,
            mri
        }), {
            method: 'POST',
            body: '',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error('Could not link phone number to this application.');
        }
    }
}
