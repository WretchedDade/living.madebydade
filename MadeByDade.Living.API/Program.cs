using MadeByDade.Living.Data;
using MadeByDade.Living.Data.Bills;
using MadeByDade.Living.ServiceDefaults;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using System.Reflection;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

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

    _ = context.Bills.Add(new()
    {
        Name = "Dominion Energy",
        Amount = 106,
        DayDue = DateTime.Today.AddDays(5).Day,
        DueType = BillDueType.Fixed,
        Payments = [
            new BillPayment()
            {
                CreatedOn = DateTime.Now,
                DateDue = DateTime.Today.AddDays(5),
            }
        ]
    });

    _ = context.Bills.Add(new()
    {
        Name = "Mortgage",
        Amount = 1213,
        DayDue = DateTime.Today.AddDays(2).Day,
        DueType = BillDueType.Fixed,
        IsAutoPay = true,
        Payments = [
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddDays(2), },
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddDays(3), },
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddDays(4), },
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddDays(5), },
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddDays(6), },
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddDays(7), },
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddMonths(1), },
            new BillPayment(){ CreatedOn = DateTime.Now, DateDue = DateTime.Today.AddMonths(2), },
        ]
    });

    _ = context.Bills.Add(new()
    {
        Name = "Water & Sewer",
        Amount = 76,
        DayDue = 0,
        DueType = BillDueType.EndOfMonth
    });

    _ = context.SaveChanges();

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

app.Run();
