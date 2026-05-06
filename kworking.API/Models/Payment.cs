using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
    public enum PaymentStatus
    {
        Pending,   // Ожидает оплаты
        Paid,      // Оплачено
        Cancelled  // Отменено
    }

    public class Payment
    {
        [Key]
        public int Id_payment { get; set; }  
        
        public int Id_booking { get; set; }  
        public decimal Price { get; set; }
        
        [Column(TypeName = "varchar(20)")]
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        
        public DateTime PaymentDate { get; set; } = DateTime.Now;
    }
}