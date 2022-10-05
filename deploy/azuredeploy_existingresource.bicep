@description('Name of the AppService to create.')
param appName string

@description('The SKU of App Service Plan.')
param sku string = 'F1'

param communicationServicesResourceId string = ''

var appServicePlanPortalName = 'AppServicePlan-${appName}'
var packageUrl = 'https://github.com/Azure-Samples/communication-services-pstn-calling/releases/latest/download/calling-tutorial-build.zip'
var location = resourceGroup().location

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
  dependsOn: [
    serverFarm
  ]
  properties: {
    serverFarmId: resourceId('Microsoft.Web/serverfarms', appServicePlanPortalName)
  }

  resource appsettings 'config@2022-03-01' = {
    name: 'appsettings'
    properties: {
      ConnectionString: listkeys(communicationServicesResourceId, '2020-08-20').primaryConnectionString
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
