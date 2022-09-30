namespace PSTNServerApp.Model
{
    public class VoiceRoute
    {
        public string Name { get; set; }
        public string NumberPattern { get; set; }
        public List<string> SbcKeys { get; set; }
    }
}
