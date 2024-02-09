namespace MadeByDade.Living.AppHost;

public static class Extensions
{
    public static IResourceBuilder<ExecutableResource> AddAzureFunction<TServiceMetadata>(
        this IDistributedApplicationBuilder builder,
        string name,
        int port)
        where TServiceMetadata : IServiceMetadata, new()
    {
        var serviceMetadata = new TServiceMetadata();
        string projectPath = serviceMetadata.ProjectPath;
        string projectDirectory = Path.GetDirectoryName(projectPath)!;

        string[] args = new[]
        {
            "host",
            "start",
            "--port",
            port.ToString(),
            "--dotnet-isolated-debug",
            "--pause-on-error"
        };

        return builder.AddResource(new ExecutableResource(name, "func", projectDirectory, args))
            .WithOtlpExporter();
    }
}
