using MadeByDade.Living.Data;
using MadeByDade.Living.ServiceDefaults;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using System.Reflection;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

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

builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))
        .EnableTokenAcquisitionToCallDownstreamApi()
            .AddMicrosoftGraph(builder.Configuration.GetSection("MicrosoftGraph"))
            .AddInMemoryTokenCaches();

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

WebApplication app = builder.Build();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    _ = app.UseSwagger();
    _ = app.UseSwaggerUI();

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

if (app.Environment.IsDevelopment())
{
    _ = app.UseSwagger();
    _ = app.UseSwaggerUI();
};

app.UseHttpsRedirection();

app.UseCors(static builder => builder.AllowAnyMethod().AllowAnyHeader().AllowAnyOrigin());

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
