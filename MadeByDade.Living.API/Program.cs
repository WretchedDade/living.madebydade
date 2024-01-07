using Hangfire;
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
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(builder.Configuration.GetConnectionString("Living"));
});

builder.Services.AddHangfireServer();

builder.Services.AddDbContext<LivingContext>(options =>
{
    _ = options.UseSqlServer(
        connectionString: builder.Configuration.GetConnectionString("Living"),
        sqlServerOptionsAction: optionsBuilder =>
        {
            optionsBuilder.MigrationsAssembly(Assembly.GetAssembly(typeof(LivingContext))!.FullName);
            optionsBuilder.EnableRetryOnFailure();
        });
});

builder.Services.AddScoped<ICreateUpcomingBillPayments, CreateUpcomingBillPayments>();

builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))
        .EnableTokenAcquisitionToCallDownstreamApi()
            .AddMicrosoftGraph(builder.Configuration.GetSection("MicrosoftGraph"))
            .AddInMemoryTokenCaches();

builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

WebApplication app = builder.Build();

app.MapDefaultEndpoints();

_ = app.UseSwagger();
_ = app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    options.RoutePrefix = string.Empty;
}); ;

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    using IServiceScope scope = app.Services.CreateScope();

    LivingContext context = scope.ServiceProvider.GetRequiredService<LivingContext>();
    _ = context.Database.EnsureCreated();
}
else
{
    _ = app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days.
    // You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    _ = app.UseHsts();
}

app.UseHttpsRedirection();

app.UseCors(static builder => builder.AllowAnyMethod().AllowAnyHeader().AllowAnyOrigin());

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapHangfireDashboard();

RecurringJob.AddOrUpdate<ICreateUpcomingBillPayments>(nameof(CreateUpcomingBillPayments), service => service.Execute(), Cron.Minutely());

app.Run();
