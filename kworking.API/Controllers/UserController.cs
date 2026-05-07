using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;

    public UserController (KworkingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<User>>> GetAll()
    {
        var users = await _dbContext.Users.ToListAsync();
        return Ok(users);
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetById(int id)
    {
        var user = await _dbContext.Users
            .Include(u => u.Client)
            .FirstOrDefaultAsync(u => u.Id_user == id);

        if (user == null)
            return NotFound($"Пользователь с ID {id} не найден");

        return Ok(user);
    }
    [HttpPost]
    public async Task<ActionResult<User>> Create([FromBody] User user)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existing = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Login == user.Login);

        if (existing != null)
            return Conflict($"Пользователь с логином '{user.Login}' уже существует");

        if (user.Id_client.HasValue)
        {
            var client = await _dbContext.Clients.FindAsync(user.Id_client.Value);
            if (client == null)
                return NotFound($"Клиент с ID {user.Id_client} не найден");
        }

        await _dbContext.Users.AddAsync(user);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id_user }, user);
    }
}