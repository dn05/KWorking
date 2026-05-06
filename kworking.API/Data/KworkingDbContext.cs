using kworking.API.Models;
using Microsoft.EntityFrameworkCore;


namespace kworking.API.Data;

public class KworkingDbContext : DbContext
{
    public KworkingDbContext(DbContextOptions<KworkingDbContext> options) 
        : base(options)
    {
    }

    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Tariff> Tariffs { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<WorkPlace> WorkPlaces { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Tariff>()
            .Property(t => t.Price)
            .HasColumnType("decimal(18,2)");
            
        
    }
}