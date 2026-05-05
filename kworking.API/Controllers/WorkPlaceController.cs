using Microsoft.AspNetCore.Mvc;
using kworking.API.Models;
using kworking.API.Controllers;

namespace kworking.API.Controllers

{
    [ApiController]
    [Route("api/[controller]")]


    public class WorkPlaceController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<WorkPlace>> GetAll()
        {
            var workPlaces = new List<WorkPlace>()
            {
                new WorkPlace
                {
                    Id_workPlace = 1,
                    Type = "переговорная",
                    Stutus = true,
                    Price = 500
    }

            };
            return Ok(workPlaces);
        }

    }
}




