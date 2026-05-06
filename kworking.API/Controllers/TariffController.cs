using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TariffController : ControllerBase
    {
        private readonly KworkingDbContext _dbContext;

        public TariffController(KworkingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<ActionResult<List<Tariff>>> GetAll()
        {
            var tariffs = await _dbContext.Tariffs.ToListAsync();
            return Ok(tariffs);
        }
    }
}