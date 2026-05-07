using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;

    public BookingController(KworkingDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Booking>>> GetAll()
    {
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
    {
        return NotFound($"Бронирование с ID {id} не найдено");
    }

    return Ok(booking);
}

[HttpPost]
public async Task<ActionResult<Booking>> Create([FromBody] Booking booking)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    
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

    booking.Status = BookingStatus.Active;

    
    workPlace.Status = WorkPlaceStatus.booked;
    _dbContext.WorkPlaces.Update(workPlace);

    await _dbContext.Bookings.AddAsync(booking);
    await _dbContext.SaveChangesAsync();

    return CreatedAtAction(nameof(GetById), new { id = booking.Id_booking }, booking);
    }
[HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var booking = await _dbContext.Bookings
                .Include(b => b.WorkPlace)
                .FirstOrDefaultAsync(b => b.Id_booking == id);

            if (booking == null)
            {
                return NotFound($"Бронирование с ID {id} не найдено");
            }

            if (booking.Status != BookingStatus.Active)
            {
                return BadRequest("Отменить можно только активное бронирование");
            }

            
            booking.Status = BookingStatus.Cancelled;

            
            if (booking.WorkPlace != null)
            {
                booking.WorkPlace.Status = WorkPlaceStatus.free;
                _dbContext.WorkPlaces.Update(booking.WorkPlace);
            }

            _dbContext.Bookings.Update(booking);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpPatch("{id}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var booking = await _dbContext.Bookings
                .Include(b => b.WorkPlace)
                .FirstOrDefaultAsync(b => b.Id_booking == id);

            if (booking == null)
            {
                return NotFound($"Бронирование с ID {id} не найдено");
            }

            if (booking.Status != BookingStatus.Active)
            {
                return BadRequest("Завершить можно только активное бронирование");
            }

            
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
        [HttpGet("active")]
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
            var client = await _dbContext.Clients.FindAsync(clientId);
            if (client == null)
            {
                return NotFound($"Клиент с ID {clientId} не найден");
            }

            var bookings = await _dbContext.Bookings
                .Include(b => b.WorkPlace)
                .Include(b => b.Tariff)
                .Where(b => b.Id_client == clientId)
                .ToListAsync();

            return Ok(bookings);
        }
}