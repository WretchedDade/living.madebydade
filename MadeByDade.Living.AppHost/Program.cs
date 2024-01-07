using Microsoft.Extensions.Configuration;

IDistributedApplicationBuilder builder = DistributedApplication.CreateBuilder(args);

//var cache = builder.AddRedis("cache");

bool useLocalDB = builder.Configuration.GetValue<bool>("UseLocalDB");

IResourceBuilder<ProjectResource> api = builder.AddProject<Projects.MadeByDade_Living_API>("living_api");

if (useLocalDB)
{
    IResourceBuilder<SqlServerDatabaseResource> sqlServer = builder.AddSqlServer("living_sql")
        .AddDatabase("Living");

    api = api.WithReference(sqlServer);
}
else
{
    api = api.WithEnvironment("ConnectionStrings__Living", "Living")
             .WithEnvironment("AzureAD__ClientSecret", "ClientSecret");
}

builder.AddNpmApp("living_ui", "../MadeByDade.Living.React", "dev")
    .WithReference(api)
    .WithServiceBinding(hostPort: 5173, scheme: "http", env: "PORT")
    .AsDockerfileInManifest();

builder.Build().Run();
