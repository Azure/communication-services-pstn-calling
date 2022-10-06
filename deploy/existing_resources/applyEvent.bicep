targetScope = 'resourceGroup'

param communicationServicesResourceId string
param defaultHostName string

var splitAcsId = split(communicationServicesResourceId, '/')

resource ACS 'Microsoft.Communication/communicationServices@2022-07-01-preview' existing = {
  name: splitAcsId[8]
}

resource incomingCallEventSub 'Microsoft.EventGrid/eventSubscriptions@2022-06-15' = {
  name: 'PSTNIncomingCallSubscription'
  scope: ACS
  properties: {
    destination: {
      properties: {
        endpointUrl: 'https://${defaultHostName}/incomingCall'
      }
      endpointType: 'WebHook'
    }
    filter: {
      includedEventTypes: [ 'Microsoft.Communication.IncomingCall' ]
    }
  }
}
