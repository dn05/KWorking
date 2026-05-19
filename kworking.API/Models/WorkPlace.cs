using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
    public enum WorkPlaceStatus
    {
        free,
        busy,
        booked
    }

    public class WorkPlace
    {
        [Key]
        public int Id_workplace { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        // 🆕 Добавляем поля для фронтенда
        [MaxLength(100)]
        public string? Type { get; set; } = "Рабочее место";

        public int? Capacity { get; set; } = 1;

        [Required]
        [Column(TypeName = "varchar(20)")]
        public WorkPlaceStatus Status { get; set; } = WorkPlaceStatus.free;
    }
}