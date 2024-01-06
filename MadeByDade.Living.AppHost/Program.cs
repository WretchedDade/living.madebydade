IDistributedApplicationBuilder builder = DistributedApplication.CreateBuilder(args);

//var cache = builder.AddRedis("cache");

IResourceBuilder<SqlServerDatabaseResource> sqlServer = builder.AddSqlServer("SQL")
    .AddDatabase("living");

IResourceBuilder<ProjectResource> api = builder.AddProject<Projects.MadeByDade_Living_API>("API")
    .WithReference(sqlServer);

builder.AddNpmApp("UI", "../MadeByDade.Living.React", "dev")
    .WithReference(api)
    .WithServiceBinding(scheme: "http", env: "PORT")
    .AsDockerfileInManifest();

builder.Build().Run();
