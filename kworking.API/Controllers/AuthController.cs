using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;

    public AuthController(KworkingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _dbContext.Users
            .Include(u => u.Client)
            .FirstOrDefaultAsync(u => u.Login == request.Login);

        if (user == null || user.Password != request.Password)
            return Unauthorized("Неверный логин или пароль");

        return Ok(new
        {
            user.Id_user,
            user.Login,
            user.Role,
            user.Id_client,
            ClientName = user.Client != null ? $"{user.Client.Name} {user.Client.Surname}" : null
        });
    }
}

public class LoginRequest
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}