using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceController : ControllerBase
    {
        private readonly KworkingDbContext _db;
        private readonly ILogger<ServiceController> _logger;

        public ServiceController(KworkingDbContext db, ILogger<ServiceController> logger)
        {
            _db = db;
            _logger = logger;
        }

        private static object ToDto(Tariff t) => new
        {
            id_service        = t.Id_tariff,
            name              = t.Name,
            price             = t.Price,
            info              = t.Info,
            pricingType       = t.PricingType,
            availableQuantity = t.AvailableQuantity,
        };

        
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var services = await _db.Tariffs
                .Where(t => t.IsService)
                .OrderBy(t => t.Id_tariff)
                .ToListAsync();
            return Ok(services.Select(ToDto));
        }

      
        [HttpPost]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] ServiceRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tariff = new Tariff
            {
                Name              = req.Name,
                Price             = req.Price,
                Info              = req.Info ?? string.Empty,
                IsService         = true,
                PricingType       = req.PricingType,
                AvailableQuantity = req.AvailableQuantity,
            };

            await _db.Tariffs.AddAsync(tariff);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Создана услуга ID:{Id}", tariff.Id_tariff);
            return CreatedAtAction(nameof(GetAll), new { id = tariff.Id_tariff }, ToDto(tariff));
        }

        // PUT /api/service/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] ServiceRequest req)
        {
            var tariff = await _db.Tariffs.FirstOrDefaultAsync(t => t.Id_tariff == id && t.IsService);
            if (tariff == null) return NotFound($"Услуга с ID {id} не найдена");

            tariff.Name              = req.Name;
            tariff.Price             = req.Price;
            tariff.Info              = req.Info ?? string.Empty;
            tariff.PricingType       = req.PricingType;
            tariff.AvailableQuantity = req.AvailableQuantity;

            _db.Tariffs.Update(tariff);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Обновлена услуга ID:{Id}", id);
            return NoContent();
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            var tariff = await _db.Tariffs.FirstOrDefaultAsync(t => t.Id_tariff == id && t.IsService);
            if (tariff == null) return NotFound($"Услуга с ID {id} не найдена");

            _db.Tariffs.Remove(tariff);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Удалена услуга ID:{Id}", id);
            return NoContent();
        }
    }

    public class ServiceRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Info { get; set; }
        public string? PricingType { get; set; }
        public int? AvailableQuantity { get; set; }
    }
}
