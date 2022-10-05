// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import {
  CallClient,
  Features,
  EnvironmentInfo,
  CallAgent,
  DeviceManager,
  DeviceAccess,
  Call,
  IncomingCall,
  AudioDeviceInfo,
  AcceptCallOptions,
  StartCallOptions
} from '@azure/communication-calling';
import {
  AzureCommunicationTokenCredential,
  CommunicationUserIdentifier,
  PhoneNumberIdentifier,
  UnknownIdentifier
} from '@azure/communication-common';
import { PrimaryButton, TextField, MessageBar, MessageBarType } from '@fluentui/react';
import IncomingCallCard from './IncomingCallCard';
import CallCard from './CallCard';
import Login from './Login';
import { setLogLevel, AzureLogger } from '@azure/logger';
import * as codeSamples from './CodeSamples';
import Card from './Card';
import DirectRouting from './DirectRouting/DirectRouting';
import AlternateCallerIdPicker from './AlternateCallerIdPicker';
import InboundCallingInput from './InboundCallingInput';
import { CommunicationUserToken } from '@azure/communication-identity';

let callClient: CallClient;
let callAgent: CallAgent;
let deviceManager: DeviceManager;
let logBuffer: string[] = [];

const MakeCall: React.FC = () => {
  const [environmentInfo, setEnvironmentInfo] = React.useState<EnvironmentInfo | undefined>();

  const [ufdMessages, setUfdMessages] = React.useState<string[]>([]);
  const [callError, setCallError] = React.useState<string>('');

  const [loggedIn, setLoggedIn] = React.useState<Boolean>(false);
  const [call, setCall] = React.useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = React.useState<IncomingCall | null>(null);
  const [permissions, setPermissions] = React.useState<DeviceAccess | null>(null);
  const [selectedSpeakerDeviceId, setSelectedSpeakerDeviceId] = React.useState<string>('');
  const [speakerDeviceOptions, setSpeakerDeviceOptions] = React.useState<AudioDeviceInfo[]>([]);
  const [selectedMicrophoneDeviceId, setSelectedMicrophoneDeviceId] = React.useState<string>('');
  const [microphoneDeviceOptions, setMicrophoneDeviceOptions] = React.useState<AudioDeviceInfo[]>([]);
  const [deviceManagerWarning, setDeviceManagerWarning] = React.useState<string>('');
  const [destinationPhoneIds, setDestinationPhoneIds] = React.useState<string>('');
  const [alternateCallerId, setAlternateCallerId] = React.useState<string>('');
  const [mri, setMri] = React.useState<string>('');

  const handleLogIn = async (client: CommunicationUserToken, displayName: string, clientTag: string): Promise<void> => {
    try {
      setLogLevel('verbose');
      const tokenCredential = new AzureCommunicationTokenCredential(client.token);
      setMri(client.user.communicationUserId);

      callClient = new CallClient({
        diagnostics: {
          appName: 'azure-communication-services',
          appVersion: '1.3.1-beta.1',
          tags: ['javascript_calling_sdk', `#clientTag:${clientTag}`]
        }
      });
      callAgent = await callClient.createCallAgent(tokenCredential, { displayName });
      setEnvironmentInfo(await callClient.getEnvironmentInfo());

      deviceManager = await callClient.getDeviceManager();
      setPermissions(await deviceManager.askDevicePermission({ audio: true, video: false }));

      callAgent.on('callsUpdated', (event) => {
        console.log(`callsUpdated, added=${event.added}, removed=${event.removed}`);

        event.added.forEach((_call) => {
          setCall(_call);

          const diagnosticChangedListener = (diagnosticInfo) => {
            const rmsg = `UFD Diagnostic changed:
                        Diagnostic: ${diagnosticInfo.diagnostic}
                        Value: ${diagnosticInfo.value}
                        Value type: ${diagnosticInfo.valueType}`;
            setUfdMessages((oldUfdMessages) => [...oldUfdMessages, rmsg]);
          };

          _call.feature(Features.UserFacingDiagnostics).media.on('diagnosticChanged', diagnosticChangedListener);
          _call.feature(Features.UserFacingDiagnostics).network.on('diagnosticChanged', diagnosticChangedListener);
        });

        event.removed.forEach((_call) => {
          displayCallEndReason(_call.callEndReason);
        });
      });
      callAgent.on('incomingCall', ({ incomingCall }) => {
        if (call != null) {
          incomingCall.reject();
          return;
        }

        setIncomingCall(incomingCall);

        incomingCall.on('callEnded', (args) => {
          displayCallEndReason(args.callEndReason);
        });
      });

      setLoggedIn(true);
    } catch (error) {
      console.error(error);
    }
  };

  const displayCallEndReason = (callEndReason) => {
    if (callEndReason.code !== 0 || callEndReason.subCode !== 0) {
      setCallError(`Call end reason: code: ${callEndReason.code}, subcode: ${callEndReason.subCode}`);
    }
    setCall(null);
    setIncomingCall(null);
  };

  const placeCall = async () => {
    try {
      // Turn all destinationUserIds and destinationPhoneIds into the right interfaces
      const identitiesToCall: (PhoneNumberIdentifier | CommunicationUserIdentifier | UnknownIdentifier)[] = [
        ...new Set(destinationPhoneIds.split(',').map((phoneId) => phoneId.trim()))
      ].map((phoneId) => ({ phoneNumber: phoneId }));

      const callOptions: StartCallOptions = await getCallOptions();

      if (alternateCallerId !== '') {
        callOptions.alternateCallerId = { phoneNumber: alternateCallerId.trim() };
      }
      callAgent.startCall(identitiesToCall, callOptions);
    } catch (error) {
      console.error('Failed to place a call', error);
      setCallError(`Failed to place a call: ${error}`);
    }
  };

  const downloadLog = async () => {
    const date = new Date();
    const fileName = `logs-${date.toISOString().slice(0, 19)}.txt`;
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logBuffer.join('\n')));
    element.setAttribute('download', fileName);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();
    document.body.removeChild(element);
    logBuffer = [];
  };

  const getCallOptions = async (): Promise<AcceptCallOptions> => {
    let callOptions: AcceptCallOptions = { audioOptions: { muted: false } };

    let speakerWarning: string | undefined = undefined;
    let microphoneWarning: string | undefined = undefined;

    // On iOS, device permissions are lost after a little while, so re-ask for permissions
    const permissions = await deviceManager.askDevicePermission({ audio: true, video: false });
    setPermissions(permissions);

    try {
      const speakers = await deviceManager.getSpeakers();
      const speakerDevice = speakers[0];
      if (!speakerDevice || speakerDevice.id === 'speaker:') {
        throw new Error('No speaker devices found.');
      } else if (speakerDevice) {
        setSelectedSpeakerDeviceId(speakerDevice.id);
        setSpeakerDeviceOptions(speakers);
        await deviceManager.selectSpeaker(speakerDevice);
      }
    } catch (error) {
      speakerWarning = (error as Error).message;
    }

    try {
      const microphones = await deviceManager.getMicrophones();
      if (microphones.length == 0 || microphones[0].id === 'microphone:') {
        throw new Error('No microphone devices found.');
      }
      setSelectedMicrophoneDeviceId(microphones[0].id);
      setMicrophoneDeviceOptions(microphones);
      await deviceManager.selectMicrophone(microphones[0]);
    } catch (error) {
      if (error instanceof Error) {
        microphoneWarning = error.message;
      }
    }

    if (speakerWarning || microphoneWarning) {
      setDeviceManagerWarning(`${speakerWarning ? speakerWarning + ' ' : ''}
                    ${microphoneWarning ? microphoneWarning + ' ' : ''}`);
    }

    return callOptions;
  };

  React.useEffect(() => {
    const identifier = setInterval(
      () =>
        setUfdMessages((oldUfdMessages) => {
          if (oldUfdMessages.length == 0) {
            return [];
          }
          return oldUfdMessages.slice(1);
        }),
      10000
    );
    return clearInterval(identifier);
  }, []);

  console.warn(`Call null: ${call == null}, incomingcall null: ${incomingCall == null}`);
  return (
    <div>
      <Login onLoggedIn={handleLogIn} />
      <Card title="Environment information" code={codeSamples.environmentInfo} showCodeIconName="Info">
        <h3>Current environment details</h3>
        <div>{`Operating system:   ${environmentInfo?.environment?.platform}.`}</div>
        <div>{`Browser:  ${environmentInfo?.environment?.browser}.`}</div>
        <div>{`Browser's version:  ${environmentInfo?.environment?.browserVersion}.`}</div>
        <br></br>
        <h3>Environment support verification</h3>
        <div>{`Operating system supported:  ${environmentInfo?.isSupportedPlatform}.`}</div>
        <div>{`Browser supported:  ${environmentInfo?.isSupportedBrowser}.`}</div>
        <div>{`Browser's version supported:  ${environmentInfo?.isSupportedBrowserVersion}.`}</div>
        <div>{`Current environment supported:  ${environmentInfo?.isSupportedEnvironment}.`}</div>
      </Card>
      <Card
        title="Placing and receiving calls"
        showCodeIconName="Download"
        code={codeSamples.callSampleCode}
        extraButton={
          <PrimaryButton
            className="primary-button"
            iconProps={{ iconName: 'Download', style: { verticalAlign: 'middle', fontSize: 'large' } }}
            text={`Get Logs`}
            onClick={downloadLog}
          ></PrimaryButton>
        }
        subTitle={`Permissions audio: ${permissions?.audio}`}
      >
        <div className="mb-2">
          Having provisioned an ACS Identity and initialized the SDK from the section above, you are now ready to place
          calls, join group calls, and receiving calls.
        </div>
        {callError.length > 0 && (
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline={false}
            onDismiss={() => setCallError('')}
            dismissButtonAriaLabel="Close"
          >
            <b>{callError}</b>
          </MessageBar>
        )}
        {deviceManagerWarning.length > 0 && (
          <MessageBar
            messageBarType={MessageBarType.warning}
            isMultiline={false}
            onDismiss={() => setDeviceManagerWarning('')}
            dismissButtonAriaLabel="Close"
          >
            <b>{deviceManagerWarning}</b>
          </MessageBar>
        )}
        {ufdMessages.length > 0 && (
          <MessageBar
            messageBarType={MessageBarType.warning}
            isMultiline={true}
            onDismiss={() => setUfdMessages([])}
            dismissButtonAriaLabel="Close"
          >
            <ul>
              {ufdMessages.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </MessageBar>
        )}
        {incomingCall == null && call == null && (
          <div className="ms-Grid-row mt-3">
            <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
              <h3 className="mb-1">Place a call</h3>
              <div>Enter an Identity to make a call to.</div>
              <div>You can specify multiple Identities to call by using "," separated values.</div>
              <div>If calling a Phone Identity, your Alternate Caller Id must be specified. </div>
              <div className="ms-Grid-row mb-3 mt-3 d-flex f-row">
                <div className="ms-Grid-col ms-lg6 ms-sm12 mt-auto">
                  <TextField
                    disabled={call || !loggedIn}
                    label="Destination Phone Identity or Phone Identities"
                    defaultValue={destinationPhoneIds}
                    onChange={(event) => setDestinationPhoneIds((event.target as HTMLTextAreaElement).value)}
                  />
                </div>
                <div className="ms-Grid-col ms-lg6 ms-sm12 alternate-id-field mt-auto">
                  <AlternateCallerIdPicker
                    disabled={call || !loggedIn}
                    label="Alternate Caller Id (For calling phone numbers only)"
                    onChange={(value) => setAlternateCallerId(value)}
                  />
                </div>
              </div>
              <PrimaryButton
                className="primary-button"
                iconProps={{ iconName: 'Phone', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                text="Place call"
                disabled={call || !loggedIn}
                onClick={placeCall}
              />
            </div>
            <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
              <InboundCallingInput mri={mri} disabled={call || !loggedIn} />
            </div>
          </div>
        )}
        {call != null && (
          <CallCard
            call={call}
            deviceManager={deviceManager}
            selectedSpeakerDeviceId={selectedSpeakerDeviceId}
            speakerDeviceOptions={speakerDeviceOptions}
            microphoneDeviceOptions={microphoneDeviceOptions}
            selectedMicrophoneDeviceId={selectedMicrophoneDeviceId}
          />
        )}
        {incomingCall != null && call == null && (
          <IncomingCallCard
            incomingCall={incomingCall}
            getCallOptions={getCallOptions}
            onReject={() => setIncomingCall(null)}
          />
        )}
      </Card>
      <Card title="Configure Direct Routing" showCodeIconName="BranchMerge" code={codeSamples.directRoutingCode}>
        <DirectRouting />
      </Card>
    </div>
  );
};

export default MakeCall;

// override logger to be able to dowload logs locally
AzureLogger.log = (...args) => {
  logBuffer.push(...args);
  if (args[0].startsWith('azure:ACS:info')) {
    console.info(...args);
  } else if (args[0].startsWith('azure:ACS:verbose')) {
    console.debug(...args);
  } else if (args[0].startsWith('azure:ACS:warning')) {
    console.warn(...args);
  } else if (args[0].startsWith('azure:ACS:error')) {
    console.error(...args);
  } else {
    console.log(...args);
  }
};
