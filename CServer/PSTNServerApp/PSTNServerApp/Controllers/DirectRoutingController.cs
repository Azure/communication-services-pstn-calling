using Microsoft.AspNetCore.Mvc;
using PSTNServerApp.Model;

namespace PSTNServerApp.Controllers
{
    public class DirectRoutingController : Controller
    {
        
        private readonly ILogger<DirectRoutingController> logger;

        public DirectRoutingController(AppOptions appOptions, ILogger<DirectRoutingController> logger)
        {
            this.logger = logger;
        }

        public IActionResult OnRouteConfigureRequest([FromBody] DirectRoutingConfig config)
        {
            // TODO finish with internet
            return Ok();
        }

        public IActionResult Index()
        {
            return View();
        }
    }
}
