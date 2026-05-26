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

        public int? Id_booking { get; set; }

        public int? Id_client { get; set; }

        public bool IsSubscription { get; set; } = false;

        public DateTime? SubscriptionStart { get; set; }

        public DateTime? SubscriptionEnd { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "varchar(20)")]
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(Id_booking))]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public virtual Booking? Booking { get; set; }

        [ForeignKey(nameof(Id_client))]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public virtual Client? Client { get; set; }
    }
}