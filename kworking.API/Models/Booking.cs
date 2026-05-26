using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace kworking.API.Models
{
    public enum BookingStatus
    {
        PendingConfirmation,
        Active,
        Completed,
        Cancelled
    }

    public class Booking
    {
        [Key]
        public int Id_booking { get; set; }

        [Required]
        public int Id_client { get; set; }

        [Required]
        public int Id_workPlace { get; set; }

        public int? Id_tariff { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Column(TypeName = "varchar(30)")]
        public BookingStatus Status { get; set; } = BookingStatus.PendingConfirmation;

        [Column(TypeName = "decimal(18,2)")]
        public decimal LastPrice { get; set; }

        [MaxLength(2000)]
        public string? ServicesJson { get; set; }

        [ForeignKey(nameof(Id_client))]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public virtual Client? Client { get; set; }

        [ForeignKey(nameof(Id_workPlace))]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public virtual WorkPlace? WorkPlace { get; set; }

        [ForeignKey(nameof(Id_tariff))]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public virtual Tariff? Tariff { get; set; }
    }
}