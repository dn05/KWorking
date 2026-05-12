using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;

    public BookingController(KworkingDbContext dbContext)
    {
        _dbContext = dbContext;
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
        return role == nameof(UserRole.Administrator) || role == nameof(UserRole.SuperAdmin);
    }

    [HttpGet]
    public async Task<ActionResult<List<Booking>>> GetAll()
    {
        var role = GetCurrentRole();

        if (role == nameof(UserRole.Client))
        {
            var clientId = GetCurrentClientId();
            if (clientId == null) return Forbid();

            var myBookings = await _dbContext.Bookings
                .Include(b => b.WorkPlace)
                .Include(b => b.Tariff)
                .Where(b => b.Id_client == clientId)
                .ToListAsync();

            return Ok(myBookings);
        }

        var bookings = await _dbContext.Bookings
            .Include(b => b.Client)
            .Include(b => b.WorkPlace)
            .Include(b => b.Tariff)
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Booking>> GetById(int id)
    {
        var booking = await _dbContext.Bookings
            .Include(b => b.Client)
            .Include(b => b.WorkPlace)
            .Include(b => b.Tariff)
            .FirstOrDefaultAsync(b => b.Id_booking == id);

        if (booking == null)
            return NotFound($"Бронирование с ID {id} не найдено");


        if (GetCurrentRole() == nameof(UserRole.Client))
        {
            var clientId = GetCurrentClientId();
            if (booking.Id_client != clientId)
                return Forbid();
        }

        return Ok(booking);
    }


    [HttpPost]
    public async Task<ActionResult<Booking>> Create([FromBody] Booking booking)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var role = GetCurrentRole();


        if (role == nameof(UserRole.Client))
        {
            var clientId = GetCurrentClientId();
            if (clientId == null) return Forbid();
            booking.Id_client = clientId.Value;
        }

        var client = await _dbContext.Clients.FindAsync(booking.Id_client);
        if (client == null)
            return NotFound($"Клиент с ID {booking.Id_client} не найден");

        var workPlace = await _dbContext.WorkPlaces.FindAsync(booking.Id_workPlace);
        if (workPlace == null)
            return NotFound($"Рабочее место с ID {booking.Id_workPlace} не найдено");

        if (workPlace.Status == WorkPlaceStatus.busy)
            return BadRequest($"Рабочее место '{workPlace.Name}' сейчас занято");


        var hasConflict = await _dbContext.Bookings.AnyAsync(b =>
            b.Id_workPlace == booking.Id_workPlace &&
            b.Status == BookingStatus.Active &&
            b.StartDate < booking.EndDate &&
            b.EndDate > booking.StartDate);

        if (hasConflict)
            return Conflict("На это рабочее место уже есть активное бронирование в указанный период");

        var tariff = await _dbContext.Tariffs.FindAsync(booking.Id_tariff);
        if (tariff == null)
            return NotFound($"Тариф с ID {booking.Id_tariff} не найден");

        if (tariff.DurationHours.HasValue)
        {
            var hours = (decimal)(booking.EndDate - booking.StartDate).TotalHours;
            if (hours <= 0)
                return BadRequest("Дата окончания должна быть позже даты начала");
            booking.LastPrice = Math.Round(tariff.Price * hours, 2);
        }
        else if (tariff.ValidDays.HasValue)
        {
            booking.LastPrice = tariff.Price;
        }
        else
        {
            return BadRequest("Тариф некорректен: не указана ни длительность, ни срок действия");
        }


        if (IsAdminOrAbove())
        {
            booking.Status = BookingStatus.Active;
            workPlace.Status = WorkPlaceStatus.booked;
            _dbContext.WorkPlaces.Update(workPlace);
        }
        else
        {
            booking.Status = BookingStatus.PendingConfirmation;
            
        }

        await _dbContext.Bookings.AddAsync(booking);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = booking.Id_booking }, booking);
    }


    [HttpPatch("{id}/confirm")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> Confirm(int id)
    {
        var booking = await _dbContext.Bookings
            .Include(b => b.WorkPlace)
            .FirstOrDefaultAsync(b => b.Id_booking == id);

        if (booking == null)
            return NotFound($"Бронирование с ID {id} не найдено");

        if (booking.Status != BookingStatus.PendingConfirmation)
            return BadRequest("Подтвердить можно только бронирование в статусе PendingConfirmation");


        var hasConflict = await _dbContext.Bookings.AnyAsync(b =>
            b.Id_workPlace == booking.Id_workPlace &&
            b.Status == BookingStatus.Active &&
            b.Id_booking != id &&
            b.StartDate < booking.EndDate &&
            b.EndDate > booking.StartDate);

        if (hasConflict)
            return Conflict("На это рабочее место уже появилось активное бронирование в указанный период");

        booking.Status = BookingStatus.Active;

        if (booking.WorkPlace != null)
        {
            booking.WorkPlace.Status = WorkPlaceStatus.booked;
            _dbContext.WorkPlaces.Update(booking.WorkPlace);
        }

        _dbContext.Bookings.Update(booking);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
    
    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var booking = await _dbContext.Bookings
            .Include(b => b.WorkPlace)
            .FirstOrDefaultAsync(b => b.Id_booking == id);

        if (booking == null)
            return NotFound($"Бронирование с ID {id} не найдено");


        if (GetCurrentRole() == nameof(UserRole.Client))
        {
            var clientId = GetCurrentClientId();
            if (booking.Id_client != clientId)
                return Forbid();
        }

        if (booking.Status != BookingStatus.Active && booking.Status != BookingStatus.PendingConfirmation)
            return BadRequest("Отменить можно только активное или ожидающее подтверждения бронирование");

        booking.Status = BookingStatus.Cancelled;

        if (booking.WorkPlace != null && booking.Status == BookingStatus.Active)
        {
            booking.WorkPlace.Status = WorkPlaceStatus.free;
            _dbContext.WorkPlaces.Update(booking.WorkPlace);
        }

        _dbContext.Bookings.Update(booking);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }


    [HttpPatch("{id}/complete")]
    [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
    public async Task<IActionResult> Complete(int id)
    {
        var booking = await _dbContext.Bookings
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
            _dbContext.WorkPlaces.Update(booking.WorkPlace);
        }

        _dbContext.Bookings.Update(booking);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
    
    [HttpGet("pending")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<ActionResult<List<Booking>>> GetPending()
    {
        var bookings = await _dbContext.Bookings
            .Include(b => b.Client)
            .Include(b => b.WorkPlace)
            .Include(b => b.Tariff)
            .Where(b => b.Status == BookingStatus.PendingConfirmation)
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("active")]
    [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
    public async Task<ActionResult<List<Booking>>> GetActive()
    {
        var bookings = await _dbContext.Bookings
            .Include(b => b.Client)
            .Include(b => b.WorkPlace)
            .Include(b => b.Tariff)
            .Where(b => b.Status == BookingStatus.Active)
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<List<Booking>>> GetByClient(int clientId)
    {

        if (GetCurrentRole() == nameof(UserRole.Client))
        {
            var myClientId = GetCurrentClientId();
            if (myClientId != clientId)
                return Forbid();
        }

        var client = await _dbContext.Clients.FindAsync(clientId);
        if (client == null)
            return NotFound($"Клиент с ID {clientId} не найден");

        var bookings = await _dbContext.Bookings
            .Include(b => b.WorkPlace)
            .Include(b => b.Tariff)
            .Where(b => b.Id_client == clientId)
            .ToListAsync();

        return Ok(bookings);
    }


    [HttpGet("workplace/{workplaceId}")]
    [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
    public async Task<ActionResult<List<Booking>>> GetByWorkPlace(int workplaceId)
    {
        var workPlace = await _dbContext.WorkPlaces.FindAsync(workplaceId);
        if (workPlace == null)
            return NotFound($"Рабочее место с ID {workplaceId} не найдено");

        var bookings = await _dbContext.Bookings
            .Include(b => b.Client)
            .Include(b => b.Tariff)
            .Where(b => b.Id_workPlace == workplaceId)
            .ToListAsync();

        return Ok(bookings);
    }


    [HttpGet("search")]
    [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
    public async Task<ActionResult<List<Booking>>> Search(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] BookingStatus? status = null)
    {
        var query = _dbContext.Bookings
            .Include(b => b.Client)
            .Include(b => b.WorkPlace)
            .Include(b => b.Tariff)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(b => b.StartDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(b => b.EndDate <= endDate.Value);

        if (status.HasValue)
            query = query.Where(b => b.Status == status.Value);

        return Ok(await query.ToListAsync());
    }

    
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> Update(int id, [FromBody] Booking updatedBooking)
    {
        if (id != updatedBooking.Id_booking)
            return BadRequest("ID в URL не совпадает с ID бронирования");

        var booking = await _dbContext.Bookings
            .Include(b => b.WorkPlace)
            .FirstOrDefaultAsync(b => b.Id_booking == id);

        if (booking == null)
            return NotFound($"Бронирование с ID {id} не найдено");

        if (booking.Status != BookingStatus.Active)
            return BadRequest("Редактировать можно только активное бронирование");

        var hasConflict = await _dbContext.Bookings.AnyAsync(b =>
            b.Id_workPlace == booking.Id_workPlace &&
            b.Status == BookingStatus.Active &&
            b.Id_booking != id &&
            b.StartDate < updatedBooking.EndDate &&
            b.EndDate > updatedBooking.StartDate);

        if (hasConflict)
            return Conflict("На это рабочее место уже есть активное бронирование в указанный период");

        var tariff = await _dbContext.Tariffs.FindAsync(booking.Id_tariff);
        if (tariff != null && tariff.DurationHours.HasValue)
        {
            var hours = (decimal)(updatedBooking.EndDate - updatedBooking.StartDate).TotalHours;
            if (hours <= 0)
                return BadRequest("Дата окончания должна быть позже даты начала");
            booking.LastPrice = Math.Round(tariff.Price * hours, 2);
        }

        booking.StartDate = updatedBooking.StartDate;
        booking.EndDate = updatedBooking.EndDate;

        _dbContext.Bookings.Update(booking);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
}