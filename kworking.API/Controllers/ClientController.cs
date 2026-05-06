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
        var clients = await _dbContext.Clients.ToListAsync();
        return Ok(clients);
    }

    
    [HttpGet("{id}")]
    public async Task<ActionResult<Client>> GetById(int id)
    {
        var client = await _dbContext.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound($"Клиент с ID {id} не найден");
        }
        return Ok(client);
    }

    
    [HttpPost]
    public async Task<ActionResult<Client>> Create([FromBody] Client client)
    {
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        var existingClient = await _dbContext.Clients
            .FirstOrDefaultAsync(c => c.Email == client.Email);
        
        if (existingClient != null)
        {
            return Conflict($"Клиент с email {client.Email} уже существует");
        }
        
        await _dbContext.Clients.AddAsync(client);
        await _dbContext.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
    }

    
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Client updatedClient)
    {
        if (id != updatedClient.Id)
        {
            return BadRequest("ID в URL не совпадает с ID клиента");
        }

        var existingClient = await _dbContext.Clients.FindAsync(id);
        if (existingClient == null)
        {
            return NotFound($"Клиент с ID {id} не найден");
        }

        existingClient.Name = updatedClient.Name;
        existingClient.Surname = updatedClient.Surname;
        existingClient.Email = updatedClient.Email;
        existingClient.Phone = updatedClient.Phone;

        _dbContext.Clients.Update(existingClient);
        await _dbContext.SaveChangesAsync();
        
        return NoContent();
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var client = await _dbContext.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound($"Клиент с ID {id} не найден");
        }

        var hasActiveBookings = await _dbContext.Bookings
            .AnyAsync(b => b.Id_client == id && b.Status == BookingStatus.Active);
        
        if (hasActiveBookings)
        {
            return BadRequest("Нельзя удалить клиента с активными бронированиями");
        }
        
        _dbContext.Clients.Remove(client);
        await _dbContext.SaveChangesAsync();
        
        return NoContent();
    }
    
    [HttpGet("search")]
    public async Task<ActionResult<List<Client>>> Search(
        [FromQuery] string? email = null,
        [FromQuery] string? phone = null,
        [FromQuery] string? name = null)
    {
        var query = _dbContext.Clients.AsQueryable();
        
        if (!string.IsNullOrEmpty(phone))
        {
        
            query = query.Where(c => c.Phone.Contains(phone));
        }

        if (!string.IsNullOrEmpty(email))
        {
            query = query.Where(c => c.Email.Contains(email));
        }

        if (!string.IsNullOrEmpty(name))
        {
            query = query.Where(c => c.Name.Contains(name) || c.Surname.Contains(name));
        }
        
        var clients = await query.ToListAsync();
        return Ok(clients);
    }
}