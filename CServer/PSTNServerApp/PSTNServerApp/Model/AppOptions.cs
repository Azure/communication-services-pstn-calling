using Microsoft.AspNetCore.Builder.Extensions;
using Newtonsoft.Json.Linq;

namespace PSTNServerApp.Model
{
    public class AppOptions
    {
        public const string Name = "PSTNServerApp";

        private string connectionString = String.Empty;
        public string ConnectionString
        {
            get
            {
                if (this.connectionString != null && IsValidConnectionString(this.connectionString))
                {
                    return this.connectionString;
                }
                var connectionString = System.Environment.GetEnvironmentVariable("ConnectionString");
                if (connectionString != null && IsValidConnectionString(connectionString))
                {
                    this.connectionString = connectionString;
                    return connectionString;
                }
                throw new ArgumentException("ConnectionString not found. Set the ConnectionString in the appsettings.json or as an environment variable.");
            }

            // <summary>
            /// Load the connection string from either the App Options or the environment variables.
            /// If there is no ConnectionString in the AppOptions, this function will try to read
            /// 'ConnectionString' from the environment variables.
            /// Throws error when neither is available.
            /// </summary>
            /// <param name="appOptions">The options with which this application was started.</param>
            /// <returns>Connection String</returns>
            /// <exception cref="ArgumentException">In the case no connection string could be found.</exception>
            set
            {
                this.connectionString = value;
            }
        }

        /// <summary>
        /// Check whether a given connection string is valid.
        /// It is valid if it is not null and if it contains an endpoint and an access key.
        /// </summary>
        /// <param name="connectionString">The connection string to check.</param>
        /// <returns>Boolean indicating validity of the connection string.</returns>
        public Boolean IsValidConnectionString(string? connectionString)
        {
            if (connectionString == null)
            {
                return false;
            }
            string lowString = connectionString.ToLower();
            return lowString.Contains("endpoint=") && lowString.Contains("accesskey=");
        }
    }
}
