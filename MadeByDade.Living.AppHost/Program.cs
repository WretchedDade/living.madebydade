using Aspire.Hosting.Azure.Data.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

IDistributedApplicationBuilder builder = DistributedApplication.CreateBuilder(args);

//var cache = builder.AddRedis("cache");

bool useLocalDB = builder.Configuration.GetValue<bool>("UseLocalDB");

IResourceBuilder<ProjectResource> api = builder.AddProject<Projects.MadeByDade_Living_API>("living_api");

if (useLocalDB)
{
    IResourceBuilder<SqlServerDatabaseResource> sqlServer = builder.AddSqlServer("living_sql")
        .AddDatabase("Living");

    api = api
        .WithReference(sqlServer);
}
else
{
    api = api.WithEnvironment("ConnectionStrings__Living", "Living")
             .WithEnvironment("AzureAD__ClientSecret", "ClientSecret");
}

IResourceBuilder<AzureCosmosDBResource> cosmos = builder.AddAzureCosmosDB("living_cosmos");

api = api.WithReference(cosmos);

builder.AddNpmApp("living_ui", "../MadeByDade.Living.React", "dev")
    .WithReference(api)
    .WithServiceBinding(hostPort: 5173, scheme: "http", env: "PORT")
    .AsDockerfileInManifest();

builder.Build().Run();
