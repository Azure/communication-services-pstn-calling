using Azure.Messaging.EventGrid;
using Azure.Messaging.EventGrid.SystemEvents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSTNServerApp.Model;

namespace PSTNServerApp.Controllers
{
    using Azure.Communication;
    using Azure.Communication.CallingServer;
    using Azure.Communication.Identity;
    using Microsoft.Extensions.Logging;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Serialization;
    using System.Collections.Concurrent;
    using System.Net;

    /// <summary>
    /// Controller that handles all call related API endpoints.
    /// The two endpoints are: 
    ///     Exposing the connectionString (necessary for Direct Routing configurations)
    ///     Registering to redirect calls from phone numbers to applications identified by MRIs
    ///     Responding to incoming call events from EventGrid
    /// </summary>
    public class CallController : Controller
    {

        private readonly CallAutomationClient callClient;
        private readonly CommunicationIdentityClient identityClient;
        static readonly ConcurrentDictionary<string, string> phoneNumberToMriMap = new ConcurrentDictionary<string, string>();
        private readonly ILogger<CallController> logger;

        /// <summary>
        /// Initialize the CallController class
        /// </summary>
        /// <param name="appOptions">The options for this app as supplied in appsettings.json</param> The options for this app as supplied in appsettings.json
        /// <param name="logger">Logger to keep track of events.</param>
        public CallController(AppOptions appOptions, ILogger<CallController> logger)
        {
            this.logger = logger;
            this.callClient = new CallAutomationClient(appOptions.ConnectionString);
            this.identityClient = new CommunicationIdentityClient(appOptions.ConnectionString);
        }

        /// <summary>
        /// Respond to an incoming call.
        /// This is only called by ACS through the EventGrid, not by the front-end.
        /// Checks the body of the request for the kind of request (incoming call or 
        /// eventGrid subscription validation) and calls the appropriate method.
        /// </summary>
        /// <param name="request">Request from EventGrid.</param>
        /// <returns>Http Response</returns>
        [HttpPost("/incomingCall")]
        [AllowAnonymous]
        public async Task<IActionResult> OnIncomingCallRequestAsync([FromBody] object request)
        {
            logger.LogInformation("Request on /incomingCall");
            
            // parse the request
            var httpContent = new BinaryData(request.ToString()).ToStream();
            var cloudEvent = EventGridEvent.ParseMany(BinaryData.FromStream(httpContent)).FirstOrDefault();

            // Check how the server app should respond
            if (cloudEvent == null)
            {
                logger.LogWarning("Could not extract cloud event from request.");
            } 
            else if (cloudEvent.EventType == SystemEventNames.EventGridSubscriptionValidation)
            {
                logger.LogInformation("Providing Subscription Validation");
                return HandleSubscriptionValidation(cloudEvent);
            }
            else if (cloudEvent.EventType.Equals("Microsoft.Communication.IncomingCall"))
            {
                logger.LogInformation($"Responding to Incoming Call");
                return await HandleCallEvent(cloudEvent);
            } 
            else
            {
                logger.LogInformation("Unknown request for /incomingCall");
            }

            return StatusCode((int)HttpStatusCode.OK);
        }

        /// <summary>
        /// Configure the app to redirect calls to the front-end.
        /// The front-end registers its MRI (which identifies its connection to ACS)
        /// and supplies which phone number it wants to listen for.
        /// </summary>
        /// <param name="phoneNumber">The phone number for which to route calls to the front-end.</param>
        /// <param name="mri">The MRI of the front-end app, to route the calls to.</param>
        /// <returns></returns>
        [HttpPost("/configure")]
        [AllowAnonymous]
        public IActionResult OnConfigureRequest(string phoneNumber, string mri)
        {
            if (phoneNumber == null || mri == null)
            {
                logger.LogInformation($"Bad request, no phone number ({phoneNumber}) of no mri ({mri})");
                return BadRequest();
            }
            logger.LogInformation($"Request to configure phone number {phoneNumber} for mri {mri}");
            phoneNumberToMriMap.AddOrUpdate(phoneNumber, mri, (a, b) => mri);
            return Ok();
        }

        [HttpPost("/tokens/provisionUser")]
        [AllowAnonymous]
        public async Task<IActionResult> OnProvisionUserRequest()
        {
            logger.LogInformation("Request to provision a user at /tokens/provisionUser");
            var list = new List<CommunicationTokenScope>();
            list.Add(CommunicationTokenScope.VoIP);
            var userAndToken = await identityClient.CreateUserAndTokenAsync(list);
            
            var json = JsonConvert.SerializeObject(
                userAndToken.Value,
                new JsonSerializerSettings
                {
                    ContractResolver = new CamelCasePropertyNamesContractResolver()
                }
            );
            return Content(
                json,
                System.Net.Mime.MediaTypeNames.Application.Json,
                System.Text.Encoding.UTF8
            );
        }

        /// <summary>
        /// Handle the event of subscription validation.
        /// When subscribing this endpoint to an Azure EventGrid subscription, 
        /// the EventGrid likes to validate this endpoint actually exists.
        /// </summary>
        /// <param name="cloudEvent">The event from EventGrid</param>
        /// <returns>Http Response 404/NotFound if no ValidationCode was supplied, 200/OK else.</returns>
        public IActionResult HandleSubscriptionValidation(EventGridEvent cloudEvent)
        {
            // this section is for handling initial handshaking with Event webhook registration
            var eventData = cloudEvent.Data.ToObjectFromJson<SubscriptionValidationEventData>();
            var responseData = new SubscriptionValidationResponse
            {
                ValidationResponse = eventData.ValidationCode
            };

            if (responseData.ValidationResponse == null)
            {
                return NotFound();
            }
            return Ok(responseData);
        }

        /// <summary>
        /// Respond to an event for an incoming call. 
        /// Extracts the phone number the caller is calling from,
        /// and maps it to the front-end if the user has registered it using /configure.
        /// </summary>
        /// <param name="cloudEvent">Event generated by EventGrid</param>
        /// <returns>Http Response. Always 200/OK</returns>
        public async Task<IActionResult> HandleCallEvent(EventGridEvent cloudEvent)
        {
            
            var callEvent = JsonConvert.DeserializeObject<IncomingCallEvent>(cloudEvent.Data.ToString());
            if (callEvent != null && !callEvent.To.Kind.Equals("communicationUser") && callEvent.From.PhoneNumberValue.Length > 0)
            {
                var phoneNumber = callEvent.From.PhoneNumberValue;
                if (phoneNumberToMriMap.ContainsKey(phoneNumber))
                {
                    var mri = new CommunicationUserIdentifier(phoneNumberToMriMap[phoneNumber]);
                    if (!callEvent.To.RawId.Equals(mri))
                    {
                        logger.LogInformation($"Routing call from {phoneNumber} to {mri} with correlation id {callEvent.CorrelationId}");
                        await callClient.RedirectCallAsync(callEvent.IncomingCallContext, mri);
                    } else
                    {
                        logger.LogInformation("Received incoming call event for client app. Not forwarding.");
                    }
                } 
                else
                {
                    logger.LogInformation($"No MRI found for call from {phoneNumber}");
                }
                logger.LogInformation($"Finished routing call with /incomingCall {callEvent.CorrelationId}");
            }
            else
            {
                logger.LogInformation("Incoming call event found for communication user.");
            }
            return StatusCode((int)HttpStatusCode.OK);
        }
    }
}
