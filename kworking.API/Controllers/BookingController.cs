using Microsoft.AspNetCore.Mvc;
using kworking.API.Models;
using kworking.API.Controllers;

namespace kworking.API.Controllers 

{
    [ApiController]
    [Route("api/[controller]")]


    public class BookingController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<Booking>> GetAll()
        {
            var bookings = new List<Booking>() 
            {
                new Booking
                {
                     Id_booking = 1002,
                    Id_client = 25,
                    Id_workPlace = 8,
                    Id_tariff = 2,
                    StartDate = new DateTime(2025, 5, 11, 10, 0, 0),
                    EndDate = new DateTime(2025, 5, 11, 15, 0, 0),
                    Status = true,
                    LastPrice = 500
                }

            };
                    return Ok(bookings);
        }

    }
}




