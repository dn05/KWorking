using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly KworkingDbContext _db;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(KworkingDbContext db, ILogger<PaymentController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var totalCount = await _db.Payments.CountAsync();
            var payments = await _db.Payments
                .Include(p => p.Booking)
                .OrderBy(p => p.Id_payment)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(payments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetById(int id)
        {
            var payment = await _db.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.Id_payment == id);

            if (payment == null)
                return NotFound($"Платёж с ID {id} не найден");

            return Ok(payment);
        }

        [HttpPost]
        public async Task<ActionResult<Payment>> Create([FromBody] Payment payment)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var booking = await _db.Bookings.FindAsync(payment.Id_booking);
            if (booking == null)
                return NotFound($"Бронирование с ID {payment.Id_booking} не найдено");

            if (await _db.Payments.AnyAsync(p => p.Id_booking == payment.Id_booking && p.Status == PaymentStatus.Pending))
                return Conflict("Для этого бронирования уже есть неоплаченный платёж");

            payment.Price       = booking.LastPrice;
            payment.Status      = PaymentStatus.Pending;
            payment.PaymentDate = DateTime.UtcNow;

            await _db.Payments.AddAsync(payment);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Создан платёж ID:{Id} для бронирования {BookingId}", payment.Id_payment, payment.Id_booking);
            return CreatedAtAction(nameof(GetById), new { id = payment.Id_payment }, payment);
        }

        [HttpPatch("{id}/pay")]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<IActionResult> Pay(int id)
        {
            var payment = await _db.Payments.FindAsync(id);
            if (payment == null)
                return NotFound($"Платёж с ID {id} не найден");

            if (payment.Status != PaymentStatus.Pending)
                return BadRequest("Оплатить можно только платёж со статусом Pending");

            payment.Status      = PaymentStatus.Paid;
            payment.PaymentDate = DateTime.UtcNow;

            _db.Payments.Update(payment);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Оплачен платёж ID:{Id}", id);
            return NoContent();
        }

        [HttpPatch("{id}/cancel")]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<IActionResult> Cancel(int id)
        {
            var payment = await _db.Payments.FindAsync(id);
            if (payment == null)
                return NotFound($"Платёж с ID {id} не найден");

            if (payment.Status != PaymentStatus.Pending)
                return BadRequest("Отменить можно только платёж со статусом Pending");

            payment.Status = PaymentStatus.Cancelled;

            _db.Payments.Update(payment);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Отменён платёж ID:{Id}", id);
            return NoContent();
        }

        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<List<Payment>>> GetByBooking(int bookingId)
        {
            if (!await _db.Bookings.AnyAsync(b => b.Id_booking == bookingId))
                return NotFound($"Бронирование с ID {bookingId} не найдено");

            var payments = await _db.Payments
                .Where(p => p.Id_booking == bookingId)
                .OrderBy(p => p.Id_payment)
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet("debt")]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<ActionResult<List<Payment>>> GetDebts()
        {
            var debts = await _db.Payments
                .Include(p => p.Booking)
                .Where(p => p.Status == PaymentStatus.Pending)
                .OrderBy(p => p.PaymentDate)
                .ToListAsync();

            return Ok(debts);
        }

        [HttpGet("report")]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<IActionResult> GetReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate   = null)
        {
            var query = _db.Payments
                .Where(p => p.Status == PaymentStatus.Paid)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(p => p.PaymentDate >= startDate.Value.ToUniversalTime());

            if (endDate.HasValue)
                query = query.Where(p => p.PaymentDate <= endDate.Value.ToUniversalTime());

            var payments = await query.OrderBy(p => p.PaymentDate).ToListAsync();

            return Ok(new
            {
                TotalAmount = payments.Sum(p => p.Price),
                TotalCount  = payments.Count,
                StartDate   = startDate,
                EndDate     = endDate,
                Payments    = payments
            });
        }
        [HttpGet("stats")]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<IActionResult> GetStats([FromQuery] string period = "week")
        {
            var now = DateTime.UtcNow;
            DateTime startDate = period switch
            {
                "day"   => now.Date,
                "month" => now.AddMonths(-1),
                _       => now.AddDays(-7),
            };

            var payments = await _db.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= startDate)
                .OrderBy(p => p.PaymentDate)
                .ToListAsync();

            if (period == "day")
            {
                var byHour = payments
                    .GroupBy(p => p.PaymentDate.ToLocalTime().Hour)
                    .Select(g => new { Label = g.Key.ToString("D2") + ":00", Total = g.Sum(p => p.Price) })
                    .OrderBy(g => g.Label)
                    .ToList();
                return Ok(new { labels = byHour.Select(g => g.Label), data = byHour.Select(g => g.Total) });
            }
            else
            {
                var byDay = payments
                    .GroupBy(p => p.PaymentDate.Date)
                    .Select(g => new { Label = g.Key.ToString("dd.MM"), Total = g.Sum(p => p.Price) })
                    .OrderBy(g => g.Label)
                    .ToList();
                return Ok(new { labels = byDay.Select(g => g.Label), data = byDay.Select(g => g.Total) });
            }
        }
    }
}