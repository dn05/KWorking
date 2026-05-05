namespace kworking.API.Models
{
    public class Booking
    {
        public int Id_booking { get; set; }
        public int Id_client { get; set; }
        public int Id_workPlace { get; set; }
        public int Id_tariff { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public  bool Status { get; set; }
        public decimal LastPrice { get; set; }
    }
}
