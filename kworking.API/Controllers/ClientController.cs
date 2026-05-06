using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;

    public ClientController(KworkingDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Client>>> GetAll()
    {
        var clients  = await _dbContext.Clients.ToListAsync();
        return Ok(clients);
    }
}