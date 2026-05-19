using kworking.API.Models;
using Microsoft.EntityFrameworkCore;

namespace kworking.API.Data
{
    public class KworkingDbContext : DbContext
    {
        public KworkingDbContext(DbContextOptions<KworkingDbContext> options)
            : base(options) { }

        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Tariff> Tariffs { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<WorkPlace> WorkPlaces { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Decimal precision
            modelBuilder.Entity<Tariff>()
                .Property(t => t.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Booking>()
                .Property(b => b.LastPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Payment>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");

            // Уникальные индексы
            modelBuilder.Entity<Client>()
                .HasIndex(c => c.Email).IsUnique();

            modelBuilder.Entity<Client>()
                .HasIndex(c => c.Phone).IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Login).IsUnique();

            modelBuilder.Entity<Tariff>()
                .HasIndex(t => t.Name).IsUnique();

            modelBuilder.Entity<WorkPlace>()
                .HasIndex(w => w.Name).IsUnique();

            // Связи
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Client)
                .WithMany()
                .HasForeignKey(b => b.Id_client)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.WorkPlace)
                .WithMany()
                .HasForeignKey(b => b.Id_workPlace)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Tariff)
                .WithMany()
                .HasForeignKey(b => b.Id_tariff)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Booking)
                .WithMany()
                .HasForeignKey(p => p.Id_booking)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Client)
                .WithMany()
                .HasForeignKey(u => u.Id_client)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);
        }
    }
}