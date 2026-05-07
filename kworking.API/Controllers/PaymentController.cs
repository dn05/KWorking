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
        [HttpPatch("{id}/pay")]
        public async Task<IActionResult> Pay(int id)
        {
            var payment = await _dbContext.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound($"Платёж с ID {id} не найден");
            }

            if (payment.Status != PaymentStatus.Pending)
            {
                return BadRequest("Оплатить можно только платёж со статусом Pending");
            }

            payment.Status = PaymentStatus.Paid;
            payment.PaymentDate = DateTime.Now;

            _dbContext.Payments.Update(payment);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        } 
        
        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<List<Payment>>> GetByBooking(int bookingId)
        {
            var booking = await _dbContext.Bookings.FindAsync(bookingId);
            if (booking == null)
            {
                return NotFound($"Бронирование с ID {bookingId} не найдено");
            }

            var payments = await _dbContext.Payments
                .Where(p => p.Id_booking == bookingId)
                .ToListAsync();

            return Ok(payments);
        }
        [HttpGet("debt")]
        public async Task<ActionResult<List<Payment>>> GetDebts()
        {
            var debts = await _dbContext.Payments
                .Where(p => p.Status == PaymentStatus.Pending)
                .ToListAsync();

            return Ok(debts);
        }
        [HttpGet("report")]
        public async Task<ActionResult> GetReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var query = _dbContext.Payments
                .Where(p => p.Status == PaymentStatus.Paid)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= endDate.Value);
            }

            var payments = await query.ToListAsync();

            var report = new
            {
                TotalAmount = payments.Sum(p => p.Price),
                TotalCount = payments.Count,
                StartDate = startDate,
                EndDate = endDate,
                Payments = payments
            };

            return Ok(report);
        }
    } 
}
    
    
