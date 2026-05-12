using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using kworking.API.Data;
using kworking.API.Models;
using BCryptAlgo = BCrypt.Net.BCrypt;

namespace kworking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly KworkingDbContext _dbContext;
    private readonly IConfiguration _config;

    public AuthController(KworkingDbContext dbContext, IConfiguration config)
    {
        _dbContext = dbContext;
        _config = config;
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _dbContext.Users
            .Include(u => u.Client)
            .FirstOrDefaultAsync(u => u.Login == request.Login);

        if (user == null || !BCryptAlgo.Verify(request.Password, user.Password))
            return Unauthorized("Неверный логин или пароль");

        var token = GenerateJwtToken(user);

        return Ok(new
        {
            user.Id_user,
            user.Login,
            user.Role,
            user.Id_client,
            ClientName = user.Client != null ? $"{user.Client.Name} {user.Client.Surname}" : null,
            Token = token
        });
    }


    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);


        var existingUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Login == request.Login);
        if (existingUser != null)
            return Conflict($"Логин '{request.Login}' уже занят");


        var existingClient = await _dbContext.Clients
            .FirstOrDefaultAsync(c => c.Email == request.Email);
        if (existingClient != null)
            return Conflict($"Email '{request.Email}' уже зарегистрирован");

    
        var client = new Client
        {
            Name = request.Name,
            Surname = request.Surname,
            Phone = request.Phone,
            Email = request.Email
        };
        await _dbContext.Clients.AddAsync(client);
        await _dbContext.SaveChangesAsync();

        var user = new User
        {
            Login = request.Login,
            Password = BCryptAlgo.HashPassword(request.Password, workFactor: 12),
            Role = UserRole.Client,
            Id_client = client.Id
        };
        await _dbContext.Users.AddAsync(user);
        await _dbContext.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return CreatedAtAction(null, null, new
        {
            user.Id_user,
            user.Login,
            user.Role,
            user.Id_client,
            ClientName = $"{client.Name} {client.Surname}",
            Token = token
        });
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id_user.ToString()),
            new Claim(ClaimTypes.Name, user.Login),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("id_client", user.Id_client?.ToString() ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string HashPassword(string plainPassword)
        => BCryptAlgo.HashPassword(plainPassword, workFactor: 12);
}

public class LoginRequest
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}