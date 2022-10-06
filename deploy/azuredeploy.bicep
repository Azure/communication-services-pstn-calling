@description('Name of the AppService to create.')
param appName string

@description('The SKU of App Service Plan.')
param sku string = 'F1'

var appServicePlanPortalName = 'AppServicePlan-${appName}'
var packageUrl = 'https://github.com/Azure/communication-services-pstn-calling/releases/latest/download/calling-tutorial-build.zip'
var commsName = 'CommunicationServices-${appName}'
var location = resourceGroup().location

resource ACS 'Microsoft.Communication/communicationServices@2020-08-20' = {
  name: commsName
  location: 'global'
  properties: {
    dataLocation: 'United States'
  }
}

resource serverFarm 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanPortalName
  location: location
  sku: {
    name: sku
  }
  properties: {}
}

resource site 'Microsoft.Web/sites@2022-03-01' = {
  name: appName
  location: location
  dependsOn: [ ACS ]
  properties: {
    serverFarmId: serverFarm.id
  }

  resource appsettings 'config@2022-03-01' = {
    name: 'appsettings'
    properties: {
      ConnectionString: ACS.listKeys().primaryConnectionString
    }
  }

  resource MSDeploy 'extensions@2022-03-01' = {
    name: 'MSDeploy'
    dependsOn: [ appsettings ]
    properties: {
      packageUri: packageUrl
    }
  }
}

resource incomingCallEventSub 'Microsoft.EventGrid/eventSubscriptions@2022-06-15' = {
  name: 'PSTNIncomingCallSubscription'
  scope: ACS
  properties: {
    destination: {
      properties: {
        endpointUrl: 'https://${site.properties.defaultHostName}/incomingCall'
      }
      endpointType: 'WebHook'
    }
    filter: {
      includedEventTypes: [ 'Microsoft.Communication.IncomingCall' ]
    }
  }
  dependsOn: [ site::MSDeploy ]
}
