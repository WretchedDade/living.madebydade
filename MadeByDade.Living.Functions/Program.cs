using MadeByDade.Living.Data;
using MadeByDade.Living.ServiceDefaults;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Reflection;

new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .AddServiceDefaults()
    .ConfigureServices((context, services) =>
    {
        _ = services.AddApplicationInsightsTelemetryWorkerService();
        _ = services.ConfigureFunctionsApplicationInsights();

        _ = services.AddDbContext<LivingContext>(options =>
        {
            _ = options.UseSqlServer(
                connectionString: context.Configuration.GetConnectionString("Living"),
                sqlServerOptionsAction: optionsBuilder =>
                {
                    _ = optionsBuilder.MigrationsAssembly(Assembly.GetAssembly(typeof(LivingContext))!.FullName);
                    _ = optionsBuilder.EnableRetryOnFailure();
                });
        });
    })
    .Build()
    .Run();
