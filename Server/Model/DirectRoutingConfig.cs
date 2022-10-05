using Azure.Communication.PhoneNumbers.SipRouting;

namespace PSTNServerApp.Model
{
    public class DirectRoutingConfig
    {
        public DirectRoutingConfig(IReadOnlyList<SipTrunk> trunks, IReadOnlyList<SipTrunkRoute> routes)
        {
            Trunks = trunks;
            Routes = routes;
        }

        public IReadOnlyList<SipTrunk> Trunks { get; set; }
        public IReadOnlyList<SipTrunkRoute> Routes { get; set; }
    }
}
