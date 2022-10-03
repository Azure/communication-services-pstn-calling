// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { AcceptCallOptions, IncomingCall } from '@azure/communication-calling';

type IncomingCallCardType = {
  incomingCall: IncomingCall;
  getCallOptions: () => Promise<AcceptCallOptions>;
  onReject: () => any;
};

const IncomingCallCard: React.FC<IncomingCallCardType> = ({ incomingCall, getCallOptions, onReject }) => {
  const [callOptions, setCallOptions] = React.useState<AcceptCallOptions | null>(null);

  React.useEffect(() => {
    const callback = async () => {
      setCallOptions({ audioOptions: (await getCallOptions()).audioOptions });
    };
    callback();
  }, [getCallOptions]);

  if (callOptions == null) {
    return <></>;
  }
  return (
    <div className="ms-Grid mt-2">
      <div className="ms-Grid-row">
        <div className="ms-Grid-col ms-lg6">
          <h2>Incoming Call...</h2>
        </div>
        <div className="ms-Grid-col ms-lg6 text-right">{incomingCall && <h2>Call Id: {incomingCall.id}</h2>}</div>
      </div>
      <div className="custom-row">
        <div className="ringing-loader mb-4"></div>
      </div>
      <div className="ms-Grid-row text-center">
        <span className="incoming-call-button" title={'Answer call'} onClick={() => incomingCall.accept(callOptions)}>
          <Icon iconName="IncomingCall" />
        </span>
        <span
          className="incoming-call-button"
          title={'Reject call'}
          onClick={() => {
            incomingCall.reject();
            onReject();
          }}
        >
          <Icon iconName="DeclineCall" />
        </span>
      </div>
    </div>
  );
};

export default IncomingCallCard;
