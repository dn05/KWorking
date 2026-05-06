using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
  
    public enum UserRole
    {
        Client,      // Клиенты (бронируют, смотрят тарифы)
        Admin,       // Администраторы (регистрация, бронирования)
        Employee,    // Сотрудники (обслуживание, контроль доступа)
        Cashier,     // Кассиры (учёт оплат, задолженности)
        Management   // Администрация (отчёты, загрузка, эффективность)
    }

    public class User
    {
        [Key]
        public int Id_user { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Login { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        [Column(TypeName = "varchar(20)")]
        public UserRole Role { get; set; } = UserRole.Client;
        

        public int? Id_client { get; set; }
        public Client? Client { get; set; }
    }
}