using Hangfire;
using MadeByDade.Living.API;
using MadeByDade.Living.API.Jobs;
using MadeByDade.Living.Data;
using MadeByDade.Living.ServiceDefaults;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using System.Reflection;
using System.Text.Json.Serialization;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddHangfire(config =>
{
    _ = config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(builder.Configuration.GetConnectionString("Living"), new()
        {
            QueuePollInterval = TimeSpan.FromMinutes(30),
        });
});

builder.Services.AddHangfireServer();

builder.Services.AddDbContext<LivingContext>(options =>
{
    _ = options.UseSqlServer(
        connectionString: builder.Configuration.GetConnectionString("Living"),
        sqlServerOptionsAction: optionsBuilder =>
        {
            _ = optionsBuilder.MigrationsAssembly(Assembly.GetAssembly(typeof(LivingContext))!.FullName);
            _ = optionsBuilder.EnableRetryOnFailure();
        });
});

builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))
        .EnableTokenAcquisitionToCallDownstreamApi()
            .AddMicrosoftGraph(builder.Configuration.GetSection("MicrosoftGraph"))
            .AddInMemoryTokenCaches();

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<ICreateUpcomingBillPayments, CreateUpcomingBillPayments>();

WebApplication app = builder.Build();

app.MapDefaultEndpoints();

_ = app.UseSwagger();
_ = app.UseSwaggerUI();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    _ = app.UseCors(static builder => builder.AllowAnyMethod().AllowAnyHeader().AllowAnyOrigin());

    using IServiceScope scope = app.Services.CreateScope();

    LivingContext context = scope.ServiceProvider.GetRequiredService<LivingContext>();
    _ = context.Database.EnsureCreated();
}
else
{
    _ = app.UseCors(static builder => builder.WithOrigins("https://living.madebydade.dev").AllowAnyMethod().AllowAnyHeader().AllowCredentials());

    _ = app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days.
    // You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    _ = app.UseHsts();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapHangfireDashboard("/jobs", new()
{
    Authorization = new[] { new HangfireDashboardAuthorizationFilter() }
});

RecurringJob.AddOrUpdate<ICreateUpcomingBillPayments>(
    recurringJobId: nameof(CreateUpcomingBillPayments),
    methodCall: service => service.Execute(), Cron.Daily()
);

app.Run();
