using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly KworkingDbContext _dbContext;

        public PaymentController(KworkingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<ActionResult<List<Payment>>> GetAll()
        {
            var payments = await _dbContext.Payments.ToListAsync();
            return Ok(payments);
        }
    }
}