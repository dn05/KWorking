using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
    public enum BookingStatus
    {
        Pending,    // ожидает подтверждения (НОВЫЙ СТАТУС)
        Active,     // активно
        Completed,  // завершено
        Cancelled   // отменено
    }

    public class Booking
    {
        [Key]
        public int Id_booking { get; set; }

        public int Id_client { get; set; }

        public int Id_workPlace { get; set; }

        public int Id_tariff { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        [Column(TypeName = "varchar(20)")]
        public BookingStatus Status { get; set; } = BookingStatus.Pending; // ПО УМОЛЧАНИЮ Pending

        public decimal LastPrice { get; set; }

        [ForeignKey(nameof(Id_client))]
        public virtual Client? Client { get; set; }

        [ForeignKey(nameof(Id_workPlace))]
        public virtual WorkPlace? WorkPlace { get; set; }

        [ForeignKey(nameof(Id_tariff))]
        public virtual Tariff? Tariff { get; set; }
    }
}