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
  CommunicationUserKind,
  PhoneNumberKind,
  UnknownIdentifierKind
} from '@azure/communication-common';
import { CommunicationUserToken } from '@azure/communication-identity';
import { SipTrunk, SipTrunkRoute } from '@azure/communication-phone-numbers';


type DotNetCommunicationUserIdentifierAndToken = {
  accessToken: {
    expiresOn: string
    token: string
  }
  user: {
    id: string
    rawId: string
  }
}

type DirectRoutingConfig = {
  trunks: SipTrunk[]
  routes: SipTrunkRoute[]
}

export const utils = {
  getAppServiceUrl: (): string => {
    return window.location.origin;
  },
  provisionNewUser: async (userId?: string): Promise<CommunicationUserToken> => {
    let response = await fetch('/tokens/provisionUser', {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Invalid token response.');
    }

    // Translate from the .NET CommunicationUserIdentifierAndToken class 
    // to the typescript CommunicationUserToken interface
    const client: DotNetCommunicationUserIdentifierAndToken = await response.json();
    const result: CommunicationUserToken = {
      user: { communicationUserId: client.user.id },
      token: client.accessToken.token,
      expiresOn: new Date(client.accessToken.expiresOn)
    }
    return result;
  },
  getIdentifierText: (identifier: CommunicationIdentifierKind): string => {
    if (isCommunicationUserIdentifier(identifier)) {
      return identifier.communicationUserId;
    } else if (isPhoneNumberIdentifier(identifier)) {
      return identifier.phoneNumber;
    } else if (isMicrosoftTeamsUserIdentifier(identifier)) {
      return identifier.microsoftTeamsUserId;
    } else if (isUnknownIdentifier(identifier) && identifier.id === '8:echo123') {
      return 'Echo Bot';
    } else {
      return 'Unknown Identifier';
    }
  },
  getSizeInBytes(str: string): number {
    return new Blob([str]).size;
  },
  getRemoteParticipantObjFromIdentifier(
    call: Call,
    identifier: CommunicationIdentifierKind
  ): RemoteParticipant | undefined {
    switch (identifier.kind) {
      case 'communicationUser': {
        return call.remoteParticipants.find(
          (rm) => (rm.identifier as CommunicationUserKind).communicationUserId === identifier.communicationUserId
        );
      }
      case 'microsoftTeamsUser': {
        return call.remoteParticipants.find(
          (rm) => (rm.identifier as MicrosoftTeamsUserKind).microsoftTeamsUserId === identifier.microsoftTeamsUserId
        );
      }
      case 'phoneNumber': {
        return call.remoteParticipants.find(
          (rm) => (rm.identifier as PhoneNumberKind).phoneNumber === identifier.phoneNumber
        );
      }
      case 'unknown': {
        return call.remoteParticipants.find((rm) => (rm.identifier as UnknownIdentifierKind).id === identifier.id);
      }
    }
  },
  registerInboundPhoneNumber: async (phoneNumber: string, mri: string): Promise<void> => {
    let response = await fetch(
      '/configure?' +
        new URLSearchParams({
          phoneNumber,
          mri
        }),
      {
        method: 'POST',
        body: '',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Could not link phone number to this application.');
    }
  },
  setDirectRoutingRules: async (trunks: SipTrunk[], routes: SipTrunkRoute[]): Promise<void> => {
    let response = await fetch('/routing', {
      method: 'POST',
      body: JSON.stringify({ trunks, routes }),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error('Could not set the direct routing configuration.');
    }
  },
  getTrunksAndRoutes: async (): Promise<DirectRoutingConfig> => {
    let response = await fetch('/routing', {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      }
    })
    if (!response.ok) {
      throw new Error('Could not retrieve the direct routing configuration.');
    }

    return await response.json();
  },
  getPhoneNumbers: async(): Promise<string[]> => {
    let response = await fetch('/phonenumbers', {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    })
    if (!response.ok) {
      throw new Error('Could not retrieve the existing phone numbers.');
    }
    return await response.json();
  }
};
