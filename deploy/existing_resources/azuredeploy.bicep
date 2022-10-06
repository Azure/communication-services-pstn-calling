@description('Name of the AppService to create.')
param appName string

@description('The SKU of App Service Plan.')
param sku string = 'F1'

var appServicePlanPortalName = 'AppServicePlan-${appName}'
var packageUrl = 'https://github.com/Azure/communication-services-pstn-calling/releases/latest/download/calling-tutorial-build.zip'
var location = resourceGroup().location
var communicationServicesResourceId = ''
var splitAcsId = split(communicationServicesResourceId, '/')

resource serverFarm 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanPortalName
  location: location
  sku: {
    name: sku
  }
  properties: {}
}

resource ACS 'Microsoft.Communication/communicationServices@2022-07-01-preview' existing = {
  scope: resourceGroup(splitAcsId[2], splitAcsId[4])
  name: splitAcsId[8]
}

resource site 'Microsoft.Web/sites@2022-03-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: serverFarm.id
  }

  resource appsettings 'config@2022-03-01' = {
    name: 'appsettings'
    properties: {
      ConnectionString: ACS.listkeys().primaryConnectionString
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

module applyIncomingCallEvent './applyEvent.bicep' = {
  name: 'applyIncomingCallEvent'
  scope: resourceGroup(splitAcsId[2], splitAcsId[4])
  params: {
    communicationServicesResourceId: communicationServicesResourceId
    defaultHostName: site.properties.defaultHostName
  }

  dependsOn: [ site::MSDeploy ]
}
