using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{

    public enum UserRole
    {
        Admin,      // Администратор
        Accountant,    // Администрация/Менеджер
        Client      
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
    }
}
