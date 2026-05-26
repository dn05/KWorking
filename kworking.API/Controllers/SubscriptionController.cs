using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly KworkingDbContext _db;

        public SubscriptionController(KworkingDbContext db) => _db = db;

        private int? GetClientId()
        {
            var raw = User.FindFirstValue("id_client");
            return int.TryParse(raw, out var id) ? id : null;
        }

        private string GetRole() => User.FindFirstValue(ClaimTypes.Role)!;

        private static string ComputeStatus(Payment p)
        {
            if (p.Status == PaymentStatus.Cancelled) return "Cancelled";
            if (p.Status == PaymentStatus.Pending)   return "Pending";
           
            if (p.SubscriptionEnd.HasValue && p.SubscriptionEnd.Value < DateTime.UtcNow)
                return "Expired";
            return "Active";
        }

        private static object ToDto(Payment p) => new
        {
            id_subscription  = p.Id_payment,
            id_client        = p.Id_client,
            client           = p.Client == null ? null : new { name = p.Client.Name, surname = p.Client.Surname },
            status           = ComputeStatus(p),
            startDate        = p.SubscriptionStart,
            endDate          = p.SubscriptionEnd,
            price            = p.Price,
        };

        [HttpGet]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<IActionResult> GetAll()
        {
            var list = await _db.Payments
                .Include(p => p.Client)
                .Where(p => p.IsSubscription)
                .OrderByDescending(p => p.Id_payment)
                .ToListAsync();

            return Ok(list.Select(ToDto));
        }

        
        [HttpGet("my")]
        public async Task<IActionResult> GetMine()
        {
            var clientId = GetClientId();
            if (clientId == null) return Forbid();

            var sub = await _db.Payments
                .Where(p => p.IsSubscription && p.Id_client == clientId &&
                            p.Status != PaymentStatus.Cancelled)
                .OrderByDescending(p => p.Id_payment)
                .FirstOrDefaultAsync();

            if (sub == null) return NotFound("Абонемент не найден");
            return Ok(ToDto(sub));
        }

      
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSubscriptionRequest req)
        {
            var clientId = GetClientId();
            if (clientId == null) return Forbid();

           
            var existing = await _db.Payments
                .Where(p => p.IsSubscription && p.Id_client == clientId &&
                            p.Status == PaymentStatus.Pending)
                .AnyAsync();

            if (existing)
                return Conflict("У вас уже есть заявка на абонемент, ожидающая активации");

            var activeExists = await _db.Payments
                .Where(p => p.IsSubscription && p.Id_client == clientId &&
                            p.Status == PaymentStatus.Paid &&
                            p.SubscriptionEnd > DateTime.UtcNow)
                .AnyAsync();

            if (activeExists)
                return Conflict("У вас уже есть активный абонемент");

            var payment = new Payment
            {
                Id_client      = clientId,
                IsSubscription = true,
                Price          = req.Price > 0 ? req.Price : 5000m,
                Status         = PaymentStatus.Pending,
                PaymentDate    = DateTime.UtcNow,
            };

            await _db.Payments.AddAsync(payment);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMine), ToDto(payment));
        }

        
        [HttpPatch("{id}/activate")]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<IActionResult> Activate(int id)
        {
            var sub = await _db.Payments.FindAsync(id);
            if (sub == null || !sub.IsSubscription)
                return NotFound("Абонемент не найден");

            if (sub.Status != PaymentStatus.Pending)
                return BadRequest("Активировать можно только ожидающий абонемент");

            sub.Status            = PaymentStatus.Paid;
            sub.SubscriptionStart = DateTime.UtcNow;
            sub.SubscriptionEnd   = DateTime.UtcNow.AddMonths(1);
            sub.PaymentDate       = DateTime.UtcNow;

            _db.Payments.Update(sub);
            await _db.SaveChangesAsync();

            return NoContent();
        }

       
        [HttpPatch("{id}/cancel")]
        [Authorize(Roles = "Administrator,SuperAdmin,Cashier")]
        public async Task<IActionResult> Cancel(int id)
        {
            var sub = await _db.Payments.FindAsync(id);
            if (sub == null || !sub.IsSubscription)
                return NotFound("Абонемент не найден");

            if (sub.Status == PaymentStatus.Cancelled)
                return BadRequest("Абонемент уже отменён");

            sub.Status = PaymentStatus.Cancelled;
            _db.Payments.Update(sub);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CreateSubscriptionRequest
    {
        public decimal Price { get; set; } = 5000m;
    }
}
