using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator,SuperAdmin")]
    public class UserController : ControllerBase
    {
        private readonly KworkingDbContext _db;
        private readonly ILogger<UserController> _logger;

        public UserController(KworkingDbContext db, ILogger<UserController> logger)
        {
            _db = db;
            _logger = logger;
        }

        private int GetCurrentUserId()
            => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/user
        // Пароль не возвращается — [JsonIgnore] на модели User
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _db.Users
                .Include(u => u.Client)
                .OrderBy(u => u.Id_user)
                .ToListAsync();

            return Ok(users.Select(u => new
            {
                u.Id_user,
                u.Login,
                Role      = u.Role.ToString(),
                u.Id_client,
                ClientName = u.Client != null ? $"{u.Client.Name} {u.Client.Surname}" : null
            }));
        }

        // GET /api/user/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _db.Users
                .Include(u => u.Client)
                .FirstOrDefaultAsync(u => u.Id_user == id);

            if (user == null)
                return NotFound($"Пользователь с ID {id} не найден");

            return Ok(new
            {
                user.Id_user,
                user.Login,
                Role       = user.Role.ToString(),
                user.Id_client,
                ClientName = user.Client != null ? $"{user.Client.Name} {user.Client.Surname}" : null
            });
        }

        // POST /api/user
        // Создаёт Employee / Cashier / Administrator.
        // SuperAdmin создаётся только прямым INSERT в БД.
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Role == UserRole.SuperAdmin)
                return Forbid();

            // Только SuperAdmin может создать Administrator
            if (request.Role == UserRole.Administrator)
            {
                var me = await _db.Users.FindAsync(GetCurrentUserId());
                if (me?.Role != UserRole.SuperAdmin)
                    return Forbid();
            }

            if (await _db.Users.AnyAsync(u => u.Login == request.Login))
                return Conflict($"Пользователь с логином '{request.Login}' уже существует");

            if (request.Id_client.HasValue && !await _db.Clients.AnyAsync(c => c.Id == request.Id_client.Value))
                return NotFound($"Клиент с ID {request.Id_client} не найден");

            var user = new User
            {
                Login     = request.Login,
                Password  = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
                Role      = request.Role,
                Id_client = request.Id_client
            };

            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Создан пользователь ID:{Id} с ролью {Role}", user.Id_user, user.Role);

            return CreatedAtAction(nameof(GetById), new { id = user.Id_user }, new
            {
                user.Id_user,
                user.Login,
                Role = user.Role.ToString(),
                user.Id_client
            });
        }

        // PUT /api/user/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != request.Id_user)
                return BadRequest("ID в URL не совпадает с ID пользователя");

            var user = await _db.Users.FindAsync(id);
            if (user == null)
                return NotFound($"Пользователь с ID {id} не найден");

            if (user.Role == UserRole.SuperAdmin)
                return Forbid();

            if (await _db.Users.AnyAsync(u => u.Login == request.Login && u.Id_user != id))
                return Conflict($"Логин '{request.Login}' уже занят другим пользователем");

            if (request.Id_client.HasValue && !await _db.Clients.AnyAsync(c => c.Id == request.Id_client.Value))
                return NotFound($"Клиент с ID {request.Id_client} не найден");

            user.Login     = request.Login;
            user.Id_client = request.Id_client;

            if (!string.IsNullOrWhiteSpace(request.Password))
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

            _db.Users.Update(user);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Обновлён пользователь ID:{Id}", id);
            return NoContent();
        }

        // DELETE /api/user/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null)
                return NotFound($"Пользователь с ID {id} не найден");

            if (user.Role == UserRole.SuperAdmin)
                return Forbid();

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Удалён пользователь ID:{Id}", id);
            return NoContent();
        }

        // PATCH /api/user/{id}/role
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromQuery] UserRole role)
        {
            var me = await _db.Users.FindAsync(GetCurrentUserId());
            if (me == null)
                return Unauthorized();

            if ((role == UserRole.Administrator || role == UserRole.SuperAdmin) && me.Role != UserRole.SuperAdmin)
                return Forbid();

            var user = await _db.Users.FindAsync(id);
            if (user == null)
                return NotFound($"Пользователь с ID {id} не найден");

            if (user.Role == UserRole.SuperAdmin && me.Role != UserRole.SuperAdmin)
                return Forbid();

            user.Role = role;
            _db.Users.Update(user);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Изменена роль пользователя ID:{Id} на {Role}", id, role);
            return NoContent();
        }

        // GET /api/user/role/{role}
        // Поддерживает все роли: Client, Employee, Cashier, Administrator, SuperAdmin
        [HttpGet("role/{role}")]
        public async Task<IActionResult> GetByRole(UserRole role)
        {
            var users = await _db.Users
                .Include(u => u.Client)
                .Where(u => u.Role == role)
                .OrderBy(u => u.Id_user)
                .ToListAsync();

            return Ok(users.Select(u => new
            {
                u.Id_user,
                u.Login,
                Role       = u.Role.ToString(),
                u.Id_client,
                ClientName = u.Client != null ? $"{u.Client.Name} {u.Client.Surname}" : null
            }));
        }
    }

    // ─── Request models ───────────────────────────────────────────────

    public class CreateUserRequest
    {
        public string   Login     { get; set; } = string.Empty;
        public string   Password  { get; set; } = string.Empty;
        public UserRole Role      { get; set; } = UserRole.Employee;
        public int?     Id_client { get; set; }
    }

    public class UpdateUserRequest
    {
        public int    Id_user   { get; set; }
        public string Login     { get; set; } = string.Empty;
        public string? Password { get; set; }
        public int?   Id_client { get; set; }
    }
}