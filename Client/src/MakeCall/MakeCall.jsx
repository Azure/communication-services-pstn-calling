// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { CallClient, LocalVideoStream, Features } from '@azure/communication-calling';
import { utils } from "../Utils/Utils";
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
    PrimaryButton,
    TextField,
    MessageBar,
    MessageBarType,
    ThemeSettingName
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

export default class MakeCall extends React.Component {
    constructor(props) {
        super(props);
        this.callClient = null;
        this.tokenCredential = null;
        this.environmentInfo = null;
        this.callAgent = null;
        this.deviceManager = null;
        this.callError = null;
        this.logBuffer = [];

        this.state = {
            id: undefined,
            loggedIn: false,
            call: undefined,
            incomingCall: undefined,
            selectedCameraDeviceId: null,
            selectedSpeakerDeviceId: null,
            selectedMicrophoneDeviceId: null,
            deviceManagerWarning: null,
            callError: null,
            ufdMessages: [],
            tokenCredential: null,
            permissions: {
                audio: null,
                video: null
            },
            destinationPhoneIds: '',
            destinationUserIds: '',
            alternateCallerId: '',
            destinationGroup: '29228d3e-040e-4656-a70e-890ab4e173e5',
            meetingLink: '',
            meetingId: '',
            threadId: '',
            messageId: '',
            organizerId: '',
            tenantId: ''
        };

        setInterval(() => {
            if (this.state.ufdMessages.length > 0) {
                this.setState({ ufdMessages: this.state.ufdMessages.slice(1) });
            }
        }, 10000);
    }

    handleLogIn = async (userDetails) => {
        if (userDetails) {
            try {
                setLogLevel('verbose');
                const tokenCredential = new AzureCommunicationTokenCredential(userDetails.token);
                this.callClient = new CallClient({ diagnostics: { appName: 'azure-communication-services', appVersion: '1.3.1-beta.1', tags: ["javascript_calling_sdk", `#clientTag:${userDetails.clientTag}`] } });
                this.callAgent = await this.callClient.createCallAgent(tokenCredential, { displayName: userDetails.displayName });
                this.environmentInfo = await this.callClient.getEnvironmentInfo();
                // override logger to be able to dowload logs locally
                AzureLogger.log = (...args) => {
                    this.logBuffer.push(...args);
                    window.acsLogBuffer = this.logBuffer;
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
                window.callAgent = this.callAgent;
                this.deviceManager = await this.callClient.getDeviceManager();
                const permissions = await this.deviceManager.askDevicePermission({ audio: true, video: true });
                this.setState({permissions: permissions});

                this.callAgent.on('callsUpdated', e => {
                    console.log(`callsUpdated, added=${e.added}, removed=${e.removed}`);

                    e.added.forEach(call => {
                        this.setState({ call: call });

                        const diagnosticChangedListener = (diagnosticInfo) => {
                            const rmsg = `UFD Diagnostic changed:
                            Diagnostic: ${diagnosticInfo.diagnostic}
                            Value: ${diagnosticInfo.value}
                            Value type: ${diagnosticInfo.valueType}`;
                            if (this.state.ufdMessages.length > 0) {
                                this.setState({ ufdMessages: [...this.state.ufdMessages, rmsg] });
                            } else {
                                this.setState({ ufdMessages: [rmsg] });
                            }


                        };

                        call.feature(Features.UserFacingDiagnostics).media.on('diagnosticChanged', diagnosticChangedListener);
                        call.feature(Features.UserFacingDiagnostics).network.on('diagnosticChanged', diagnosticChangedListener);
                    });

                    e.removed.forEach(call => {
                        if (this.state.call && this.state.call === call) {
                            this.displayCallEndReason(this.state.call.callEndReason);
                        }
                    });
                });
                this.callAgent.on('incomingCall', args => {
                    const incomingCall = args.incomingCall;
                    if (this.state.call) {
                        incomingCall.reject();
                        return;
                    }

                    this.setState({ incomingCall: incomingCall });

                    incomingCall.on('callEnded', args => {
                        this.displayCallEndReason(args.callEndReason);
                    });

                });

                this.setState({ loggedIn: true, tokenCredential });
            } catch (e) {
                console.error(e);
            }
        }
    }

    displayCallEndReason = (callEndReason) => {
        if (callEndReason.code !== 0 || callEndReason.subCode !== 0) {
            this.setState({ callError: `Call end reason: code: ${callEndReason.code}, subcode: ${callEndReason.subCode}` });
        }

        this.setState({ call: null, incomingCall: null });
    }

    placeCall = async (withVideo) => {
        try {
            let identitiesToCall = [];
            const userIdsArray = this.state.destinationUserIds.split(',');
            const phoneIdsArray = this.state.destinationPhoneIds.split(',');

            userIdsArray.forEach((userId, index) => {
                if (userId) {
                    userId = userId.trim();
                    if (userId === '8:echo123') {
                        userId = { id: userId };
                    } else {
                        userId = { communicationUserId: userId };
                    }
                    if (!identitiesToCall.find(id => { return id === userId })) {
                        identitiesToCall.push(userId);
                    }
                }
            });

            phoneIdsArray.forEach((phoneNumberId, index) => {
                if (phoneNumberId) {
                    phoneNumberId = phoneNumberId.trim();
                    phoneNumberId = { phoneNumber: phoneNumberId };
                    if (!identitiesToCall.find(id => { return id === phoneNumberId })) {
                        identitiesToCall.push(phoneNumberId);
                    }
                }
            });

            const callOptions = await this.getCallOptions(withVideo);

            if (this.state.alternateCallerId !== '') {
                debugger;
                callOptions.alternateCallerId = { phoneNumber: this.state.alternateCallerId.trim() };
            }

            this.callAgent.startCall(identitiesToCall, callOptions);

        } catch (e) {
            console.error('Failed to place a call', e);
            this.setState({ callError: 'Failed to place a call: ' + e });
        }
    };

    downloadLog = async () => {
        const date = new Date();
        const fileName = `logs-${date.toISOString().slice(0, 19)}.txt`;
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.logBuffer.join('\n')));
        element.setAttribute('download', fileName);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
        this.logBuffer = [];
    }

    joinGroup = async (withVideo) => {
        try {
            const callOptions = await this.getCallOptions(withVideo);
            this.callAgent.join({ groupId: this.state.destinationGroup }, callOptions);
        } catch (e) {
            console.error('Failed to join a call', e);
            this.setState({ callError: 'Failed to join a call: ' + e });
        }
    };

    joinTeamsMeeting = async (withVideo) => {
        try {
            const callOptions = await this.getCallOptions(withVideo);
            if (this.state.meetingLink && !this.state.messageId && !this.state.threadId && this.state.tenantId && this.state.organizerId) {
                this.callAgent.join({ meetingLink: this.state.meetingLink }, callOptions);

            } else if (this.state.meetingId && !this.state.meetingLink && !this.state.messageId && !this.state.threadId && this.state.tenantId && this.state.organizerId) {
                this.callAgent.join({ meetingId: this.state.meetingId }, callOptions);
            } else if (!this.state.meetingLink && this.state.messageId && this.state.threadId && this.state.tenantId && this.state.organizerId) {
                this.callAgent.join({
                    messageId: this.state.messageId,
                    threadId: this.state.threadId,
                    tenantId: this.state.tenantId,
                    organizerId: this.state.organizerId
                }, callOptions);
            } else {
                throw new Error('Please enter Teams meeting link or Teams meeting coordinate');
            }
        } catch (e) {
            console.error('Failed to join teams meeting:', e);
            this.setState({ callError: 'Failed to join teams meeting: ' + e });
        }
    }

    async getCallOptions(withVideo) {
        let callOptions = {
            videoOptions: {
                localVideoStreams: undefined
            },
            audioOptions: {
                muted: false
            }
        };

        let cameraWarning = undefined;
        let speakerWarning = undefined;
        let microphoneWarning = undefined;

        // On iOS, device permissions are lost after a little while, so re-ask for permissions
        const permissions = await this.deviceManager.askDevicePermission({ audio: true, video: true });
        this.setState({permissions: permissions});

        const cameras = await this.deviceManager.getCameras();
        const cameraDevice = cameras[0];
        if (cameraDevice && cameraDevice?.id !== 'camera:') {
            this.setState({
                selectedCameraDeviceId: cameraDevice?.id,
                cameraDeviceOptions: cameras.map(camera => { return { key: camera.id, text: camera.name } })
            });
        }
        if (withVideo) {
            try {
                if (!cameraDevice || cameraDevice?.id === 'camera:') {
                    throw new Error('No camera devices found.');
                } else if (cameraDevice) {
                    callOptions.videoOptions = { localVideoStreams: [new LocalVideoStream(cameraDevice)] };
                }
            } catch (e) {
                cameraWarning = e.message;
            }
        }

        try {
            const speakers = await this.deviceManager.getSpeakers();
            const speakerDevice = speakers[0];
            if (!speakerDevice || speakerDevice.id === 'speaker:') {
                throw new Error('No speaker devices found.');
            } else if (speakerDevice) {
                this.setState({
                    selectedSpeakerDeviceId: speakerDevice.id,
                    speakerDeviceOptions: speakers.map(speaker => { return { key: speaker.id, text: speaker.name } })
                });
                await this.deviceManager.selectSpeaker(speakerDevice);
            }
        } catch (e) {
            speakerWarning = e.message;
        }

        try {
            const microphones = await this.deviceManager.getMicrophones();
            const microphoneDevice = microphones[0];
            if (!microphoneDevice || microphoneDevice.id === 'microphone:') {
                throw new Error('No microphone devices found.');
            } else {
                this.setState({
                    selectedMicrophoneDeviceId: microphoneDevice.id,
                    microphoneDeviceOptions: microphones.map(microphone => { return { key: microphone.id, text: microphone.name } })
                });
                await this.deviceManager.selectMicrophone(microphoneDevice);
            }
        } catch (e) {
            microphoneWarning = e.message;
        }

        if (cameraWarning || speakerWarning || microphoneWarning) {
            this.setState({
                deviceManagerWarning:
                    `${cameraWarning ? cameraWarning + ' ' : ''}
                    ${speakerWarning ? speakerWarning + ' ' : ''}
                    ${microphoneWarning ? microphoneWarning + ' ' : ''}`
            });
        }

        return callOptions;
    }
    render() {

        // TODO: Create section component. Couldnt use the ExampleCard compoenent from uifabric because it is buggy,
        //       when toggling their show/hide code functionality, videos dissapear from DOM.

        return (
            <div>
                <Login onLoggedIn={this.handleLogIn} />
                <Card title='Environment information' code={codeSamples.environmentInfo} showCodeIconName='Info'>
                        <h3>Current environment details</h3>
                        <div>{`Operating system:   ${this.environmentInfo?.environment?.platform}.`}</div>
                        <div>{`Browser:  ${this.environmentInfo?.environment?.browser}.`}</div>
                        <div>{`Browser's version:  ${this.environmentInfo?.environment?.browserVersion}.`}</div>
                        <br></br>
                        <h3>Environment support verification</h3>
                        <div>{`Operating system supported:  ${this.environmentInfo?.isSupportedPlatform}.`}</div>
                        <div>{`Browser supported:  ${this.environmentInfo?.isSupportedBrowser}.`}</div>
                        <div>{`Browser's version supported:  ${this.environmentInfo?.isSupportedBrowserVersion}.`}</div>
                        <div>{`Current environment supported:  ${this.environmentInfo?.isSupportedEnvironment}.`}</div>
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
                            onClick={this.downloadLog}>
                        </PrimaryButton>
                    } 
                    subTitle={`Permissions audio: ${this.state.permissions.audio} video: ${this.state.permissions.video}`}
                >
                    <div className="mb-2">Having provisioned an ACS Identity and initialized the SDK from the section above, you are now ready to place calls, join group calls, and receiving calls.</div>
                    {
                        this.state.callError &&
                        <MessageBar
                            messageBarType={MessageBarType.error}
                            isMultiline={false}
                            onDismiss={() => { this.setState({ callError: undefined }) }}
                            dismissButtonAriaLabel="Close">
                            <b>{this.state.callError}</b>
                        </MessageBar>
                    }
                    {
                        this.state.deviceManagerWarning &&
                        <MessageBar
                            messageBarType={MessageBarType.warning}
                            isMultiline={false}
                            onDismiss={() => { this.setState({ deviceManagerWarning: undefined }) }}
                            dismissButtonAriaLabel="Close">
                            <b>{this.state.deviceManagerWarning}</b>
                        </MessageBar>
                    }
                    {
                        this.state.ufdMessages.length > 0 &&
                        <MessageBar
                            messageBarType={MessageBarType.warning}
                            isMultiline={true}
                            onDismiss={() => { this.setState({ ufdMessages: [] }) }}
                            dismissButtonAriaLabel="Close">
                            {this.state.ufdMessages.map(msg => <li>{msg}</li>)}
                        </MessageBar>
                    }
                    {
                        !this.state.incomingCall && !this.state.call &&
                        <div className="ms-Grid-row mt-3">
                            <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                <h3 className="mb-1">Place a call</h3>
                                <div>Enter an Identity to make a call to.</div>
                                <div>You can specify multiple Identities to call by using "," separated values.</div>
                                <div>If calling a Phone Identity, your Alternate Caller Id must be specified. </div>
                                <TextField
                                    disabled={this.state.call || !this.state.loggedIn}
                                    label="Destination Identity or Identities"
                                    defaultValue={this.state.destinationUserIds}
                                    onChange={(event) => this.setState({ destinationUserIds: event.target.value })} />
                                <div className="ms-Grid-row mb-3 mt-3" style={{display: 'flex', flexDirection: 'row'}}>
                                    <div className="ms-Grid-col ms-lg6 ms-sm12" style={{marginTop: 'auto'}}>
                                        <TextField
                                            disabled={this.state.call || !this.state.loggedIn}
                                            label="Destination Phone Identity or Phone Identities"
                                            defaultValue={this.state.destinationPhoneIds}
                                            onChange={(event) => this.setState({ destinationPhoneIds: event.target.value })} />
                                    </div>
                                    <div className="ms-Grid-col ms-lg6 ms-sm12 alternate-id-field" style={{marginTop: 'auto'}}>
                                        <AlternateCallerIdPicker
                                            disabled={this.state.call || !this.state.loggedIn}
                                            label="Alternate Caller Id (For calling phone numbers only)"
                                            onChange={(value) => this.setState({ alternateCallerId: value })} />
                                    </div>
                                </div>
                                <PrimaryButton
                                    className="primary-button"
                                    iconProps={{ iconName: 'Phone', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Place call"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    onClick={() => this.placeCall(false)}>
                                </PrimaryButton>
                                <PrimaryButton
                                    className="primary-button"
                                    iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Place call with video"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    onClick={() => this.placeCall(true)}>
                                </PrimaryButton>
                            </div>
                            <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                <h3 className="mb-1">Join a group call</h3>
                                <div>Group Id must be in GUID format.</div>
                                <TextField
                                    className="mb-3"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    label="Group Id"
                                    placeholder="29228d3e-040e-4656-a70e-890ab4e173e5"
                                    defaultValue={this.state.destinationGroup}
                                    onChange={(event) => this.setState({ destinationGroup: event.target.value })} />
                                <PrimaryButton
                                    className="primary-button"
                                    iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Join group call"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    onClick={() => this.joinGroup(false)}>
                                </PrimaryButton>
                                <PrimaryButton
                                    className="primary-button"
                                    iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Join group call with video"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    onClick={() => this.joinGroup(true)}>
                                </PrimaryButton>
                            </div>
                            <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                <h3 className="mb-1">Join a Teams meeting</h3>
                                <div>Enter meeting link</div>
                                <TextField className="mb-3"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    label="Meeting link"
                                    onChange={(event) => this.setState({ meetingLink: event.target.value })} />
                                <div>Or enter meeting id</div>
                                <TextField className="mb-3"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    label="Meeting id"
                                    onChange={(event) => this.setState({ meetingId: event.target.value })} />
                                <div> Or enter meeting coordinates (Thread Id, Message Id, Organizer Id, and Tenant Id)</div>
                                <TextField disabled={this.state.call || !this.state.loggedIn}
                                    label="Thread Id"
                                    onChange={(event) => this.setState({ threadId: event.target.value })} />
                                <TextField disabled={this.state.call || !this.state.loggedIn}
                                    label="Message Id"
                                    onChange={(event) => this.setState({ messageId: event.target.value })} />
                                <TextField disabled={this.state.call || !this.state.loggedIn}
                                    label="Organizer Id"
                                    onChange={(event) => this.setState({ organizerId: event.target.value })} />
                                <TextField className="mb-3"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    label="Tenant Id"
                                    onChange={(event) => this.setState({ tenantId: event.target.value })} />
                                <PrimaryButton className="primary-button"
                                    iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Join Teams meeting"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    onClick={() => this.joinTeamsMeeting(false)}>
                                </PrimaryButton>
                                <PrimaryButton className="primary-button"
                                    iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text="Join Teams meeting with video"
                                    disabled={this.state.call || !this.state.loggedIn}
                                    onClick={() => this.joinTeamsMeeting(true)}>
                                </PrimaryButton>
                            </div>
                        </div>
                    }
                    {
                        this.state.call &&
                        <CallCard
                            call={this.state.call}
                            deviceManager={this.deviceManager}
                            selectedCameraDeviceId={this.state.selectedCameraDeviceId}
                            cameraDeviceOptions={this.state.cameraDeviceOptions}
                            speakerDeviceOptions={this.state.speakerDeviceOptions}
                            microphoneDeviceOptions={this.state.microphoneDeviceOptions}
                            onShowCameraNotFoundWarning={(show) => { this.setState({ showCameraNotFoundWarning: show }) }}
                            onShowSpeakerNotFoundWarning={(show) => { this.setState({ showSpeakerNotFoundWarning: show }) }}
                            onShowMicrophoneNotFoundWarning={(show) => { this.setState({ showMicrophoneNotFoundWarning: show }) }} />
                    }
                    {
                        this.state.incomingCall && !this.state.call &&
                        <IncomingCallCard
                            incomingCall={this.state.incomingCall}
                            acceptCallOptions={async () => await this.getCallOptions()}
                            acceptCallWithVideoOptions={async () => await this.getCallOptions(true)}
                            onReject={() => { this.setState({ incomingCall: undefined }) }} />
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
}
