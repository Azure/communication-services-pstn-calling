namespace PSTNServerApp.Model
{
    using System;

    [Serializable]
    public class IncomingCallEvent
    {
        public CallParticipant From { get; set; } = new CallParticipant();

        public CallParticipant To { get; set; } = new CallParticipant();

        public string HasIncomingVideo { get; set; } = String.Empty;

        public string CallerDisplayName { get; set; } = String.Empty;

        public string CorrelationId { get; set; } = String.Empty;

        public string IncomingCallContext { get; set; } = String.Empty;

        public override string ToString()
        {
            return $"From: {From} To: {To} HasIncomingVideo: {HasIncomingVideo} CallerDisplayName: {CallerDisplayName} CorrelationId: {CorrelationId}  IncomingCallContext: {IncomingCallContext}";
        }
    }
}
