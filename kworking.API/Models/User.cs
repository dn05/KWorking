using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace kworking.API.Models
{
    public enum UserRole
    {
        Client,    // клиент — видит только свои брони
        Admin,     // полный доступ
        Staff,     // сотрудник
        Cashier    // кассир
    }

    public class User
    {
        [Key]
        public int Id_user { get; set; }

        [Required]
        public string Login { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Column(TypeName = "varchar(20)")]
        public UserRole Role { get; set; } = UserRole.Client;

        public int? Id_client { get; set; }

        [ForeignKey(nameof(Id_client))]
        public virtual Client? Client { get; set; }
    }
}