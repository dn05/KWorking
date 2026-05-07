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
        var bookings = await _dbContext.Bookings.ToListAsync();
        return Ok(bookings);
    }

    [HttpGet]
    public async Task<ActionResult<List<Booking>>> GetAl()
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
        
        var booking = await _dbContext.Bookings.FindAsync(id);
        if (booking == null)
        {
            return NotFound($"Бронирование с ID {id} не найдено");
        }
        return Ok(booking);
    }
}