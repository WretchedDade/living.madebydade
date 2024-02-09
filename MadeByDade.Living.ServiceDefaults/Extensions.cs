using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace MadeByDade.Living.ServiceDefaults;

public static class Extensions
{
    public static WebApplicationBuilder AddServiceDefaults(this WebApplicationBuilder builder)
    {
        builder.Host.AddServiceDefaults();
        return builder;
    }

    public static IHostBuilder AddServiceDefaults(this IHostBuilder builder)
    {
        _ = builder.ConfigureOpenTelemetry();

        _ = builder.AddDefaultHealthChecks();

        _ = builder.ConfigureServices(services =>
        {
            _ = services.AddServiceDiscovery();

            _ = services.ConfigureHttpClientDefaults(http =>
            {
                // Turn on resilience by default
                _ = http.AddStandardResilienceHandler();

                // Turn on service discovery by default
                _ = http.UseServiceDiscovery();
            });
        });

        return builder;
    }

    public static IHostBuilder ConfigureOpenTelemetry(this IHostBuilder builder)
    {
        _ = builder.ConfigureLogging(logging =>
        {
            _ = logging.AddOpenTelemetry(logging =>
            {
                logging.IncludeFormattedMessage = true;
                logging.IncludeScopes = true;
            });
        });

        _ = builder.ConfigureServices((context, services) =>
        {
            _ = services.AddOpenTelemetry()
                .WithMetrics(metrics =>
                {
                    _ = metrics.AddRuntimeInstrumentation()
                           .AddBuiltInMeters();
                })
                .WithTracing(tracing =>
                {
                    if (context.HostingEnvironment.IsDevelopment())
                        // We want to view all traces in development
                        _ = tracing.SetSampler(new AlwaysOnSampler());

                    _ = tracing.AddAspNetCoreInstrumentation()
                           .AddGrpcClientInstrumentation()
                           .AddHttpClientInstrumentation();
                });
        });

        _ = builder.AddOpenTelemetryExporters();

        return builder;
    }

    private static IHostBuilder AddOpenTelemetryExporters(this IHostBuilder builder)
    {
        _ = builder.ConfigureServices((context, services) =>
        {

            bool useOtlpExporter = !string.IsNullOrWhiteSpace(context.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]);

            if (useOtlpExporter)
            {
                _ = services.Configure<OpenTelemetryLoggerOptions>(logging => logging.AddOtlpExporter());
                _ = services.ConfigureOpenTelemetryMeterProvider(metrics => metrics.AddOtlpExporter());
                _ = services.ConfigureOpenTelemetryTracerProvider(tracing => tracing.AddOtlpExporter());
            }
        });

        // Uncomment the following lines to enable the Prometheus exporter (requires the OpenTelemetry.Exporter.Prometheus.AspNetCore package)
        // builder.Services.AddOpenTelemetry()
        //    .WithMetrics(metrics => metrics.AddPrometheusExporter());

        // Uncomment the following lines to enable the Azure Monitor exporter (requires the Azure.Monitor.OpenTelemetry.Exporter package)
        // builder.Services.AddOpenTelemetry()
        //    .UseAzureMonitor();

        return builder;
    }

    public static IHostBuilder AddDefaultHealthChecks(this IHostBuilder builder)
    {
        _ = builder.ConfigureServices(services =>
        {
            _ = services.AddHealthChecks()
                // Add a default liveness check to ensure app is responsive
                .AddCheck("self", () => HealthCheckResult.Healthy(), ["live"]);
        });

        return builder;
    }

    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    {
        // Uncomment the following line to enable the Prometheus endpoint (requires the OpenTelemetry.Exporter.Prometheus.AspNetCore package)
        // app.MapPrometheusScrapingEndpoint();

        // All health checks must pass for app to be considered ready to accept traffic after starting
        _ = app.MapHealthChecks("/health");

        // Only health checks tagged with the "live" tag must pass for app to be considered alive
        _ = app.MapHealthChecks("/alive", new HealthCheckOptions
        {
            Predicate = r => r.Tags.Contains("live")
        });

        return app;
    }

    private static MeterProviderBuilder AddBuiltInMeters(this MeterProviderBuilder meterProviderBuilder) =>
        meterProviderBuilder.AddMeter(
            "Microsoft.AspNetCore.Hosting",
            "Microsoft.AspNetCore.Server.Kestrel",
            "System.Net.Http");
}
