using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using kworking.API.Data;
using kworking.API.Models;
using BCryptAlgo = BCrypt.Net.BCrypt;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(KworkingDbContext db, IConfiguration config, ILogger<AuthController> logger)
        : ControllerBase
    {
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await db.Users
                .Include(u => u.Client)
                .FirstOrDefaultAsync(u => u.Login == request.Login);

            if (user == null || !BCryptAlgo.Verify(request.Password, user.Password))
            {
                logger.LogWarning("Неудачная попытка входа для логина: {Login}", request.Login);
                return Unauthorized("Неверный логин или пароль");
            }

            logger.LogInformation("Пользователь {Login} вошёл в систему", user.Login);

            return Ok(new
            {
                user.Id_user,
                user.Login,
                Role      = user.Role.ToString(),
                user.Id_client,
                ClientName = user.Client != null ? $"{user.Client.Name} {user.Client.Surname}" : null,
                Token     = GenerateJwtToken(user)
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await db.Users.AnyAsync(u => u.Login == request.Login))
                return Conflict($"Логин '{request.Login}' уже занят");

            if (await db.Clients.AnyAsync(c => c.Email == request.Email))
                return Conflict($"Email '{request.Email}' уже зарегистрирован");

            if (await db.Clients.AnyAsync(c => c.Phone == request.Phone))
                return Conflict($"Телефон '{request.Phone}' уже зарегистрирован");

            var client = new Client
            {
                Name    = request.Name,
                Surname = request.Surname,
                Phone   = request.Phone,
                Email   = request.Email
            };
            await db.Clients.AddAsync(client);
            await db.SaveChangesAsync();

            var user = new User
            {
                Login     = request.Login,
                Password  = BCryptAlgo.HashPassword(request.Password, workFactor: 12),
                Role      = UserRole.Client,
                Id_client = client.Id
            };
            await db.Users.AddAsync(user);
            await db.SaveChangesAsync();

            logger.LogInformation("Зарегистрирован новый клиент: {Login}", user.Login);

            return CreatedAtAction(null, null, new
            {
                user.Id_user,
                user.Login,
                Role       = user.Role.ToString(),
                user.Id_client,
                ClientName = $"{client.Name} {client.Surname}",
                Token      = GenerateJwtToken(user)
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await db.Users.FirstOrDefaultAsync(u => u.Login == request.Login);
            if (user == null)
                return NotFound("Пользователь с таким логином не найден");

            user.Password = BCryptAlgo.HashPassword(request.NewPassword, workFactor: 12);
            await db.SaveChangesAsync();

            logger.LogInformation("Сброс пароля для пользователя {Login}", user.Login);
            return Ok("Пароль успешно изменён");
        }

        internal string GenerateJwtToken(User user)
        {
            var jwtKey = config["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT key not configured");

            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id_user.ToString()),
                new Claim(ClaimTypes.Name,           user.Login),
                new Claim(ClaimTypes.Role,           user.Role.ToString()),
                new Claim("id_client",               user.Id_client?.ToString() ?? "")
            };

            var token = new JwtSecurityToken(
                issuer:             config["Jwt:Issuer"],
                audience:           config["Jwt:Audience"],
                claims:             claims,
                expires:            DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

   

    public class LoginRequest
    {
        public string Login    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Login    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Name     { get; set; } = string.Empty;
        public string Surname  { get; set; } = string.Empty;
        public string Phone    { get; set; } = string.Empty;
        public string Email    { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Login       { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}