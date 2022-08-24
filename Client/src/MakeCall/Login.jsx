// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { TextField, PrimaryButton } from '@fluentui/react'
import { utils } from "../Utils/Utils";
import { v4 as uuid } from 'uuid';
import { userProvisioningAndSdkInitializationCode } from "./CodeSamples";
import Card from './Card';

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.userDetailsResponse = undefined;
        this.displayName = undefined;
        this.clientTag = uuid();
        this.state = {
            showSpinner: false,
            disableInitializeButton: false,
            loggedIn: false
        }
    }

    provisionNewUser = async () => {
        try {
            this.setState({ showSpinner: true, disableInitializeButton: true });
            this.userDetailsResponse = await utils.provisionNewUser();
            this.setState({ id: utils.getIdentifierText(this.userDetailsResponse.user) });
            await this.props.onLoggedIn({ id: this.state.id, token: this.userDetailsResponse.token, displayName: this.displayName, clientTag: this.clientTag });
            this.setState({ loggedIn: true });
        } catch (error) {
            console.log(error);
        } finally {
            this.setState({ disableInitializeButton: false, showSpinner: false });
        }
    }

    // TODO delete, is just for development
    componentDidMount = () => {
        if (!this.state.loggedIn) {
            // this.provisionNewUser();
        }
      }

    render() {

        return (
            <Card 
                title='ACS User identity Provisioning and Calling SDK Initialization' 
                showCodeIconName='ReleaseGate' 
                code={userProvisioningAndSdkInitializationCode}>

                <div>The ACS Administration SDK can be used to create a user access token which authenticates the calling clients. </div>
                <div>The example code shows how to use the ACS Administration SDK from a backend service. A walkthrough of integrating the ACS Administration SDK can be found on <a className="sdk-docs-link" target="_blank" href="https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/access-tokens?pivots=programming-language-javascript">Microsoft Docs</a></div>
                {
                    this.state.loggedIn && 
                    <div>
                        <br></br>
                        <div>Congrats! You've provisioned an ACS user identity and initialized the ACS Calling Client Web SDK. You are ready to start making calls!</div>
                        <div>The Identity you've provisioned is: <span className="identity"><b>{this.state.id}</b></span></div>
                        <div>Usage is tagged with: <span className="identity"><b>{this.clientTag}</b></span></div>
                    </div>
                }
                {
                    this.state.showSpinner &&
                    <div className="custom-row justify-content-left align-items-center mt-4">
                        <div className="loader"> </div>
                        <div className="ml-2">Fetching token from service and initializing SDK...</div>
                    </div>
                }
                {
                    !this.state.loggedIn &&
                    <div>
                        <div className="ms-Grid-row">
                            <div className="ms-Grid-col ms-sm12 ms-lg6 ms-xl6 ms-xxl3">
                                <TextField className="mt-3"
                                            defaultValue={undefined}
                                            label="Optional display name"
                                            onChange={(e) => { this.displayName = e.target.value }} />
                                <TextField className="mt-3"
                                            defaultValue={this.clientTag}
                                            label="Optional: Tag this usage session"
                                            onChange={(e) => { this.clientTag = e.target.value }} />
                            </div>
                        </div>
                        <div className="mt-1">
                            <PrimaryButton className="primary-button mt-3"
                                iconProps={{iconName: 'ReleaseGate', style: {verticalAlign: 'middle', fontSize: 'large'}}}
                                label="Provision an user" 
                                disabled={this.state.disableInitializeButton}
                                onClick={() => this.provisionNewUser()}>
                                    Provision user and initialize SDK
                            </PrimaryButton>
                        </div>
                    </div>
                }
            </Card>
        )
    }
}
