namespace PSTNServerApp.Model
{
    using System;

    [Serializable]
    public class IncomingCallEvent
    {
        public CallParticipant From { get; set; }

        public CallParticipant To { get; set; }

        public string HasIncomingVideo { get; set; }

        public string CallerDisplayName { get; set; }

        public string CorrelationId { get; set; }

        public string IncomingCallContext { get; set; }

        public override string ToString()
        {
            return $"From: {From} To: {To} HasIncomingVideo: {HasIncomingVideo} CallerDisplayName: {CallerDisplayName} CorrelationId: {CorrelationId}  IncomingCallContext: {IncomingCallContext}";
        }
    }
}
