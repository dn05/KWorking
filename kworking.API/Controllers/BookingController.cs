using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly KworkingDbContext _db;
        private readonly ILogger<BookingController> _logger;

        public BookingController(KworkingDbContext db, ILogger<BookingController> logger)
        {
            _db = db;
            _logger = logger;
        }

        private int GetCurrentUserId()
            => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string GetCurrentRole()
            => User.FindFirstValue(ClaimTypes.Role)!;

        private int? GetCurrentClientId()
        {
            var raw = User.FindFirstValue("id_client");
            return int.TryParse(raw, out var id) ? id : null;
        }

        private bool IsAdminOrAbove()
        {
            var role = GetCurrentRole();
            return role is nameof(UserRole.Administrator) or nameof(UserRole.SuperAdmin);
        }


        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 500) pageSize = 500;

            var role = GetCurrentRole();
            IQueryable<Booking> query;

            if (role == nameof(UserRole.Client))
            {
                var clientId = GetCurrentClientId();
                if (clientId == null) return Forbid();

                query = _db.Bookings
                    .Include(b => b.WorkPlace)
                    .Include(b => b.Tariff)
                    .Where(b => b.Id_client == clientId);
            }
            else
            {
                query = _db.Bookings
                    .Include(b => b.Client)
                    .Include(b => b.WorkPlace)
                    .Include(b => b.Tariff);
            }

            var totalCount = await query.CountAsync();
            var bookings = await query
                .OrderBy(b => b.Id_booking)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(bookings);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<Booking>> GetById(int id)
        {
            var booking = await _db.Bookings
                .Include(b => b.Client)
                .Include(b => b.WorkPlace)
                .Include(b => b.Tariff)
                .FirstOrDefaultAsync(b => b.Id_booking == id);

            if (booking == null)
                return NotFound($"Бронирование с ID {id} не найдено");

            if (GetCurrentRole() == nameof(UserRole.Client) && booking.Id_client != GetCurrentClientId())
                return Forbid();

            return Ok(booking);
        }


        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var startDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
            var endDate   = DateTime.SpecifyKind(request.EndDate,   DateTimeKind.Utc);

            if (startDate < DateTime.UtcNow)
                return BadRequest("Дата начала не может быть в прошлом");

            if (endDate <= startDate)
                return BadRequest("Дата окончания должна быть позже даты начала");

            int clientId;
            if (GetCurrentRole() == nameof(UserRole.Client))
            {
                var cid = GetCurrentClientId();
                if (cid == null) return Forbid();
                clientId = cid.Value;
            }
            else
            {
                if (request.Id_client == null)
                    return BadRequest("Для администратора поле Id_client обязательно");
                clientId = request.Id_client.Value;
            }

            if (!await _db.Clients.AnyAsync(c => c.Id == clientId))
                return NotFound($"Клиент с ID {clientId} не найден");

            var workPlace = await _db.WorkPlaces.FindAsync(request.Id_workPlace);
            if (workPlace == null)
                return NotFound($"Рабочее место с ID {request.Id_workPlace} не найдено");

            if (workPlace.Status == WorkPlaceStatus.busy)
                return BadRequest($"Рабочее место '{workPlace.Name}' сейчас занято");

            var isOpenSpace = workPlace.Type == "OpenSpace";
            if (isOpenSpace)
            {
                var capacity = workPlace.Capacity ?? 1;
                var concurrentCount = await _db.Bookings.CountAsync(b =>
                    b.Id_workPlace == request.Id_workPlace &&
                    (b.Status == BookingStatus.Active || b.Status == BookingStatus.PendingConfirmation) &&
                    b.StartDate < endDate &&
                    b.EndDate > startDate);
                if (concurrentCount >= capacity)
                    return Conflict($"Все места в '{workPlace.Name}' заняты на указанный период");
            }
            else
            {
                if (await _db.Bookings.AnyAsync(b =>
                    b.Id_workPlace == request.Id_workPlace &&
                    (b.Status == BookingStatus.Active || b.Status == BookingStatus.PendingConfirmation) &&
                    b.StartDate < endDate &&
                    b.EndDate > startDate))
                    return Conflict("На это рабочее место уже есть бронирование в указанный период");
            }


            var hasSub = await _db.Payments.AnyAsync(p =>
                p.IsSubscription &&
                p.Id_client == clientId &&
                p.Status == PaymentStatus.Paid &&
                p.SubscriptionEnd > DateTime.UtcNow);

            var hours = (decimal)(endDate - startDate).TotalHours;
            var placePrice = hasSub ? 0m : Math.Round(workPlace.PricePerHour * hours, 2);


            decimal servicesPrice = 0m;
            string? servicesJson  = null;

            if (request.Services != null && request.Services.Count > 0)
            {
                var svcIds  = request.Services.Select(s => s.Id_service).ToList();
                var svcList = await _db.Tariffs
                    .Where(t => t.IsService && svcIds.Contains(t.Id_tariff))
                    .ToListAsync();

                var lines = new List<object>();
                foreach (var svc in request.Services)
                {
                    var t = svcList.FirstOrDefault(x => x.Id_tariff == svc.Id_service);
                    if (t == null) continue;
                    var qty      = Math.Max(1, svc.Quantity);
                    var lineAmt  = t.PricingType == "Hourly"
                        ? Math.Round(t.Price * hours * qty, 2)
                        : Math.Round(t.Price * qty, 2);
                    servicesPrice += lineAmt;
                    lines.Add(new { id_service = t.Id_tariff, name = t.Name, quantity = qty, price = lineAmt });
                }
                servicesJson = JsonSerializer.Serialize(lines);
            }

            var booking = new Booking
            {
                Id_client    = clientId,
                Id_workPlace = request.Id_workPlace,
                Id_tariff    = null,
                StartDate    = startDate,
                EndDate      = endDate,
                LastPrice    = placePrice + servicesPrice,
                ServicesJson = servicesJson,
            };

            if (IsAdminOrAbove())
            {
                booking.Status   = BookingStatus.Active;
                workPlace.Status = WorkPlaceStatus.booked;
                _db.WorkPlaces.Update(workPlace);
            }
            else
            {
                booking.Status = BookingStatus.PendingConfirmation;
            }

            await _db.Bookings.AddAsync(booking);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Создано бронирование ID:{Id} для клиента {ClientId}", booking.Id_booking, clientId);
            return CreatedAtAction(nameof(GetById), new { id = booking.Id_booking }, booking);
        }


        [HttpPatch("{id}/confirm")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Confirm(int id)
        {
            var booking = await _db.Bookings
                .Include(b => b.WorkPlace)
                .FirstOrDefaultAsync(b => b.Id_booking == id);

            if (booking == null)
                return NotFound($"Бронирование с ID {id} не найдено");

            if (booking.Status != BookingStatus.PendingConfirmation)
                return BadRequest("Подтвердить можно только бронирование в статусе PendingConfirmation");

            var wp = booking.WorkPlace ?? await _db.WorkPlaces.FindAsync(booking.Id_workPlace);
            if (wp != null && wp.Type == "OpenSpace")
            {
                var cap = wp.Capacity ?? 1;
                var cnt = await _db.Bookings.CountAsync(b =>
                    b.Id_workPlace == booking.Id_workPlace &&
                    b.Status == BookingStatus.Active &&
                    b.Id_booking != id &&
                    b.StartDate < booking.EndDate &&
                    b.EndDate > booking.StartDate);
                if (cnt >= cap)
                    return Conflict($"Все места в '{wp.Name}' уже заняты на указанный период");
            }
            else
            {
                if (await _db.Bookings.AnyAsync(b =>
                    b.Id_workPlace == booking.Id_workPlace &&
                    b.Status == BookingStatus.Active &&
                    b.Id_booking != id &&
                    b.StartDate < booking.EndDate &&
                    b.EndDate > booking.StartDate))
                    return Conflict("На это рабочее место уже появилось активное бронирование в указанный период");
            }

            booking.Status = BookingStatus.Active;
            if (booking.WorkPlace != null)
            {
                booking.WorkPlace.Status = WorkPlaceStatus.booked;
                _db.WorkPlaces.Update(booking.WorkPlace);
            }

            _db.Bookings.Update(booking);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Подтверждено бронирование ID:{Id}", id);
            return NoContent();
        }


        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var booking = await _db.Bookings
                .Include(b => b.WorkPlace)
                .FirstOrDefaultAsync(b => b.Id_booking == id);

            if (booking == null)
                return NotFound($"Бронирование с ID {id} не найдено");

            if (GetCurrentRole() == nameof(UserRole.Client) && booking.Id_client != GetCurrentClientId())
                return Forbid();

            if (booking.Status != BookingStatus.Active && booking.Status != BookingStatus.PendingConfirmation)
                return BadRequest("Отменить можно только активное или ожидающее подтверждения бронирование");

            var wasActive = booking.Status == BookingStatus.Active;
            booking.Status = BookingStatus.Cancelled;

            if (booking.WorkPlace != null && wasActive)
            {
                booking.WorkPlace.Status = WorkPlaceStatus.free;
                _db.WorkPlaces.Update(booking.WorkPlace);
            }

            _db.Bookings.Update(booking);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Отменено бронирование ID:{Id}", id);
            return NoContent();
        }


        [HttpPatch("{id}/complete")]
        [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
        public async Task<IActionResult> Complete(int id)
        {
            var booking = await _db.Bookings
                .Include(b => b.WorkPlace)
                .FirstOrDefaultAsync(b => b.Id_booking == id);

            if (booking == null)
                return NotFound($"Бронирование с ID {id} не найдено");

            if (booking.Status != BookingStatus.Active)
                return BadRequest("Завершить можно только активное бронирование");

            booking.Status = BookingStatus.Completed;
            if (booking.WorkPlace != null)
            {
                booking.WorkPlace.Status = WorkPlaceStatus.free;
                _db.WorkPlaces.Update(booking.WorkPlace);
            }

            _db.Bookings.Update(booking);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Завершено бронирование ID:{Id}", id);
            return NoContent();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateBookingRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != request.Id_booking)
                return BadRequest("ID в URL не совпадает с ID бронирования");

            var booking = await _db.Bookings
                .Include(b => b.WorkPlace)
                .FirstOrDefaultAsync(b => b.Id_booking == id);

            if (booking == null)
                return NotFound($"Бронирование с ID {id} не найдено");

            if (booking.Status != BookingStatus.Active)
                return BadRequest("Редактировать можно только активное бронирование");

            var startDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
            var endDate   = DateTime.SpecifyKind(request.EndDate,   DateTimeKind.Utc);

            if (endDate <= startDate)
                return BadRequest("Дата окончания должна быть позже даты начала");

            if (await _db.Bookings.AnyAsync(b =>
                b.Id_workPlace == booking.Id_workPlace &&
                b.Status == BookingStatus.Active &&
                b.Id_booking != id &&
                b.StartDate < endDate &&
                b.EndDate > startDate))
                return Conflict("На это рабочее место уже есть активное бронирование в указанный период");

            var workPlace = booking.WorkPlace;
            if (workPlace == null)
            {
                workPlace = await _db.WorkPlaces.FindAsync(booking.Id_workPlace);
                if (workPlace == null) return NotFound("Рабочее место не найдено");
            }

            var hours     = (decimal)(endDate - startDate).TotalHours;
            var hasSub    = await _db.Payments.AnyAsync(p =>
                p.IsSubscription && p.Id_client == booking.Id_client &&
                p.Status == PaymentStatus.Paid && p.SubscriptionEnd > DateTime.UtcNow);
            var price     = hasSub ? 0m : Math.Round(workPlace.PricePerHour * hours, 2);

            booking.StartDate = startDate;
            booking.EndDate   = endDate;
            booking.LastPrice = price;

            _db.Bookings.Update(booking);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Обновлено бронирование ID:{Id}", id);
            return NoContent();
        }
        
        [HttpGet("pending")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<ActionResult<List<Booking>>> GetPending()
        {
            var bookings = await _db.Bookings
                .Include(b => b.Client)
                .Include(b => b.WorkPlace)
                .Include(b => b.Tariff)
                .Where(b => b.Status == BookingStatus.PendingConfirmation)
                .OrderBy(b => b.StartDate)
                .ToListAsync();
            return Ok(bookings);
        }


        [HttpGet("active")]
        [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
        public async Task<ActionResult<List<Booking>>> GetActive()
        {
            var bookings = await _db.Bookings
                .Include(b => b.Client)
                .Include(b => b.WorkPlace)
                .Include(b => b.Tariff)
                .Where(b => b.Status == BookingStatus.Active)
                .OrderBy(b => b.StartDate)
                .ToListAsync();
            return Ok(bookings);
        }


        [HttpGet("client/{clientId}")]
        public async Task<ActionResult<List<Booking>>> GetByClient(int clientId)
        {
            if (GetCurrentRole() == nameof(UserRole.Client) && GetCurrentClientId() != clientId)
                return Forbid();

            if (!await _db.Clients.AnyAsync(c => c.Id == clientId))
                return NotFound($"Клиент с ID {clientId} не найден");

            var bookings = await _db.Bookings
                .Include(b => b.WorkPlace)
                .Include(b => b.Tariff)
                .Where(b => b.Id_client == clientId)
                .OrderBy(b => b.StartDate)
                .ToListAsync();
            return Ok(bookings);
        }


        [HttpGet("workplace/{workplaceId}")]
        [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
        public async Task<ActionResult<List<Booking>>> GetByWorkPlace(int workplaceId)
        {
            if (!await _db.WorkPlaces.AnyAsync(w => w.Id_workplace == workplaceId))
                return NotFound($"Рабочее место с ID {workplaceId} не найдено");

            var bookings = await _db.Bookings
                .Include(b => b.Client)
                .Include(b => b.Tariff)
                .Where(b => b.Id_workPlace == workplaceId)
                .OrderBy(b => b.StartDate)
                .ToListAsync();
            return Ok(bookings);
        }


        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailability([FromQuery] int workplaceId)
        {
            var workPlace = await _db.WorkPlaces.FindAsync(workplaceId);
            if (workPlace == null)
                return NotFound($"Рабочее место с ID {workplaceId} не найдено");

            var bookings = await _db.Bookings
                .Where(b => b.Id_workPlace == workplaceId &&
                            (b.Status == BookingStatus.Active || b.Status == BookingStatus.PendingConfirmation))
                .Select(b => new { b.StartDate, b.EndDate })
                .ToListAsync();

            return Ok(new
            {
                type     = workPlace.Type,
                capacity = workPlace.Capacity ?? 1,
                bookings,
            });
        }


        [HttpGet("search")]
        [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
        public async Task<ActionResult<List<Booking>>> Search(
            [FromQuery] DateTime?      startDate = null,
            [FromQuery] DateTime?      endDate   = null,
            [FromQuery] BookingStatus? status    = null)
        {
            var query = _db.Bookings
                .Include(b => b.Client)
                .Include(b => b.WorkPlace)
                .Include(b => b.Tariff)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(b => b.StartDate >= startDate.Value.ToUniversalTime());
            if (endDate.HasValue)
                query = query.Where(b => b.EndDate <= endDate.Value.ToUniversalTime());
            if (status.HasValue)
                query = query.Where(b => b.Status == status.Value);

            return Ok(await query.OrderBy(b => b.StartDate).ToListAsync());
        }

    }



    public class BookingServiceItem
    {
        public int Id_service { get; set; }
        public int Quantity   { get; set; } = 1;
    }

    public class CreateBookingRequest
    {
        public int?     Id_client    { get; set; }
        public int      Id_workPlace { get; set; }
        public DateTime StartDate    { get; set; }
        public DateTime EndDate      { get; set; }
        public List<BookingServiceItem>? Services { get; set; }
    }

    public class UpdateBookingRequest
    {
        public int      Id_booking { get; set; }
        public DateTime StartDate  { get; set; }
        public DateTime EndDate    { get; set; }
    }
}