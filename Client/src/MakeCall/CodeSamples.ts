// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const callSampleCode = `
/******************************/
/*       Placing a call       */
/******************************/
// Set up CallOptions
const cameraDevice = this.callClient.getDeviceManager().getCameras()[0];
const localVideoStream = new LocalVideoStream(cameraDevice);
this.callOptions.videoOptions = { localVideoStreams: [localVideoStream] };

// To place a 1:1 call to another ACS user
const userId = { communicationUserId: 'ACS_USER_ID');
this.currentCall = this.callAgent.startCall([userId], this.callOptions);

// Place a 1:1 call to an ACS phone number. PSTN calling is currently in private preview.
// When making PSTN calls, your Alternate Caller Id must be specified in the call options.
const phoneNumber = { phoneNumber: <ACS_PHONE_NUMBER>);
this.callOptions.alternateCallerId = { phoneNumber: <ALTERNATE_CALLER_ID>}
this.currentCall = this.callAgent.startCall([phoneNumber], this.callOptions);

// Place a 1:N call. Specify a multiple destinations
this.currentCall = this.callAgent.startCall([userId1, phoneNumber], this.callOptions);

/******************************/
/*      Receiving a call      */
/******************************/
this.callAgent.on('incomingCall', async (args) => {
    // accept the incoming call
    const call = await args.incomingCall.accept();

    // or reject the incoming call
    args.incomingCall.reject();
});

/******************************/
/*    Joining a group call    */
/******************************/
// Set up CallOptions
const cameraDevice = this.callClient.deviceManager.getCameras()[0];
const localVideoStream = new LocalVideoStream(cameraDevice);
this.callOptions.videoOptions = { localVideoStreams: [localVideoStream] };

// Join a group call
this.currentCall = this.callAgent.join({groupId: <GUID>}, this.callOptions);

/*******************************/
/*  Joining a Teams meetings   */
/*******************************/
// Join a Teams meeting using a meeting link. To get a Teams meeting link, go to the Teams meeting and
// open the participants roster, then click on the 'Share Invite' button and then click on 'Copy link meeting' button.
this.currentCall = this.callAgent.join({meetingLink: <meeting link>}, this.callOptions);
// Join a Teams meeting using a meeting id.
this.currentCall = this.callAgent.join({meetingId: <meeting id>}, this.callOptions);
// Join a Teams meeting using meeting coordinates. Coordinates can be derived from the meeting link
// Teams meeting link example
const meetingLink = 'https://teams.microsoft.com/l/meetup-join/19:meeting_NjNiNzE3YzMtYzcxNi00ZGQ3LTk2YmYtMjNmOTE1MTVhM2Jl@thread.v2/0?context=%7B%22Tid%22:%2272f988bf-86f1-41af-91ab-2d7cd011db47%22,%22Oid%22:%227e353a91-0f71-4724-853b-b30ee4ca6a42%22%7D'
const url = new URL(meetingLink);
// Derive the coordinates (threadId, messageId, tenantId, and organizerId)
const pathNameSplit = url.pathname.split('/');
const threadId = decodeURIComponent(pathNameSplit[3]);
const messageId = pathNameSplit[4];
const meetingContext = JSON.parse(decodeURIComponent(url.search.replace('?context=', '')));
const organizerId = meetingContext.Oid;
const tenantId = meetingContext.Tid;
this.currentCall = this.callAgent.join({
                                threadId,
                                messageId,
                                tenantId,
                                organizerId
                            }, this.callOptions);
        `;

const environmentInfo = `
/**************************************************************************************/
/*     Environment Information     */
/**************************************************************************************/
// Get current environment information with details if supported by ACS
this.environmentInfo = await this.callClient.getEnvironmentInfo();

// The returned value is an object of type EnvironmentInfo
type EnvironmentInfo = {
    environment: Environment;
    isSupportedPlatform: boolean;
    isSupportedBrowser: boolean;
    isSupportedBrowserVersion: boolean;
    isSupportedEnvironment: boolean;
};

// The Environment type in the EnvironmentInfo type is defined as:
type Environment = {
  platform: string;
  browser: string;
  browserVersion: string;
};

// The following code snippet shows how to get the current environment details
const currentOperatingSystem = this.environmentInfo.environment.platform;
const currentBrowser = this.environmentInfo.environment.browser;
const currentBrowserVersion = this.environmentInfo.environment.browserVersion;

// The following code snippet shows how to check if environment details are supported by ACS
const isSupportedOperatingSystem = this.environmentInfo.isSupportedPlatform;
const isSupportedBrowser = this.environmentInfo.isSupportedBrowser;
const isSupportedBrowserVersion = this.environmentInfo.isSupportedBrowserVersion;
const isSupportedEnvironment = this.environmentInfo.isSupportedEnvironment;

        `;

const streamingSampleCode = `
/************************************************/
/*     Local Video and Local Screen-sharing     */
/************************************************/
// To start a video, you have to enumerate cameras using the getCameras()
// method on the deviceManager object. Then create a new instance of
// LocalVideoStream passing the desired camera into the startVideo() method as
// an argument
const cameraDevice = this.callClient.getDeviceManager().getCameras()[0];
const localVideoStream = new LocalVideoStream(cameraDevice);
await call.startVideo(localVideoStream);

// To stop local video, pass the localVideoStream instance available in the
// localVideoStreams collection
await this.currentCall.stopVideo(localVideoStream);

// You can use DeviceManager and Renderer to begin rendering streams from your local camera.
// This stream won't be sent to other participants; it's a local preview feed. This is an asynchronous action.
const renderer = new Renderer(localVideoStream);
const view = await renderer.createView();
document.getElementById('someDiv').appendChild(view.target);

// You can switch to a different camera device while video is being sent by invoking
// switchSource() on a localVideoStream instance
const cameraDevice1 = this.callClient.getDeviceManager().getCameras()[1];
localVideoStream.switchSource(cameraDeivce1);

// Handle 'localVideoStreamsUpdated' event
this.currentCall.on('localVideoStreamsUpdated', e => {
    e.added.forEach(addedLocalVideoStream => { this.handleAddedLocalVideoStream(addedLocalVideoStream) });
    e.removed.forEach(removedLocalVideoStream => { this.handleRemovedLocalVideoStream(removedLocalVideoStream) });
});

// To start sharing your screen
await this.currentCall.startScreenSharing();

// To stop sharing your screen
await this.currentCall.stopScreenSharing();

// Handle 'isScreenSharingOnChanged' event
this.currentCall.on('isScreenSharingOnChanged', this.handleIsScreenSharingOnChanged());




/**************************************************************************************/
/*     Handling Video streams and Screen-sharing streams from remote participants     */
/**************************************************************************************/
// Handle remote participant video and screen-sharing streams
remoteParticipant.videoStreams.forEach(videoStream => subscribeToRemoteVideoStream(videoStream))

// Handle remote participant 'videoStreamsUpdated' event. This is for videos and screen-shrings streams.
remoteParticipant.on('videoStreamsUpdated', videoStreams => {
    videoStreams.added.forEach(addedStream => {
        subscribeToRemoteVideoStream(addedStream)
    });

    videoStreams.removed.forEach(removedStream => {
        unsubscribeFromRemoteVideoStream(removedStream);
    });
});

// Render remote streams on UI. Do this logic in a UI component.
// Please refer to /src/MakeCall/StreamMedia.js of this app for an example of how to render streams on the UI:
const subscribeToRemoteVideoStream = (stream) => {
    let componentContainer = document.getElementById(this.componentId);
    componentContainer.hidden = true;

    let renderer = new VideoStreamRenderer(stream);
    let view;
    let videoContainer;

    const renderStream = async () => {
        if(!view) {
            view = await renderer.createView();
        }
        videoContainer = document.getElementById(this.videoContainerId);
        if(!videoContainer?.hasChildNodes()) { videoContainer.appendChild(view.target); }
    }

    stream.on('isAvailableChanged', async () => {
        if (stream.isAvailable) {
            componentContainer.hidden = false;
            await renderStream();
        } else {
            componentContainer.hidden = true;
        }
    });

    if (stream.isAvailable) {
        componentContainer.hidden = false;
        await renderStream();
    }
}

<div id={this.componentId}>
    <div id={this.videoContainerId}></div>
</div>

        `;

const muteUnmuteSampleCode = `
// To mute your microphone
await this.currentCall.mute();

// To unmute your microphone
await this.currentCall.unmute();

// Handle remote participant isMutedChanged event
addedParticipant.on('isMutedChanged', () => {
    if(remoteParticipant.isMuted) {
        console.log('Remote participant is muted');
    } else {
        console.log('Remote participant is unmuted');
    }
});
        `;

const holdUnholdSampleCode = `
/******************************/
/*      To hold the call      */
/******************************/
    // Call state changes when holding
    this.currentCall.on('stateChanged', () => {
        // Call state changes to 'LocalHold' or 'RemoteHold'
        console.log(this.currentCall.state);
    });

    // If you hold the Call, remote participant state changes to 'Hold'.
    // Handle remote participant stateChanged event
    addedParticipant.on('stateChanged', () => {
        console.log(addedParticipant.state); // 'Hold'
    });

    // If you want to hold the call use:
    await this.currentCall.hold();

/******************************/
/*     To unhold the call     */
/******************************/
    // The Call state changes when unholding
    this.currentCall.on('stateChanged', () => {
        // Call state changes back to 'Connected'
        console.log(this.currentCall.state);
    });

    // Remote participant state changes to 'Connected'
    addedParticipant.on('stateChanged', () => {
        console.log(addedParticipant.state); // 'Connected'
    });

    // If you want to unhold the call use:
    await this.currentCall.resume();
        `;

const deviceManagerSampleCode = `
/*************************************/
/*           Device Manager          */
/*************************************/
// Get the Device Manager.
// The CallAgent must be initialized first in order to be able to access the DeviceManager.
this.deviceManager = this.callClient.getDeviceManager();

// Get list of devices
const cameraDevices = await this.deviceManager.getCameras();
const speakerDevices = await this.deviceManager.getSpeakers();
const microphoneDevices = await this.deviceManager.getMicrophones();

// Set microphone device and speaker device to use across the call stack.
await this.deviceManager.selectSpeaker(speakerDevices[0]);
await this.deviceManager.selectMicrophone(microphoneDevices[0]);
// NOTE: Setting of video camera device to use is specified on CallAgent.startCall() and Call.join() APIs
// by passing a LocalVideoStream into the options paramter.
// To switch video camera device to use during call, use the LocalVideoStream.switchSource() method.

// Get selected speaker and microphone
const selectedSpeaker = this.deviceManager.selectedSpeaker;
const selectedMicrophone = this.deviceManager.selectedMicrophone;

// Handle videoDevicesUpdated event
this.callClient.deviceManager.on('videoDevicesUpdated', e => {
    e.added.forEach(cameraDevice => { this.handleAddedCameraDevice(cameraDevice); });
    e.removed.forEach(removedCameraDevice => { this.handleRemovedCameraDevice(removeCameraDevice); });
});

// Handle audioDevicesUpdate event
this.callClient.deviceManager.on('audioDevicesUpdated', e => {
    e.added.forEach(audioDevice => { this.handleAddedAudioDevice(audioDevice); });
    e.removed.forEach(removedAudioDevice => { this.handleRemovedAudioDevice(removedAudioDevice); });
});

// Handle selectedMicrophoneChanged event
this.deviceManager.on('selectedMicrophoneChanged', () => { console.log(this.deviceManager.selectedMicrophone) });

// Handle selectedSpeakerChanged event
this.deviceManager.on('selectedSpeakerChanged', () => { console.log(this.deviceManager.selectedSpeaker) });
        `;

const userProvisioningAndSdkInitializationCode = `
        /**************************************************************************************
         *   User token provisioning service should be set up in a trusted backend service.   *
         *   Client applications will make requests to this service for gettings tokens.      *
         **************************************************************************************/
        import  { CommunicationIdentityClient } from @azure/communication-administration;
        const communicationIdentityClient = new CommunicationIdentityClient(<RESOURCE CONNECTION STRING>);
        app.get('/tokens/provisionUser', async (request, response) => {
            try {
                const communicationUserId = await communicationIdentityClient.createUser();
                const tokenResponse = await communicationIdentityClient.issueToken({ communicationUserId }, ['voip']);
                response.json(tokenResponse);
            } catch(error) {
                console.log(error);
            }
        });
        
        /********************************************************************************************************
         *   Client application initializing the ACS Calling Client Web SDK after receiving token from service   *
         *********************************************************************************************************/
        import { CallClient, Features } from '@azure/communication-calling';
        import { AzureCommunicationTokenCredential } from '@azure/communication-common';
        import { AzureLogger, setLogLevel } from '@azure/logger';
        
        export class MyCallingApp {
            constructor() {
                this.callClient = undefined;
                this.callAgent = undefined;
                this.deviceManager = undefined;
                this.currentCall = undefined;
            }
        
            public async initCallClient() {
                const response = (await fetch('/tokens/provisionUser')).json();
                const token = response.token;
                const tokenCredential = new AzureCommunicationTokenCredential(token);
        
                // Set log level for the logger
                setLogLevel('verbose');
                // Redirect logger output to wherever desired
                AzureLogger.log = (...args) => { console.log(...args); };
                // CallClient is the entrypoint for the SDK. Use it to
                // to instantiate a CallClient and to access the DeviceManager
                this.callClient = new CallClient();
                this.callAgent = await this.callClient.createCallAgent(tokenCredential, { displayName: 'Optional ACS user name'});
                this.deviceManager = await this.callClient.getDeviceManager();
        
                // Handle Calls and RemoteParticipants
                // Subscribe to 'callsUpdated' event to be when a a call is added or removed
                this.callAgent.on('callsUpdated', calls => {
                    calls.added.foreach(addedCall => {
                        // Get the state of the call
                        addedCall.state;
        
                        //Subscribe to call state changed event
                        addedCall.on('stateChanged', callStateChangedHandler);
        
                        // Get the unique Id for this Call
                        addedCall.id;
        
                        // Subscribe to call id changed event
                        addedCall.on('idChanged', callIdChangedHandler);
        
                        // Wether microphone is muted or not
                        addedCall.isMuted;
        
                        // Subscribe to isMuted changed event
                        addedCall.on('isMutedChanged', isMutedChangedHandler);
        
                        // Subscribe to current remote participants in the call
                        addedCall.remoteParticipants.forEach(participant => {
                            subscribeToRemoteParticipant(participant)
                        });
        
                        // Subscribe to new added remote participants in the call
                        addedCall.on('remoteParticipantsUpdated', participants => {
                            participants.added.forEach(addedParticipant => {
                                subscribeToRemoteParticipant(addedParticipant)
                            });
        
                            participants.removed.forEach(removedParticipant => {
                                unsubscribeFromRemoteParticipant(removedParticipant);
                            });
                        });
                    });
        
                    calls.removed.foreach(removedCall => {
                        removedCallHandler(removedCall);
                    });
                });
            }
        
            private subscribeToRemoteParticipant(remoteParticipant) {
                // Get state of this remote participant
                remoteParticipant.state;
        
                // Subscribe to participant state changed event.
                remoteParticipant.on('stateChanged', participantStateChangedHandler);
        
                // Whether this remote participant is muted or not
                remoteParticipant.isMuted;
        
                // Subscribe to is muted changed event.
                remoteParticipant.on('isMutedChanged', isMutedChangedHandler);
        
                // Get participant's display name, if it was set
                remoteParticipant.displayName;
        
                // Subscribe to display name changed event
                remoteParticipant.on('displayNameChanged', dispalyNameChangedHandler);
        
                // Weather the participant is speaking or not
                remoteParticipant.isSpeaking;
        
                // Subscribe to participant is speaking changed event
                remoteParticipant.on('isSpeakingChanged', isSpeakingChangedHandler);
        
                // Handle remote participant's current video streams
                remoteParticipant.videoStreams.forEach(videoStream => { subscribeToRemoteVideoStream(videoStream) });
        
                // Handle remote participants new added video streams and screen-sharing streams
                remoteParticipant.on('videoStreamsUpdated', videoStreams => {
                    videoStream.added.forEach(addedStream => {
                        subscribeToRemoteVideoStream(addedStream);
                    });
                    videoStream.removed.forEach(removedStream => {
                        unsubscribeFromRemoteVideoStream(removedStream);
                    });
                });
            }
        }
                `;

const directRoutingCode = `
    /**
     * Download the current settings from Azure.
     * First retrieves the *connectionString* from the server, and then 
     * uses this to retrieve the trunks (SBCs) and the Voice Routes from Azure.
     */
    const downloadData = async () => {
        setDownloading(true);

        // Retrieve the connectionString, and the trunks and routes
        const { connectionString } = await utils.getConnectionString();
        sipClient = new SipRoutingClient(connectionString);
        const trunks = await sipClient.getTrunks();
        const routes = await sipClient.getRoutes();
    }

    /**
     * Upload the data when the user clicks on *Create*.
     */
    const onCreateClick = async () => {
        setUploading(true);

        await sipClient.setTrunks(trunks);
        await sipClient.setRoutes(routes);
        setUploading(false);
        setShowUploadedDialog(true);
    }
`;

export {
  callSampleCode,
  environmentInfo,
  streamingSampleCode,
  muteUnmuteSampleCode,
  holdUnholdSampleCode,
  deviceManagerSampleCode,
  userProvisioningAndSdkInitializationCode,
  directRoutingCode,
};
