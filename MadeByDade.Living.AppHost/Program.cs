using Microsoft.Extensions.Configuration;

IDistributedApplicationBuilder builder = DistributedApplication.CreateBuilder(args);

//var cache = builder.AddRedis("cache");

bool useLocalDB = builder.Configuration.GetValue<bool>("UseLocalDB");

IResourceBuilder<ProjectResource> api = builder.AddProject<Projects.MadeByDade_Living_API>("API");

if (useLocalDB)
{
    IResourceBuilder<SqlServerDatabaseResource> sqlServer = builder.AddSqlServer("SQL")
    .AddDatabase("Living");

    api = api.WithReference(sqlServer);
}

builder.AddNpmApp("UI", "../MadeByDade.Living.React", "dev")
    .WithReference(api)
    .WithServiceBinding(hostPort: 5173, scheme: "http", env: "PORT")
    .AsDockerfileInManifest();

builder.Build().Run();
