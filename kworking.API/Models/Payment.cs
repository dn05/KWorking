namespace kworking.API.Models
{
    public class Payment
    {
        public int Id_pament { get; set; }
        public int Id_Booking { get; set; }
        public decimal Price { get; set; }
        public bool Status { get; set; }


    }
}
