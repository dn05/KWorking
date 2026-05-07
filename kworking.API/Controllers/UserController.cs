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
}