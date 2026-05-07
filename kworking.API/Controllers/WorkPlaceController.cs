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
}