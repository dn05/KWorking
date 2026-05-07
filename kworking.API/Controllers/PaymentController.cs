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
        
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetById(int id)
        {
            var payment = await _dbContext.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound($"Платёж с ID {id} не найден");
            }
            return Ok(payment);
        }
    }
}