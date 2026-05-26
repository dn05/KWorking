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


        public int? DurationHours { get; set; }
        
        public int? ValidDays { get; set; }


        public bool IsService { get; set; } = false;

        [MaxLength(20)]
        public string? PricingType { get; set; } 

        public int? AvailableQuantity { get; set; }
    }
}