using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] 
    public class ClientController : ControllerBase
    {
        private readonly KworkingDbContext _db;
        private readonly ILogger<ClientController> _logger;

        public ClientController(KworkingDbContext db, ILogger<ClientController> logger)
        {
            _db = db;
            _logger = logger;
        }


        [HttpGet]
        [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var totalCount = await _db.Clients.CountAsync();
            var clients = await _db.Clients
                .OrderBy(c => c.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(clients);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier,Client")]
        public async Task<ActionResult<Client>> GetById(int id)
        {
            var client = await _db.Clients.FindAsync(id);
            if (client == null)
                return NotFound($"Клиент с ID {id} не найден");

            return Ok(client);
        }


        [HttpPost]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<ActionResult<Client>> Create([FromBody] Client client)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _db.Clients.AnyAsync(c => c.Email == client.Email))
                return Conflict($"Клиент с email {client.Email} уже существует");

            if (await _db.Clients.AnyAsync(c => c.Phone == client.Phone))
                return Conflict($"Клиент с телефоном {client.Phone} уже существует");

            await _db.Clients.AddAsync(client);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Создан клиент ID:{Id}", client.Id);
            return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin,Client")]
        public async Task<IActionResult> Update(int id, [FromBody] Client updatedClient)
        {
            if (id != updatedClient.Id)
                return BadRequest("ID в URL не совпадает с ID клиента");

            var existing = await _db.Clients.FindAsync(id);
            if (existing == null)
                return NotFound($"Клиент с ID {id} не найден");

            if (await _db.Clients.AnyAsync(c => c.Email == updatedClient.Email && c.Id != id))
                return Conflict($"Email {updatedClient.Email} уже используется другим клиентом");

            if (await _db.Clients.AnyAsync(c => c.Phone == updatedClient.Phone && c.Id != id))
                return Conflict($"Телефон {updatedClient.Phone} уже используется другим клиентом");

            existing.Name    = updatedClient.Name;
            existing.Surname = updatedClient.Surname;
            existing.Email   = updatedClient.Email;
            existing.Phone   = updatedClient.Phone;

            _db.Clients.Update(existing);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Обновлён клиент ID:{Id}", id);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            var client = await _db.Clients.FindAsync(id);
            if (client == null)
                return NotFound($"Клиент с ID {id} не найден");

            if (await _db.Bookings.AnyAsync(b => b.Id_client == id && b.Status == BookingStatus.Active))
                return BadRequest("Нельзя удалить клиента с активными бронированиями");

            _db.Clients.Remove(client);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Удалён клиент ID:{Id}", id);
            return NoContent();
        }

        [HttpGet("search")]
        [Authorize(Roles = "Administrator,SuperAdmin,Employee,Cashier")]
        public async Task<ActionResult<List<Client>>> Search(
            [FromQuery] string? email = null,
            [FromQuery] string? phone = null,
            [FromQuery] string? name  = null)
        {
            var query = _db.Clients.AsQueryable();

            if (!string.IsNullOrWhiteSpace(phone))
                query = query.Where(c => c.Phone.Contains(phone));

            if (!string.IsNullOrWhiteSpace(email))
                query = query.Where(c => c.Email.Contains(email));

            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(c => c.Name.Contains(name) || c.Surname.Contains(name));

            return Ok(await query.OrderBy(c => c.Id).ToListAsync());
        }
    }
}