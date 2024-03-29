﻿namespace PSTNServerApp.Model
{
    using System;
    using System.Collections.Generic;

    [Serializable]

    public class CallParticipant
    {
        public string RawId { get; set; } = String.Empty;

        public string Kind { get; set; } = String.Empty;

        public IDictionary<string, string> CommunicationUser { get; set; } = new Dictionary<string, string>();

        public IDictionary<string, string> PhoneNumber { get; set; } = new Dictionary<string, string>();

        public string PhoneNumberValue => PhoneNumber != null && PhoneNumber.ContainsKey("value") ? PhoneNumber["value"] : string.Empty;

        public override string ToString()
        {
            string communicationUserPayload = string.Empty;
            string phoneNumberPayload = string.Empty;

            if (CommunicationUser != null)
            {
                foreach (KeyValuePair<string, string> kvp in CommunicationUser)
                {
                    communicationUserPayload += string.Format("key = {0}, value = {1}\n", kvp.Key, kvp.Value);
                }
            }

            if (PhoneNumber != null)
            {
                foreach (KeyValuePair<string, string> kvp in PhoneNumber)
                {
                    phoneNumberPayload += string.Format("key = {0}, value = {1}\n", kvp.Key, kvp.Value);
                }
            }

            return $"RawId: '{RawId}' PhoneNumber: '{phoneNumberPayload}' CommuincationUser: '{communicationUserPayload}'";
        }
    }
}
