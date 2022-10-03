// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { TextField, PrimaryButton } from '@fluentui/react';
import { utils } from '../Utils/Utils';
import { v4 as uuid } from 'uuid';
import { userProvisioningAndSdkInitializationCode } from './CodeSamples';
import { CommunicationIdentityClient, CommunicationUserToken } from '@azure/communication-identity';
import Card from './Card';

type LoginProps = {
  onLoggedIn: (client: CommunicationUserToken, displayName: string, mri: string, clientTag: string) => void;
};

const Login: React.FC<LoginProps> = ({ onLoggedIn }) => {
  const [showSpinner, setShowSpinner] = React.useState(false);
  const [disableInitializeButton, setDisableInitializeButton] = React.useState(false);
  const [isLoggedIn, setLoggedIn] = React.useState(false);
  const [mri, setMri] = React.useState('');

  const [displayName, setDisplayName] = React.useState('');
  const [clientTag, setClientTag] = React.useState(() => uuid());

  const provisionNewUser = async (): Promise<void> => {
    try {
      setShowSpinner(true);
      setDisableInitializeButton(true);

      const { connectionString } = await utils.getConnectionString();
      const client = await new CommunicationIdentityClient(connectionString).createUserAndToken(['voip']);

      setMri(client.user.communicationUserId);
      await onLoggedIn(client, displayName, mri, clientTag);
      setLoggedIn(true);
    } catch (error) {
      console.log(error);
    } finally {
      setShowSpinner(false);
      setDisableInitializeButton(false);
    }
  };

  React.useEffect(() => {
    provisionNewUser();
  }, []);

  return (
    <Card
      title="ACS User identity Provisioning and Calling SDK Initialization"
      showCodeIconName="ReleaseGate"
      code={userProvisioningAndSdkInitializationCode}
    >
      <div>
        The ACS Administration SDK can be used to create a user access token which authenticates the calling clients.{' '}
      </div>
      <div>
        The example code shows how to use the ACS Administration SDK from a backend service. A walkthrough of
        integrating the ACS Administration SDK can be found on
        <a
          className="sdk-docs-link"
          rel="noopener noreferrer"
          target="_blank"
          href="https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/access-tokens?pivots=programming-language-javascript"
        >
          Microsoft Docs
        </a>
      </div>
      {isLoggedIn && (
        <div>
          <br></br>
          <div>
            Congrats! You've provisioned an ACS user identity and initialized the ACS Calling Client Web SDK. You are
            ready to start making calls!
          </div>
          <div>
            The Identity you've provisioned is:{' '}
            <span className="identity">
              <b>{mri}</b>
            </span>
          </div>
          <div>
            Usage is tagged with:{' '}
            <span className="identity">
              <b>{clientTag}</b>
            </span>
          </div>
        </div>
      )}
      {showSpinner && (
        <div className="custom-row justify-content-left align-items-center mt-4">
          <div className="loader"> </div>
          <div className="ml-2">Fetching token from service and initializing SDK...</div>
        </div>
      )}
      {!isLoggedIn && (
        <div>
          <div className="ms-Grid-row">
            <div className="ms-Grid-col ms-sm12 ms-lg6 ms-xl6 ms-xxl3">
              <TextField
                className="mt-3"
                defaultValue={undefined}
                label="Optional display name"
                onChange={(event) => setDisplayName((event.target as HTMLTextAreaElement).value)}
              />
              <TextField
                className="mt-3"
                defaultValue={clientTag}
                label="Optional: Tag this usage session"
                onChange={(event) => setClientTag((event.target as HTMLTextAreaElement).value)}
              />
            </div>
          </div>
          <div className="mt-1">
            <PrimaryButton
              className="primary-button mt-3"
              iconProps={{ iconName: 'ReleaseGate', style: { verticalAlign: 'middle', fontSize: 'large' } }}
              label="Provision an user"
              disabled={disableInitializeButton}
              onClick={provisionNewUser}
            >
              Provision user and initialize SDK
            </PrimaryButton>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Login;
