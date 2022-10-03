// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { utils } from '../Utils/Utils';
import { Persona, PersonaSize } from '@fluentui/react';
import { Icon } from '@fluentui/react/lib/Icon';
import { Call, RemoteParticipant, RemoteParticipantState } from '@azure/communication-calling';

type RemoteParticipantCardProps = {
  call: Call;
  remoteParticipant: RemoteParticipant;
};

const RemoteParticipantCard: React.FC<RemoteParticipantCardProps> = ({ call, remoteParticipant }) => {
  const [isSpeaking, setSpeaking] = React.useState<Boolean>(remoteParticipant.isSpeaking);
  const [state, setState] = React.useState<RemoteParticipantState>(remoteParticipant.state);
  const [isMuted, setMuted] = React.useState<boolean>(remoteParticipant.isMuted);
  const [displayName, setDisplayName] = React.useState<string | undefined>(remoteParticipant.displayName);

  const handleRemoveParticipant = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
    event.preventDefault();
    call.removeParticipant(remoteParticipant.identifier).catch((error) => console.error(error));
  };

  React.useEffect(() => {
    remoteParticipant.on('isMutedChanged', () => {
      setMuted(remoteParticipant.isMuted);
      if (remoteParticipant.isMuted) {
        setSpeaking(false);
      }
    });

    remoteParticipant.on('stateChanged', () => {
      setState(remoteParticipant.state);
    });

    remoteParticipant.on('isSpeakingChanged', () => {
      setSpeaking(remoteParticipant.isSpeaking);
    });

    remoteParticipant.on('displayNameChanged', () => {
      setDisplayName(remoteParticipant.displayName);
    });
  }, []);

  return (
    <li className={`participant-item`} key={utils.getIdentifierText(remoteParticipant.identifier)}>
      <div className="ms-Grid-row">
        <div className="ms-Grid-col ms-lg11 ms-sm10">
          <Persona
            className={isSpeaking ? `speaking-border-for-initials` : ``}
            size={PersonaSize.size40}
            text={displayName != null ? displayName : utils.getIdentifierText(remoteParticipant.identifier)}
            secondaryText={state}
            styles={{ primaryText: { color: '#edebe9' }, secondaryText: { color: '#edebe9' } }}
          />
        </div>
        <div className="ms-Grid-col ms-lg1 ms-sm2">
          {isMuted && <Icon className="icon-text-large" iconName="MicOff2" />}
          {!isMuted && <Icon className="icon-text-large" iconName="Microphone" />}
        </div>
      </div>
      <div className="text-right">
        <a href="#" onClick={handleRemoveParticipant} className="participant-remove float-right ml-3">
          Remove participant
        </a>
      </div>
    </li>
  );
};

export default RemoteParticipantCard;
