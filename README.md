---
page_type: sample
languages:
  - typescript
  - C# (ASP Core)
products:
  - azure
  - azure-communication-services
---

[![Deploy To Azure](https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/1-CONTRIBUTION-GUIDE/images/deploytoazure.svg?sanitize=true)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FAzure%2Fcommunication-services-pstn-calling%2Fmain%2Fdeploy%2Fazuredeploy.json)
[![Deploy To Azure US Gov](https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/1-CONTRIBUTION-GUIDE/images/deploytoazuregov.svg?sanitize=true)](https://portal.azure.us/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FAzure%2Fcommunication-services-pstn-calling%2Fmain%2Fdeploy%2Fazuredeploy.json)
[![Visualize](https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/1-CONTRIBUTION-GUIDE/images/visualizebutton.svg?sanitize=true)](http://armviz.io/#/?load=https%3A%2F%2Fraw.githubusercontent.com%2FAzure%2Fcommunication-services-pstn-calling%2Fmain%2Fdeploy%2Fazuredeploy.json)

# PSTN Calling Example

This is a sample application to show how one can setup a calling architecture and setup SIP trunks using the [`Azure.Communication.PhoneNumbers`](https://www.nuget.org/packages/Azure.Communication.PhoneNumbers) SDK.
Also, it showcases how the [`Azure.Communication.CallingServer`](https://www.nuget.org/packages/Azure.Communication.CallingServer) can be used to support inbound calling. Lastly, [`azure@communication-calling`](https://www.npmjs.com/package/@azure/communication-calling) package is be used to build the a calling experience.
The client-side application is a Typescript React based user interface. Alongside this front-end is a C# ASP Core web server application that generates new user tokens, gets and sets sip trunk configurations and voice routes, redirects inbound calls to the client application, and retrieves purchased phone numbers for each Client participant. This separate server is necessary as you do not not want to make the **connection string** public, which gives everyone access to your Azure Communication Service resource.

## Prerequisites

1. [npm](https://www.npmjs.com/get-npm)
2. [Node.js (v14)](https://nodejs.org/en/download/)
3. Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
4. Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You'll need to record your resource **connection string** for this quickstart.

## Code structure

- [`./Client/src`](./Client/src): Where the client code lives
- [`./Client/src/app/App.tsx`](./Client/src/app/App.tsx): Entry point into the Client sample
- [`./Server/`](./Server/src/): Where the C# ASP Core server code lives.
- [`./Server/src/app.ts`](./Server/src/app.ts): Entry point into the Server sample
- [`./Server/appsettings.json`](./Server/appsettings.json): Where to put your azure communication services connection string
- [`./deploy`](./deploy/): Bicep and ARM templates for automatic deployment of this app to an Azure AppService.
- [`./deploy/azuredeploy.bicep`](./deploy/azuredeploy.bicep): Bicep file for deployment of this app (creates a new Azure Communication Resource).
- [`./deploy/existing_resources/azuredeploy.bicep`](./deploy/existing_resources/azuredeploy.bicep): Bicep file for deployment of this app (connects to an existing Azure Communication Resource)

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/t-sanderv/communication-services-web-calling-tutorial`
3. `cd communication-services-web-calling-tutorial`
4. Get a connection string by creating an Azure Communication Services resource from the Azure portal. Use the connection string as value for key `ConnectionString` in `Server/appsettings.json` file.

## Local Run

1. Set your connection string in `Server/appsettings.json`
2. Open [`Server/PSTNServerApp.csproj`](Server/PSTNServerApp.csproj) with Visual Studio
3. Click `IIS Express` to start the server-side app.
4. Run `npm install` from the `Client` directory
5. Run `npm run start` from the `Client` directory
6. Open `http://localhost:5000` in a browser. (Supported browsers are Chrome, Edge Chromium, and Safari)

## Resources

1. Documentation on how to use the ACS Calling SDK for Javascript can be found on https://docs.microsoft.com/en-gb/azure/communication-services/quickstarts/voice-video-calling/calling-client-samples?pivots=platform-web
2. ACS Calling SDK for Javascript API reference documentation can be found on https://docs.microsoft.com/en-us/javascript/api/azure-communication-services/@azure/communication-calling/?view=azure-communication-services-js
