using Microsoft.AspNetCore.Mvc;
using kworking.API.Controllers;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api / [controller]")]


    public class PaymentController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<Payment>> GetAll()
        {
            var payments = new List<Payment>()
            {
                new Payment
                {
                        Id_pament = 1,
                        Id_Booking = 1,
                        Price = 500,
                        Status = true,
    }

            };
            return Ok(payments);
        }

    }
}

