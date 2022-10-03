// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { CallClient, Features, EnvironmentInfo, CallAgent, DeviceManager, DeviceAccess, Call, IncomingCall, AudioDeviceInfo, AcceptCallOptions, StartCallOptions } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential, CommunicationUserIdentifier, PhoneNumberIdentifier, UnknownIdentifier } from '@azure/communication-common';
import {
    PrimaryButton,
    TextField,
    MessageBar,
    MessageBarType,
} from '@fluentui/react'
import { Icon } from '@fluentui/react/lib/Icon';
import IncomingCallCard from './IncomingCallCard';
import CallCard from './CallCard'
import Login from './Login';
import { setLogLevel, AzureLogger } from '@azure/logger';
import * as codeSamples from './CodeSamples';
import Card from './Card';
import DirectRouting from './DirectRoutes/DirectRouting';
import AlternateCallerIdPicker from './AlternateCallerIdPicker';
import InboundCallingInput from './InboundCallingInput';
import { CommunicationUserToken } from "@azure/communication-identity";

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
    const [destinationUserIds, setDestinationUserIds] = React.useState<string>('');
    const [alternateCallerId, setAlternateCallerId] = React.useState<string>('');
    const [destinationGroup, setDestinationGroup] = React.useState<string>('29228d3e-040e-4656-a70e-890ab4e173e5');
    const [meetingLink, setMeetingLink] = React.useState<string>('');
    const [meetingId, setMeetingId] = React.useState<string>('');
    const [threadId, setThreadId] = React.useState<string>('');
    const [messageId, setMessageId] = React.useState<string>('');
    const [organizerId, setOrganizerId] = React.useState<string>('');
    const [tenantId, setTenantId] = React.useState<string>('');
    const [mri, setMri] = React.useState<string>('');


    const handleLogIn = async (client: CommunicationUserToken, displayName: string, mri: string, clientTag: string): Promise<void> => {
        try {
            setLogLevel('verbose');
            const tokenCredential = new AzureCommunicationTokenCredential(client.token);
            setMri(mri);

            callClient = new CallClient({ diagnostics: { 
                appName: 'azure-communication-services', 
                appVersion: '1.3.1-beta.1',
                    tags: ["javascript_calling_sdk", `#clientTag:${clientTag}`] 
            } });
            callAgent = await callClient.createCallAgent(tokenCredential, { displayName });
            setEnvironmentInfo(await callClient.getEnvironmentInfo());

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
            deviceManager = await callClient.getDeviceManager();
            setPermissions(await deviceManager.askDevicePermission({ audio: true, video: false }));

            callAgent.on('callsUpdated', event => {
                console.log(`callsUpdated, added=${event.added}, removed=${event.removed}`);

                event.added.forEach(_call => {
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

                event.removed.forEach(_call => {
                    if (call != null && call === _call) {
                        displayCallEndReason(call.callEndReason);
                    }
                });
            });
            callAgent.on('incomingCall', ({ incomingCall }) => {
                if (call != null) {
                    incomingCall.reject();
                    return;
                }

                setIncomingCall(incomingCall);

                incomingCall.on('callEnded', args => {
                    displayCallEndReason(args.callEndReason);
                });

            });

            setLoggedIn(true);
        } catch (error) {
            console.error(error);
        }
    }

    const displayCallEndReason = (callEndReason) => {
        if (callEndReason.code !== 0 || callEndReason.subCode !== 0) {
            setCallError(`Call end reason: code: ${callEndReason.code}, subcode: ${callEndReason.subCode}`);
        }
        setCall(null);
        setIncomingCall(null);
    }

    const placeCall = async () => {
        try {
            // Turn all destinationUserIds and destinationPhoneIds into the right interfaces
            const identitiesToCall: (PhoneNumberIdentifier | CommunicationUserIdentifier | UnknownIdentifier)[] = [
                ...[...new Set(destinationUserIds.split(',').filter(userId => userId != null && userId.length > 0)
                .map(userId => userId.trim()))]
                .map(userId => userId == '8:echo123' ? { id: userId } : { communicationUserId: userId }),

                ...[...new Set(destinationPhoneIds.split(',').map(phoneId => phoneId.trim()))]
                .map(phoneId => ({phoneNumber: phoneId}))
            ];

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
    }

    const joinGroup = async () => {
        try {
            const callOptions = await getCallOptions();
            callAgent.join({ groupId: destinationGroup }, callOptions);
        } catch (error) {
            console.error('Failed to join a call', error);
            setCallError(`Failed to join a call: ${error}`);
        }
    };

    const joinTeamsMeeting = async () => {
        try {
            const callOptions = await getCallOptions();
            if (meetingLink && !messageId && !threadId && tenantId && organizerId) {
                callAgent.join({ meetingLink }, callOptions);
            } else if (meetingId && !meetingLink && !messageId && !threadId && tenantId && organizerId) {
                callAgent.join({ meetingId: meetingId }, callOptions);
            } else if (!meetingLink && messageId && threadId && tenantId && organizerId) {
                callAgent.join({
                    messageId: messageId,
                    threadId: threadId,
                    tenantId: tenantId,
                    organizerId: organizerId
                }, callOptions);
            } else {
                throw new Error('Please enter Teams meeting link or Teams meeting coordinate');
            }
        } catch (error) {
            console.error('Failed to join teams meeting:', error);
            setCallError(`Failed to join teams meeting: ${error}`);
        }
    }

    const getCallOptions = async (): Promise<AcceptCallOptions> => {
        let callOptions: AcceptCallOptions = { audioOptions: { muted: false }};

        let cameraWarning: string | undefined = undefined;
        let speakerWarning: string | undefined = undefined;
        let microphoneWarning: string | undefined = undefined;

        // On iOS, device permissions are lost after a little while, so re-ask for permissions
        const permissions = await deviceManager.askDevicePermission({ audio: true, video: true });
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
            if (error instanceof Error) {
                speakerWarning = error.message;
            }
        }

        try {
            const microphones = await deviceManager.getMicrophones();
            const microphoneDevice = microphones[0];
            if (!microphoneDevice || microphoneDevice.id === 'microphone:') {
                throw new Error('No microphone devices found.');
            }
            setSelectedMicrophoneDeviceId(microphoneDevice.id);
            setMicrophoneDeviceOptions(microphones);
            await deviceManager.selectMicrophone(microphoneDevice);
        } catch (error) {
            if (error instanceof Error) {
                microphoneWarning = error.message;
            }
        }

        if (cameraWarning || speakerWarning || microphoneWarning) {
            setDeviceManagerWarning(
                    `${cameraWarning ? cameraWarning + ' ' : ''}
                    ${speakerWarning ? speakerWarning + ' ' : ''}
                    ${microphoneWarning ? microphoneWarning + ' ' : ''}`
            );
        }

        return callOptions;
    }


    React.useEffect(() => {
        const identifier = setInterval(() => setUfdMessages((oldUfdMessages) => {
            if (oldUfdMessages.length == 0) {
                return [];
            }
            return oldUfdMessages.slice(1);
        }), 10000);
        return clearInterval(identifier);
    }, []);

    return (
        <div>
            <Login onLoggedIn={handleLogIn} />
            <Card title='Environment information' code={codeSamples.environmentInfo} showCodeIconName='Info'>
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
                title='Placing and receiving calls' 
                showCodeIconName='Download'
                code={codeSamples.callSampleCode} 
                extraButton={
                    <PrimaryButton
                        className="primary-button"
                        iconProps={{ iconName: 'Download', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                        text={`Get Logs`}
                        onClick={downloadLog}>
                    </PrimaryButton>
                } 
                subTitle={`Permissions audio: ${permissions?.audio} video: ${permissions?.video}`}
            >
                <div className="mb-2">Having provisioned an ACS Identity and initialized the SDK from the section above, you are now ready to place calls, join group calls, and receiving calls.</div>
                {
                    callError.length > 0 &&
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={false}
                        onDismiss={() => setCallError('')}
                        dismissButtonAriaLabel="Close">
                        <b>{callError}</b>
                    </MessageBar>
                }
                {
                    deviceManagerWarning.length > 0 &&
                    <MessageBar
                        messageBarType={MessageBarType.warning}
                        isMultiline={false}
                        onDismiss={() => setDeviceManagerWarning('')}
                        dismissButtonAriaLabel="Close">
                        <b>{deviceManagerWarning}</b>
                    </MessageBar>
                }
                {
                    ufdMessages.length > 0 &&
                    <MessageBar
                        messageBarType={MessageBarType.warning}
                        isMultiline={true}
                        onDismiss={() => setUfdMessages([])}
                        dismissButtonAriaLabel="Close">
                            <ul>
                                {ufdMessages.map(msg => <li key={msg}>{msg}</li>)}
                            </ul>
                    </MessageBar>
                }
                {
                    !incomingCall && !call &&
                    <div className="ms-Grid-row mt-3">
                        <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                            <h3 className="mb-1">Place a call</h3>
                            <div>Enter an Identity to make a call to.</div>
                            <div>You can specify multiple Identities to call by using "," separated values.</div>
                            <div>If calling a Phone Identity, your Alternate Caller Id must be specified. </div>
                            <TextField
                                disabled={call || !loggedIn}
                                label="Destination Identity or Identities"
                                defaultValue={destinationUserIds}
                                onChange={(event) => setDestinationUserIds((event.target as HTMLTextAreaElement).value)} />
                            <div className="ms-Grid-row mb-3 mt-3 d-flex f-row">
                                <div className="ms-Grid-col ms-lg6 ms-sm12 mt-auto">
                                    <TextField
                                        disabled={call || !loggedIn}
                                        label="Destination Phone Identity or Phone Identities"
                                        defaultValue={destinationPhoneIds}
                                        onChange={(event) => setDestinationPhoneIds((event.target as HTMLTextAreaElement).value)} />
                                </div>
                                <div className="ms-Grid-col ms-lg6 ms-sm12 alternate-id-field mt-auto">
                                    <AlternateCallerIdPicker
                                        disabled={call || !loggedIn}
                                        label="Alternate Caller Id (For calling phone numbers only)"
                                        onChange={(value) => setAlternateCallerId(value)} />
                                </div>
                            </div>
                            <PrimaryButton
                                className="primary-button"
                                iconProps={{ iconName: 'Phone', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                text="Place call"
                                disabled={call || !loggedIn}
                                onClick={placeCall}>
                            </PrimaryButton>
                            <PrimaryButton
                                className="primary-button"
                                iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                text="Place call with video"
                                disabled={call || !loggedIn}
                                onClick={placeCall}>
                            </PrimaryButton>
                        </div>
                        <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                            <div className="ms-Grid-row">
                                <h3 className="mb-1">Join a group call</h3>
                                <div>Group Id must be in GUID format.</div>
                                <TextField
                                    className="mb-3"
                                    disabled={call || !loggedIn}
                                    label="Group Id"
                                    placeholder="29228d3e-040e-4656-a70e-890ab4e173e5"
                                    defaultValue={destinationGroup}
                                    onChange={(event) => setDestinationGroup((event.target as HTMLTextAreaElement).value)} />
                                <PrimaryButton
                                    className="primary-button"
                                    iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Join group call"
                                    disabled={call || !loggedIn}
                                    onClick={joinGroup}>
                                </PrimaryButton>
                                <PrimaryButton
                                    className="primary-button"
                                    iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Join group call with video"
                                    disabled={call || !loggedIn}
                                    onClick={joinGroup}>
                                </PrimaryButton>
                            </div>
                            <InboundCallingInput 
                                mri={mri}
                                disabled={call || !loggedIn} 
                                />
                        </div>
                        <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                            <h3 className="mb-1">Join a Teams meeting</h3>
                            <div>Enter meeting link</div>
                            <TextField className="mb-3"
                                disabled={call || !loggedIn}
                                label="Meeting link"
                                onChange={(event) => setMeetingLink((event.target as HTMLTextAreaElement).value)} />
                            <div>Or enter meeting id</div>
                            <TextField className="mb-3"
                                disabled={call || !loggedIn}
                                label="Meeting id"
                                onChange={(event) => setMeetingId((event.target as HTMLTextAreaElement).value)} />
                            <div> Or enter meeting coordinates (Thread Id, Message Id, Organizer Id, and Tenant Id)</div>
                            <TextField disabled={call || !loggedIn}
                                label="Thread Id"
                                onChange={(event) => setThreadId((event.target as HTMLTextAreaElement).value)} />
                            <TextField disabled={call || !loggedIn}
                                label="Message Id"
                                onChange={(event) => setMessageId((event.target as HTMLTextAreaElement).value)} />
                            <TextField disabled={call || !loggedIn}
                                label="Organizer Id"
                                onChange={(event) => setOrganizerId((event.target as HTMLTextAreaElement).value)} />
                            <TextField className="mb-3"
                                disabled={call || !loggedIn}
                                label="Tenant Id"
                                onChange={(event) => setTenantId((event.target as HTMLTextAreaElement).value)} />
                            <PrimaryButton className="primary-button"
                                iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                text="Join Teams meeting"
                                disabled={call || !loggedIn}
                                onClick={joinTeamsMeeting}>
                            </PrimaryButton>
                            <PrimaryButton className="primary-button"
                                iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                text="Join Teams meeting with video"
                                disabled={call || !loggedIn}
                                onClick={joinTeamsMeeting}>
                            </PrimaryButton>
                        </div>
                    </div>
                }
                {
                    call != null &&
                    <CallCard
                        call={call}
                        deviceManager={deviceManager}
                        selectedSpeakerDeviceId={selectedSpeakerDeviceId}
                        speakerDeviceOptions={speakerDeviceOptions}
                        microphoneDeviceOptions={microphoneDeviceOptions}
                        selectedMicrophoneDeviceId={selectedMicrophoneDeviceId}
                    />
                }
                {
                    incomingCall != null && call == null &&
                    <IncomingCallCard
                        incomingCall={incomingCall}
                        getCallOptions={getCallOptions}
                        onReject={() => setIncomingCall(null)} />
                }
            </Card>
            <Card title='Configure Direct Routing' showCodeIconName='BranchMerge' code={codeSamples.directRoutingCode}>
                <DirectRouting />
            </Card>
            <Card title='Video, Screen sharing, and local video preview' showCodeIconName='Video' code={codeSamples.streamingSampleCode}>
                <h3>
                    Video - try it out.
                </h3>
                <div>
                    From your current call, toggle your video on and off by clicking on the <Icon className="icon-text-xlarge" iconName="Video" /> icon.
                    When you start you start your video, remote participants can see your video by receiving a stream and rendering it in an HTML element.
                </div>
                <br></br>
                <h3>
                    Screen sharing - try it out.
                </h3>
                <div>
                    From your current call, toggle your screen sharing on and off by clicking on the <Icon className="icon-text-xlarge" iconName="TVMonitor" /> icon.
                    When you start sharing your screen, remote participants can see your screen by receiving a stream and rendering it in an HTML element.
                </div>
            </Card>
            <Card title='Mute / Unmute' showCodeIconName='Microphone' code={codeSamples.muteUnmuteSampleCode}>
                <h3>
                        Try it out.
                    </h3>
                    <div>
                        From your current call, toggle your microphone on and off by clicking on the <Icon className="icon-text-xlarge" iconName="Microphone" /> icon.
                        When you mute or unmute your microphone, remote participants can receive an event about wether your micrphone is muted or unmuted.
                    </div>
            </Card>

            <Card title='Hold / Unhold' showCodeIconName='Play' code={codeSamples.holdUnholdSampleCode}>
                <h3>
                    Try it out.
                </h3>
                <div>
                    From your current call, toggle hold call and unhold call on by clicking on the <Icon className="icon-text-xlarge" iconName="Play" /> icon.
                    When you hold or unhold the call, remote participants can receive other participant state changed events. Also, the call state changes.
                </div>
            </Card>
            <Card title='Device Manager' code={codeSamples.deviceManagerSampleCode} showCodeIconName='Settings'>
                <h3>
                    Try it out.
                </h3>
                <div>
                    From your current call, click on the <Icon className="icon-text-xlarge" iconName="Settings" /> icon to open up the settings panel.
                    The DeviceManager is used to select the devices (camera, microphone, and speakers) to use across the call stack and to preview your camera.
                </div>
            </Card>
        </div>
    );
}

export default MakeCall;