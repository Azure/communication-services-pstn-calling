using Microsoft.AspNetCore.Mvc;
using PSTNServerApp.Model;
using Azure.Communication.PhoneNumbers;
using Azure.Communication.PhoneNumbers.SipRouting;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;
using Microsoft.Extensions.Options;

namespace PSTNServerApp.Controllers
{
    public class PhoneNumbersController : Controller
    {
        
        private readonly ILogger<PhoneNumbersController> logger;
        private readonly SipRoutingClient sipRoutingClient;
        private readonly PhoneNumbersClient phoneNumbersClient;

        public PhoneNumbersController(IOptions<AppOptions> appOptions, ILogger<PhoneNumbersController> logger)
        {
            sipRoutingClient = new SipRoutingClient(appOptions.Value.GetConnectionString());
            phoneNumbersClient = new PhoneNumbersClient(appOptions.Value.GetConnectionString());
            this.logger = logger;
        }

        [HttpPost("/routing")]
        public async Task<IActionResult> OnRouteConfigureRequest([FromBody] DirectRoutingConfig config)
        {
            logger.LogInformation("Configuring new routes on /routing");

            // First empty the routes such that there is no clash between deleted SBCs and existing routes.
            await sipRoutingClient.SetRoutesAsync(new List<SipTrunkRoute>());
            await sipRoutingClient.SetTrunksAsync(config.Trunks);
            await sipRoutingClient.SetRoutesAsync(config.Routes);

            logger.LogInformation("Finish setting direct routes on /routing");
            return Ok();
        }

        [HttpGet("/routing")]
        public async Task<IActionResult> OnRouteRequest()
        {
            logger.LogInformation("Sending saved routes on /routing");
            var trunks = await sipRoutingClient.GetTrunksAsync();
            var routes = await sipRoutingClient.GetRoutesAsync();
            var result = new DirectRoutingConfig(trunks.Value, routes.Value);
            var json = JsonConvert.SerializeObject(
                result,
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

        [HttpGet("/phonenumbers")]
        public async Task<IActionResult> OnPhoneNumbersRequest()
        {
            logger.LogInformation("Sending saved phone numbers on /phonenumbers");
            var pageablePhoneNumbers = phoneNumbersClient.GetPurchasedPhoneNumbersAsync();
            var phoneNumbers = new List<string>();

            await foreach (PurchasedPhoneNumber phoneNumber in pageablePhoneNumbers)
            {
                phoneNumbers.Add(phoneNumber.PhoneNumber);
            }
            var json = JsonConvert.SerializeObject(
                phoneNumbers,
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
    }
}
