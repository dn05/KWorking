using System.ComponentModel.DataAnnotations;

namespace kworking.API.Models
{
    public class Tariff
    { [Key]
       public int Id_Tariff { get; set; }
       public string Name { get; set; } 
       public decimal Price { get; set; }
       public string Info { get; set; }
    
    }
}
