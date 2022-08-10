// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { PrimaryButton } from '@fluentui/react';

const Card = ({title, showCodeIconName, code, children, subTitle, extraButton }) => {
    const [showCode, setShowCode] = React.useState(false);
    // debugger;
    return (
        <div className="card">
            <div className="ms-Grid">
                <div className="ms-Grid-row">
                    {subTitle ?  
                        <div className='ms-Grid-col ms-lg6 ms-sm6 mb-4'>
                            <h2>{title}</h2>
                            <div>{subTitle}</div>
                        </div>
                        :
                        <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">{title}</h2>
                    }
                    <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                        {extraButton ? extraButton : ''}
                        <PrimaryButton
                            className="primary-button"
                            iconProps={{ 
                                iconName: showCodeIconName, 
                                style: { verticalAlign: 'middle', fontSize: 'large' } }
                            }
                            text={`${showCode ? 'Hide' : 'Show'} code`}
                            onClick={() => setShowCode((oldShowCode) => !oldShowCode)} />
                    </div>
                </div>
                {
                    showCode &&
                    <pre>
                        <code style={{ color: '#b3b0ad' }}>
                            {code}
                        </code>
                    </pre>
                }
                {children}
            </div>
        </div>
    );
};

export default Card;