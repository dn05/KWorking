using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace kworking.API.Models
{
    public enum PaymentStatus
    {
        Pending,
        Paid,
        Cancelled
    }

    public class Payment
    {
        [Key]
        public int Id_payment { get; set; }

        [Required]
        public int Id_booking { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "varchar(20)")]
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(Id_booking))]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public virtual Booking? Booking { get; set; }
    }
}