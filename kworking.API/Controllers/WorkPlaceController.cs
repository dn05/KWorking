using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkPlaceController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;

    public WorkPlaceController (KworkingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<WorkPlace>>> GetAll()
    {
        var WorkPlaces = await _dbContext.WorkPlaces.ToListAsync();
        return Ok(WorkPlaces);
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<WorkPlace>> GetById(int id)
    {
        var workPlace = await _dbContext.WorkPlaces.FindAsync(id);
        if (workPlace == null)
        {
            return NotFound($"Рабочее место с ID {id} не найдено");
        }
        return Ok(workPlace);
    }
    [HttpPost]
    public async Task<ActionResult<WorkPlace>> Create([FromBody] WorkPlace workPlace)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }


        var existing = await _dbContext.WorkPlaces
            .FirstOrDefaultAsync(w => w.Name == workPlace.Name);
        if (existing != null)
        {
            return Conflict($"Рабочее место с названием '{workPlace.Name}' уже существует");
        }

        workPlace.Status = WorkPlaceStatus.free;

        await _dbContext.WorkPlaces.AddAsync(workPlace);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = workPlace.Id_workplace }, workPlace);
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] WorkPlace updatedWorkPlace)
    {
        if (id != updatedWorkPlace.Id_workplace)
        {
            return BadRequest("ID в URL не совпадает с ID рабочего места");
        }

        var workPlace = await _dbContext.WorkPlaces.FindAsync(id);
        if (workPlace == null)
        {
            return NotFound($"Рабочее место с ID {id} не найдено");
        }

        workPlace.Name = updatedWorkPlace.Name;
        workPlace.Content = updatedWorkPlace.Content;

        _dbContext.WorkPlaces.Update(workPlace);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var workPlace = await _dbContext.WorkPlaces.FindAsync(id);
        if (workPlace == null)
        {
            return NotFound($"Рабочее место с ID {id} не найдено");
        }

  
        var hasActiveBookings = await _dbContext.Bookings
            .AnyAsync(b => b.Id_workPlace == id && b.Status == BookingStatus.Active);
        if (hasActiveBookings)
        {
            return BadRequest("Нельзя удалить рабочее место с активными бронированиями");
        }

        _dbContext.WorkPlaces.Remove(workPlace);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
    
    [HttpGet("free")]
    public async Task<ActionResult<List<WorkPlace>>> GetFree()
    {
        var workPlaces = await _dbContext.WorkPlaces
            .Where(w => w.Status == WorkPlaceStatus.free)
            .ToListAsync();

        return Ok(workPlaces);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromQuery] WorkPlaceStatus status)
    {
        var workPlace = await _dbContext.WorkPlaces.FindAsync(id);
        if (workPlace == null)
        {
            return NotFound($"Рабочее место с ID {id} не найдено");
        }

        workPlace.Status = status;

        _dbContext.WorkPlaces.Update(workPlace);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
}