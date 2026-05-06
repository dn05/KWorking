using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
    public enum WorkPlaceStatus
    {
        free,      // Свободно/Доступно
        busy,      // Занято
        booked     // Забронировано
    }

    // Модель рабочего места
    public class WorkPlace
    {
        [Key]
        public int Id_workplace { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
        
        public int Content { get; set; } = 0;  // DEFAULT 0
        
        [Required]
        [Column(TypeName = "varchar(20)")]
        public WorkPlaceStatus Status { get; set; } = WorkPlaceStatus.free;
    }
}