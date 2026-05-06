using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
    public enum BookingStatus
    {
        Active,     // Активно (Y)
        Completed,  // Завершено (N)
        Cancelled   // Отменено (N)
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
        public BookingStatus Status { get; set; } = BookingStatus.Active;
        
        public decimal LastPrice { get; set; }
    }
}