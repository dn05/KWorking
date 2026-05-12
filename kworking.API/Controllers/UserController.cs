using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;

    public UserController(KworkingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // GET /api/user — только администраторы видят всех пользователей
    [HttpGet]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<ActionResult<List<User>>> GetAll()
    {
        var users = await _dbContext.Users.ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
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
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<ActionResult<User>> Create([FromBody] User user)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);


        if (user.Role == UserRole.SuperAdmin)
            return Forbid();

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

        user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password, workFactor: 12);

        await _dbContext.Users.AddAsync(user);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id_user }, user);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> Update(int id, [FromBody] User updatedUser)
    {
        if (id != updatedUser.Id_user)
            return BadRequest("ID в URL не совпадает с ID пользователя");

        var user = await _dbContext.Users.FindAsync(id);
        if (user == null)
            return NotFound($"Пользователь с ID {id} не найден");

        var loginConflict = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Login == updatedUser.Login && u.Id_user != id);
        if (loginConflict != null)
            return Conflict($"Логин '{updatedUser.Login}' уже занят другим пользователем");

        user.Login = updatedUser.Login;
        user.Id_client = updatedUser.Id_client;

        if (!string.IsNullOrWhiteSpace(updatedUser.Password))
            user.Password = BCrypt.Net.BCrypt.HashPassword(updatedUser.Password, workFactor: 12);

        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user == null)
            return NotFound($"Пользователь с ID {id} не найден");


        if (user.Role == UserRole.SuperAdmin)
            return Forbid();

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id}/role")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<IActionResult> UpdateRole(int id, [FromQuery] UserRole role)
    {
        var currentRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        if ((role == UserRole.Administrator || role == UserRole.SuperAdmin)
            && currentRole != nameof(UserRole.SuperAdmin))
        {
            return Forbid();
        }

        var user = await _dbContext.Users.FindAsync(id);
        if (user == null)
            return NotFound($"Пользователь с ID {id} не найден");

        if (user.Role == UserRole.SuperAdmin && currentRole != nameof(UserRole.SuperAdmin))
            return Forbid();

        user.Role = role;
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("role/{role}")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public async Task<ActionResult<List<User>>> GetByRole(UserRole role)
    {
        var users = await _dbContext.Users
            .Include(u => u.Client)
            .Where(u => u.Role == role)
            .ToListAsync();

        return Ok(users);
    }
}