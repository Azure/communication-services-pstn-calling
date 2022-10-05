using Microsoft.AspNetCore.Builder.Extensions;
using Newtonsoft.Json.Linq;

namespace PSTNServerApp.Model
{
    public class AppOptions
    {
        public const string Name = "PSTNServerApp";

        public string ConnectionString { get; set; } = String.Empty;
        public string GetConnectionString()
        {
            if (ConnectionString != null && IsValidConnectionString(ConnectionString))
            {
                return ConnectionString;
            }
            var connectionString = Environment.GetEnvironmentVariable("ConnectionString");
            if (connectionString != null && IsValidConnectionString(connectionString))
            {
                ConnectionString = connectionString;
                return connectionString;
            }
            throw new ArgumentException("ConnectionString not found. Set the ConnectionString in the appsettings.json or as an environment variable.");
        }

        /// <summary>
        /// Check whether a given connection string is valid.
        /// It is valid if it is not null and if it contains an endpoint and an access key.
        /// </summary>
        /// <param name="connectionString">The connection string to check.</param>
        /// <returns>Boolean indicating validity of the connection string.</returns>
        public static bool IsValidConnectionString(string? connectionString)
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
