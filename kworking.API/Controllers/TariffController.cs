using Microsoft.AspNetCore.Mvc;
using kworking.API.Controllers;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]


    public class TariffController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<Tariff>> GetAll()
        {
            var tarifs = new List<Tariff>()
            {
                new Tariff
                {
                    Id_Tariff =1,
                    Name = "стандарт",
                    Price = 500,
                    Info = "базовый тариф",
    }

            };
            return Ok(tarifs);
        }

    }
}

