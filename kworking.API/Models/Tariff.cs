using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
    public class Tariff
    {
        [Key]
        public int Id_tariff { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string Info { get; set; } = string.Empty;

        // Длительность в часах — для почасовой аренды
        public int? DurationHours { get; set; }

        // Срок действия в днях — для абонемента
        public int? ValidDays { get; set; }
    }
}