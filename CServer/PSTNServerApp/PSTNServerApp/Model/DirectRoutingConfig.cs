namespace PSTNServerApp.Model
{
    public class DirectRoutingConfig
    {
        public List<SbcConfig> Trunks { get; set; }
        public List<VoiceRoute> Routes { get; set; }
    }
}
