using MadeByDade.Living.Data.Bills;
using MadeByDade.Living.Data.Budget;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace MadeByDade.Living.Data;

public class LivingContext : DbContext
{
    public LivingContext() { }
    public LivingContext(DbContextOptions options) : base(options) { }

    public DbSet<BudgetItem> BudgetItems => Set<BudgetItem>();

    public DbSet<Bill> Bills => Set<Bill>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            _ = optionsBuilder.UseSqlServer(
                connectionString: "Server=(localdb)\\mssqllocaldb;Database=Living;Trusted_Connection=True;MultipleActiveResultSets=true",
                sqlServerOptionsAction: x => x.MigrationsAssembly(Assembly.GetAssembly(typeof(LivingContext))!.FullName)
            );
        }

        base.OnConfiguring(optionsBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bill>()
            .HasMany(bill => bill.Payments)
            .WithOne(payment => payment.Bill)
            .HasForeignKey(payment => payment.BillId);

        base.OnModelCreating(modelBuilder);
    }
}