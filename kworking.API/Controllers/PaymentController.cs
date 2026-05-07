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
        [HttpPost]
        public async Task<ActionResult<Payment>> Create([FromBody] Payment payment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            
            var booking = await _dbContext.Bookings.FindAsync(payment.Id_booking);
            if (booking == null)
            {
                return NotFound($"Бронирование с ID {payment.Id_booking} не найдено");
            }

            
            var existingPayment = await _dbContext.Payments
                .FirstOrDefaultAsync(p =>
                    p.Id_booking == payment.Id_booking &&
                    p.Status == PaymentStatus.Pending);

            if (existingPayment != null)
            {
                return Conflict("Для этого бронирования уже есть неоплаченный платёж");
            }

            
            payment.Price = booking.LastPrice;
            payment.Status = PaymentStatus.Pending;
            payment.PaymentDate = DateTime.Now;

            await _dbContext.Payments.AddAsync(payment);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = payment.Id_payment }, payment);
        }
        
    }
}