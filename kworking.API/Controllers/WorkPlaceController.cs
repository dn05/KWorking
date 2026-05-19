using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkPlaceController : ControllerBase
{
    private readonly KworkingDbContext _db;
    private readonly ILogger<WorkPlaceController> _logger;

    public WorkPlaceController(KworkingDbContext db, ILogger<WorkPlaceController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<WorkPlace>>> GetAll()
    {
        var workPlaces = await _db.WorkPlaces.OrderBy(w => w.Id_workplace).ToListAsync();
        return Ok(workPlaces);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkPlace>> GetById(int id)
    {
        var workPlace = await _db.WorkPlaces.FindAsync(id);
        if (workPlace == null)
            return NotFound($"Рабочее место с ID {id} не найдено");
        return Ok(workPlace);
    }

    [HttpGet("free")]
    public async Task<ActionResult<List<WorkPlace>>> GetFree()
    {
        var free = await _db.WorkPlaces
            .Where(w => w.Status == WorkPlaceStatus.free)
            .OrderBy(w => w.Id_workplace)
            .ToListAsync();
        return Ok(free);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<ActionResult<WorkPlace>> Create([FromBody] WorkPlace workPlace)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _db.WorkPlaces.AnyAsync(w => w.Name == workPlace.Name))
            return Conflict($"Рабочее место с названием '{workPlace.Name}' уже существует");

        workPlace.Status = WorkPlaceStatus.free;

        await _db.WorkPlaces.AddAsync(workPlace);
        await _db.SaveChangesAsync();

        _logger.LogInformation($"Создано рабочее место ID:{workPlace.Id_workplace}");

        return CreatedAtAction(nameof(GetById), new { id = workPlace.Id_workplace }, workPlace);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> Update(int id, [FromBody] WorkPlace updatedWorkPlace)
    {
        if (id != updatedWorkPlace.Id_workplace)
            return BadRequest("ID в URL не совпадает с ID рабочего места");

        var workPlace = await _db.WorkPlaces.FindAsync(id);
        if (workPlace == null)
            return NotFound($"Рабочее место с ID {id} не найдено");

        if (await _db.WorkPlaces.AnyAsync(w => w.Name == updatedWorkPlace.Name && w.Id_workplace != id))
            return Conflict($"Рабочее место с названием '{updatedWorkPlace.Name}' уже существует");

        workPlace.Name = updatedWorkPlace.Name;
        workPlace.Description = updatedWorkPlace.Description;
        workPlace.Type = updatedWorkPlace.Type;
        workPlace.Capacity = updatedWorkPlace.Capacity;

        _db.WorkPlaces.Update(workPlace);
        await _db.SaveChangesAsync();

        _logger.LogInformation($"Обновлено рабочее место ID:{id}");
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var workPlace = await _db.WorkPlaces.FindAsync(id);
        if (workPlace == null)
            return NotFound($"Рабочее место с ID {id} не найдено");

        if (await _db.Bookings.AnyAsync(b => b.Id_workPlace == id && b.Status == BookingStatus.Active))
            return BadRequest("Нельзя удалить рабочее место с активными бронированиями");

        _db.WorkPlaces.Remove(workPlace);
        await _db.SaveChangesAsync();

        _logger.LogInformation($"Удалено рабочее место ID:{id}");
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromQuery] WorkPlaceStatus status)
    {
        var workPlace = await _db.WorkPlaces.FindAsync(id);
        if (workPlace == null)
            return NotFound($"Рабочее место с ID {id} не найдено");

        workPlace.Status = status;
        _db.WorkPlaces.Update(workPlace);
        await _db.SaveChangesAsync();

        _logger.LogInformation($"Статус рабочего места ID:{id} изменён на {status}");
        return NoContent();
    }
}