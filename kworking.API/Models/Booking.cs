using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
 
namespace kworking.API.Models
{
    public enum BookingStatus
    {
        PendingConfirmation, // Ожидает подтверждения администратором
        Active,              // Активно (подтверждено)
        Completed,           // Завершено
        Cancelled            // Отменено
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
 
        [Column(TypeName = "varchar(30)")]
        public BookingStatus Status { get; set; } = BookingStatus.PendingConfirmation;
 
        public decimal LastPrice { get; set; }
 
        [ForeignKey(nameof(Id_client))]
        public virtual Client? Client { get; set; }
 
        [ForeignKey(nameof(Id_workPlace))]
        public virtual WorkPlace? WorkPlace { get; set; }
 
        [ForeignKey(nameof(Id_tariff))]
        public virtual Tariff? Tariff { get; set; }
    }
}