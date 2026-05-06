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
    public async Task<ActionResult<List<User>>> GetAll()
    {
        var WorkPlaces = await _dbContext.WorkPlaces.ToListAsync();
        return Ok(WorkPlaces);
    }
        
}