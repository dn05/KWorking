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
        if (ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var existingClient = await _dbContext.Clients
            .FirstOrDefaultAsync(c =>c.Email == client.Email);
        if ( existingClient != null)
        {
            return Conflict($"Клиент с email {client.Email} уже существует");
        }
        await _dbContext.Clients.AddAsync(client);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] Client updatedClient)
    {
        if (id != updatedClient.Id)
        {
            return BadRequest( "ID в URL не совпадает с ID клиента");
            
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
}