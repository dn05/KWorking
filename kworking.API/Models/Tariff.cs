using System.ComponentModel.DataAnnotations;

public class Tariff
{
    [Key]
    public int Id_tariff { get; set; }
    
    public string Name { get; set; } = string.Empty;
    
    public decimal Price { get; set; }
    
    public string Info { get; set; } = string.Empty;
    
    
    public int? DurationHours { get; set; }  // Длительность в часах (если почасовая аренда)
    
    public int? ValidDays { get; set; }      // Срок действия в днях (если абонемент)
}