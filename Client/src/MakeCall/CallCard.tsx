// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import AddParticipantPopover from './AddParticipantPopover';
import RemoteParticipantCard from './RemoteParticipantCard';
import { Panel, PanelType } from '@fluentui/react/lib/Panel';
import { Icon } from '@fluentui/react/lib/Icon';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import {
  Features,
  LocalAudioStream,
  Call,
  DeviceManager,
  CallState,
  RemoteParticipant,
  AudioDeviceInfo
} from '@azure/communication-calling';
import { utils } from '../Utils/Utils';

let callFinishConnectingResolve: null | ((value: void | PromiseLike<void>) => void) = null;

type CallCardPropType = {
  call: Call;
  deviceManager: DeviceManager;
  speakerDeviceOptions: AudioDeviceInfo[];
  microphoneDeviceOptions: AudioDeviceInfo[];
  selectedSpeakerDeviceId: string;
  selectedMicrophoneDeviceId: string;
};

const CallCard: React.FC<CallCardPropType> = ({
  call,
  deviceManager,
  speakerDeviceOptions: propsSpeakerDeviceOptions,
  microphoneDeviceOptions: propsMicrophoneDeviceOptions,
  selectedSpeakerDeviceId: propsSelectedSpeakerDeviceId,
  selectedMicrophoneDeviceId: propsSelectedMicrophoneDeviceId
}) => {
  const [callState, setCallState] = React.useState<CallState>(call.state);
  const [callId, setCallId] = React.useState<string>(call.id);
  const [remoteParticipants, setRemoteParticipants] = React.useState<readonly RemoteParticipant[]>(
    call.remoteParticipants
  );
  const [isMicMuted, setMicMuted] = React.useState<boolean>(false);
  const [isIncomingAudioMuted, setIncomingAudioMuted] = React.useState<boolean>(false);
  const [isOutgoingAudioMediaAccessActive, setOutgoingMediaAccessActive] = React.useState<boolean>(false);
  const [selectedSpeakerDeviceId, setSelectedSpeakerDeviceId] = React.useState<string>(propsSelectedSpeakerDeviceId);
  const [speakerDeviceOptions, setSpeakerDeviceOptions] = React.useState<AudioDeviceInfo[]>(
    propsSpeakerDeviceOptions != null ? propsSpeakerDeviceOptions : []
  );
  const [microphoneDeviceOptions, setMicrophoneDeviceOptions] = React.useState<AudioDeviceInfo[]>(
    propsMicrophoneDeviceOptions != null ? propsMicrophoneDeviceOptions : []
  );
  const [selectedMicrophoneDeviceId, setSelectedMicrophoneDeviceId] = React.useState<string>(
    propsSelectedMicrophoneDeviceId
  );
  const [showSettings, setShowSettings] = React.useState<boolean>(false);
  const [callMessage, setCallMessage] = React.useState<string>('');
  const [isDominantSpeakerMode, setDominantSpeakerMode] = React.useState<boolean>(false);
  const [dominantRemoteParticipant, setDominantRemoteParticipant] = React.useState<RemoteParticipant | undefined>(
    undefined
  );

  const subscribeToRemoteParticipant = (participant: RemoteParticipant) => {
    if (!remoteParticipants.includes(participant)) {
      setRemoteParticipants((oldRP) => [...oldRP, participant]);
    }

    participant.on('displayNameChanged', () => {
      console.log('displayNameChanged ', participant.displayName);
    });

    participant.on('stateChanged', () => {
      console.log('Participant state changed', JSON.stringify(participant.identifier), participant.state);
    });
  };

  const handleMicOnOff = async (): Promise<void> => {
    try {
      if (!call.isMuted) {
        await call.mute();
      } else {
        await call.unmute();
      }
      setMicMuted(call.isMuted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleIncomingAudioOnOff = async (): Promise<void> => {
    try {
      if (!call.isIncomingAudioMuted) {
        await call.muteIncomingAudio();
      } else {
        await call.unmuteIncomingAudio();
      }
      setIncomingAudioMuted(call.isIncomingAudioMuted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleHoldUnhold = (): void => {
    try {
      if (call.state === 'LocalHold') {
        call.resume();
      } else {
        call.hold();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOutgoingAudioEffect = (): void => {
    if (isOutgoingAudioMediaAccessActive) {
      call.stopAudio();
    } else {
      startOutgoingAudioEffect();
    }
    setOutgoingMediaAccessActive((v) => !v);
  };

  const getDummyAudioStreamTrack = (): MediaStreamTrack => {
    const context = new AudioContext();
    const dest = context.createMediaStreamDestination();
    const os = context.createOscillator();
    os.type = 'sine';
    os.frequency.value = 500;
    os.connect(dest);
    os.start();
    const { stream } = dest;
    const track = stream.getAudioTracks()[0];
    return track;
  };

  const startOutgoingAudioEffect = (): void => {
    const track = getDummyAudioStreamTrack();
    const localAudioStream = new LocalAudioStream(track);
    call.startAudio(localAudioStream);
  };

  const toggleDominantSpeakerMode = async () => {
    try {
      if (isDominantSpeakerMode) {
        // Turn off dominant speaker mode
        setDominantSpeakerMode(false);
        // Render all remote participants's streams
      } else {
        // Turn on dominant speaker mode
        setDominantSpeakerMode(true);
        // Dispose of all remote participants's stream renderers
        const dominantSpeakerIdentifier = call.feature(Features.DominantSpeakers).dominantSpeakers.speakersList[0];
        if (!dominantSpeakerIdentifier) {
          // Return, no action needed
          return;
        }

        // Set the dominant remote participant obj
        const dominantRemoteParticipant = utils.getRemoteParticipantObjFromIdentifier(call, dominantSpeakerIdentifier);
        if (dominantRemoteParticipant != null) {
          setDominantRemoteParticipant(dominantRemoteParticipant);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const speakerDeviceSelectionChanged = async (
    event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption
  ): Promise<void> => {
    if (option == null) {
      return;
    }
    const speakers = await deviceManager.getSpeakers();
    const speakerDeviceInfo = speakers.find((speakerDeviceInfo) => speakerDeviceInfo.id === option.key);
    if (speakerDeviceInfo != null) {
      deviceManager.selectSpeaker(speakerDeviceInfo);
      setSelectedSpeakerDeviceId(speakerDeviceInfo.id);
    }
  };

  const microphoneDeviceSelectionChanged = async (
    event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption
  ): Promise<void> => {
    if (option == null) {
      return;
    }
    const microphones = await deviceManager.getMicrophones();
    const microphoneDeviceInfo = microphones.find((microphoneDeviceInfo) => microphoneDeviceInfo.id === option.key);
    if (microphoneDeviceInfo != null) {
      deviceManager.selectMicrophone(microphoneDeviceInfo);
      setSelectedMicrophoneDeviceId(microphoneDeviceInfo.id);
    }
  };

  React.useEffect(() => {
    if (call != null) {
      deviceManager.on('audioDevicesUpdated', (event) => {
        setSpeakerDeviceOptions((oldOptions) => [
          /// Remove from oldOptions all speakers in event.removed
          ...oldOptions.filter((oldOption) => event.removed.some((removedOption) => oldOption.id == removedOption.id)),
          // Add the speakers
          ...event.added.filter((d) => d.deviceType === 'Speaker')
        ]);
        setMicrophoneDeviceOptions((oldOptions) => [
          /// Remove from oldOptions all microphones in event.removed
          ...oldOptions.filter((oldOption) => event.removed.some((removedOption) => oldOption.id == removedOption.id)),
          // Add the new microphones
          ...event.added.filter((d) => d.deviceType === 'Microphone')
        ]);
      });

      deviceManager.on('selectedSpeakerChanged', () => {
        setSelectedSpeakerDeviceId(deviceManager.selectedSpeaker ? deviceManager.selectedSpeaker.id : '');
      });

      deviceManager.on('selectedMicrophoneChanged', () => {
        setSelectedMicrophoneDeviceId(deviceManager.selectedMicrophone ? deviceManager.selectedMicrophone.id : '');
      });

      const callStateChanged = () => {
        console.log('Call state changed ', call.state);
        setCallState(call.state);

        if (call.state !== 'None' && call.state !== 'Connecting' && call.state !== 'Ringing') {
          if (callFinishConnectingResolve) {
            callFinishConnectingResolve();
          }
        }
        if (call.state === 'Ringing') {
          setSelectedSpeakerDeviceId('');
          setSelectedMicrophoneDeviceId('');
        }

        if (call.state === 'Disconnected') {
          setDominantRemoteParticipant(undefined);
        }
      };
      callStateChanged();
      call.on('stateChanged', callStateChanged);

      call.on('idChanged', () => {
        console.log('Call id Changed ', call.id);
        setCallId(call.id);
      });

      call.on('isMutedChanged', () => {
        console.log('Local microphone muted changed ', call.isMuted);
        setMicMuted(call.isMuted);
      });

      call.on('isIncomingAudioMutedChanged', () => {
        console.log('Incoming audio muted changed  ', call.isIncomingAudioMuted);
        setIncomingAudioMuted(call.isIncomingAudioMuted);
      });

      call.remoteParticipants.forEach((rp) => subscribeToRemoteParticipant(rp));
      call.on('remoteParticipantsUpdated', (event) => {
        console.log(`Call=${call.id}, remoteParticipantsUpdated, added=${event.added}, removed=${event.removed}`);
        event.added.forEach((p) => {
          console.log('participantAdded', p);
          subscribeToRemoteParticipant(p);
        });
        event.removed.forEach((p) => {
          console.log('participantRemoved', p);
          if (p.callEndReason) {
            setCallMessage(
              (prevMessage) => `${prevMessage ? prevMessage + `\n` : ``}
                            Remote participant ${utils.getIdentifierText(p.identifier)} disconnected: code: ${
                p.callEndReason?.code
              }, subCode: ${p.callEndReason?.subCode}.`
            );
          }
          setRemoteParticipants(remoteParticipants.filter((remoteParticipant) => remoteParticipant !== p));
        });
      });

      const dominantSpeakersChangedHandler = async () => {
        try {
          if (isDominantSpeakerMode) {
            const newDominantSpeakerIdentifier = call.feature(Features.DominantSpeakers).dominantSpeakers
              .speakersList[0];
            if (newDominantSpeakerIdentifier) {
              console.log(
                `DominantSpeaker changed, new dominant speaker: ${
                  newDominantSpeakerIdentifier ? utils.getIdentifierText(newDominantSpeakerIdentifier) : `None`
                }`
              );
              // Set the new dominant remote participant
              const newDominantRemoteParticipant = utils.getRemoteParticipantObjFromIdentifier(
                call,
                newDominantSpeakerIdentifier
              );
              setDominantRemoteParticipant(newDominantRemoteParticipant);
            } else {
              console.warn('New dominant speaker is undefined');
            }
          }
        } catch (error) {
          console.error(error);
        }
      };

      const dominantSpeakerIdentifier = call.feature(Features.DominantSpeakers).dominantSpeakers.speakersList[0];
      if (dominantSpeakerIdentifier) {
        setDominantRemoteParticipant(utils.getRemoteParticipantObjFromIdentifier(call, dominantSpeakerIdentifier));
      }
      call.feature(Features.DominantSpeakers).on('dominantSpeakersChanged', dominantSpeakersChangedHandler);
    }
  }, []);

  return (
    <div className="ms-Grid mt-2">
      <div className="ms-Grid-row">
        {callMessage.length > 0 && (
          <MessageBar
            messageBarType={MessageBarType.warning}
            isMultiline={true}
            onDismiss={() => setCallMessage('')}
            dismissButtonAriaLabel="Close"
          >
            <b>{callMessage}</b>
          </MessageBar>
        )}
      </div>
      <div className="ms-Grid-row">
        <div className="ms-Grid-col ms-lg6">
          <h2>{callState !== 'Connected' ? `${callState}...` : `Connected`}</h2>
        </div>
        <div className="ms-Grid-col ms-lg6 text-right">{call && <h2>Call Id: {callId}</h2>}</div>
      </div>
      <div className="ms-Grid-row">
        {callState === 'Connected' && (
          <div className="ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl3">
            <div className="participants-panel mt-1 mb-3">
              <Toggle
                label={
                  <div>
                    Dominant Speaker mode{' '}
                    <TooltipHost content={`Render the most dominant speaker's or render all remote participants`}>
                      <Icon iconName="Info" aria-label="Info tooltip" />
                    </TooltipHost>
                  </div>
                }
                styles={{
                  text: { color: '#edebe9' },
                  label: { color: '#edebe9' }
                }}
                inlineLabel
                onText="On"
                offText="Off"
                onChange={() => {
                  toggleDominantSpeakerMode();
                }}
              />
              {isDominantSpeakerMode && (
                <div>
                  Current dominant speaker:{' '}
                  {dominantRemoteParticipant ? utils.getIdentifierText(dominantRemoteParticipant.identifier) : `None`}
                </div>
              )}
              <div className="participants-panel-title custom-row text-center">
                <AddParticipantPopover call={call} />
              </div>
              {remoteParticipants.length === 0 && (
                <p className="text-center">No other participants currently in the call</p>
              )}
              <ul className="participants-panel-list">
                {remoteParticipants.map((remoteParticipant) => (
                  <RemoteParticipantCard
                    key={`${utils.getIdentifierText(remoteParticipant.identifier)}`}
                    remoteParticipant={remoteParticipant}
                    call={call}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}
        <div
          className={
            callState === 'Connected'
              ? `ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl9`
              : 'ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl12'
          }
        >
          <div className="mb-2">
            {callState !== 'Connected' && (
              <div className="custom-row">
                <div className="ringing-loader mb-4"></div>
              </div>
            )}
            <div className="text-center">
              <span
                className="in-call-button"
                title={`${isMicMuted ? 'Unmute' : 'Mute'} your microphone`}
                // variant="secondary"
                onClick={() => handleMicOnOff()}
              >
                {isMicMuted && <Icon iconName="MicOff2" />}
                {!isMicMuted && <Icon iconName="Microphone" />}
              </span>
              <span
                className="in-call-button"
                title={`${isIncomingAudioMuted ? 'Unmute' : 'Mute'} incoming audio`}
                // variant="secondary"
                onClick={() => handleIncomingAudioOnOff()}
              >
                {isIncomingAudioMuted && <Icon iconName="VolumeDisabled" />}
                {!isIncomingAudioMuted && <Icon iconName="Volume2" />}
              </span>
              {(callState === 'Connected' || callState === 'LocalHold' || callState === 'RemoteHold') && (
                <span
                  className="in-call-button"
                  title={`${callState === 'LocalHold' ? 'Unhold' : 'Hold'} call`}
                  // variant="secondary"
                  onClick={() => handleHoldUnhold()}
                >
                  {callState === 'LocalHold' && <Icon iconName="Pause" />}
                  {(callState === 'Connected' || callState === 'RemoteHold') && <Icon iconName="Play" />}
                </span>
              )}
              <span
                className="in-call-button"
                title="Settings"
                // variant="secondary"
                onClick={() => setShowSettings(true)}
              >
                <Icon iconName="Settings" />
              </span>
              <span className="in-call-button" onClick={() => call.hangUp()}>
                <Icon iconName="DeclineCall" />
              </span>
              <span
                className="in-call-button"
                title={`${
                  isOutgoingAudioMediaAccessActive ? 'Clear audio effect' : 'Apply outgoing audio effect'
                } to call`}
                // variant="secondary"
                onClick={() => handleOutgoingAudioEffect()}
              >
                {isOutgoingAudioMediaAccessActive && <Icon iconName="PlugConnected" />}
                {!isOutgoingAudioMediaAccessActive && <Icon iconName="PlugDisconnected" />}
              </span>
              <Panel
                type={PanelType.medium}
                isLightDismiss
                isOpen={showSettings}
                onDismiss={() => setShowSettings(false)}
                closeButtonAriaLabel="Close"
                headerText="Settings"
              >
                <div className="pl-2 mt-4">
                  <h3>Sound Settings</h3>
                  <div className="pl-2">
                    {callState === 'Connected' && (
                      <Dropdown
                        selectedKey={selectedSpeakerDeviceId}
                        onChange={speakerDeviceSelectionChanged}
                        options={speakerDeviceOptions.map((option) => ({ text: option.name, key: option.id }))}
                        label={'Speaker'}
                        placeHolder={
                          speakerDeviceOptions.length === 0 ? 'No speaker devices found' : selectedSpeakerDeviceId
                        }
                        styles={{ dropdown: { width: 400 } }}
                      />
                    )}
                    {callState === 'Connected' && (
                      <Dropdown
                        selectedKey={selectedMicrophoneDeviceId}
                        onChange={microphoneDeviceSelectionChanged}
                        options={microphoneDeviceOptions.map((option) => ({ text: option.name, key: option.id }))}
                        label={'Microphone'}
                        placeHolder={
                          microphoneDeviceOptions.length === 0
                            ? 'No microphone devices found'
                            : selectedMicrophoneDeviceId
                        }
                        styles={{ dropdown: { width: 400 } }}
                      />
                    )}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallCard;
