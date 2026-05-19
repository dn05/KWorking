using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace kworking.API.Models;

public enum UserRole
{
    Client,
    Employee,
    Cashier,
    Administrator,
    SuperAdmin
}

public class User
{
    [Key]
    public int Id_user { get; set; }

    [Required]
    [MaxLength(100)]
    public string Login { get; set; } = string.Empty;

    [Required]
    [JsonIgnore]
    public string Password { get; set; } = string.Empty;

    [Column(TypeName = "varchar(30)")]
    public UserRole Role { get; set; } = UserRole.Client;

    public int? Id_client { get; set; }

    [ForeignKey(nameof(Id_client))]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public virtual Client? Client { get; set; }
}