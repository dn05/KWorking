using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
 
namespace kworking.API.Models
{
    public enum UserRole
    {
        Client,        // Клиент — видит только свои записи
        Employee,      // Сотрудник
        Cashier,       // Кассир
        Administrator, // Администратор — подтверждает брони, выдаёт права
        SuperAdmin     // Суперадмин — назначается через БД вручную
    }
 
    public class User
    {
        [Key]
        public int Id_user { get; set; }
 
        [Required]
        [MaxLength(100)]
        public string Login { get; set; } = string.Empty;
 
        [Required]
        public string Password { get; set; } = string.Empty;
 
        [Column(TypeName = "varchar(30)")]
        public UserRole Role { get; set; } = UserRole.Client;
 
        // Ссылка на клиента (заполняется при регистрации клиентом)
        public int? Id_client { get; set; }
 
        [ForeignKey(nameof(Id_client))]
        public virtual Client? Client { get; set; }
    }
}