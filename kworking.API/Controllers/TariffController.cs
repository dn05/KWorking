using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TariffController : ControllerBase
    {
        private readonly KworkingDbContext _dbContext;

        public TariffController(KworkingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<ActionResult<List<Tariff>>> GetAll()
        {
            var tariffs = await _dbContext.Tariffs.ToListAsync();
            return Ok(tariffs);
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<Tariff>> GetById(int id)
        {
            var tariff = await _dbContext.Tariffs.FindAsync(id);
            if (tariff == null)
            {
                return NotFound($"Тариф с ID {id} не найден");
            }
            return Ok(tariff);
        }
        [HttpPost]
        public async Task<ActionResult<Tariff>> Create([FromBody] Tariff tariff)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!tariff.DurationHours.HasValue && !tariff.ValidDays.HasValue)
            {
                return BadRequest("Укажите либо длительность в часах, либо срок действия в днях");
            }

            if (tariff.DurationHours.HasValue && tariff.ValidDays.HasValue)
            {
                return BadRequest("Тариф не может быть одновременно почасовым и абонементом");
            }

            var existing = await _dbContext.Tariffs
                .FirstOrDefaultAsync(t => t.Name == tariff.Name);
            if (existing != null)
            {
                return Conflict($"Тариф с названием '{tariff.Name}' уже существует");
            }

            await _dbContext.Tariffs.AddAsync(tariff);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = tariff.Id_tariff }, tariff);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Tariff updatedTariff)
        {
            if (id != updatedTariff.Id_tariff)
            {
                return BadRequest("ID в URL не совпадает с ID тарифа");
            }

            var tariff = await _dbContext.Tariffs.FindAsync(id);
            if (tariff == null)
            {
                return NotFound($"Тариф с ID {id} не найден");
            }

            if (!updatedTariff.DurationHours.HasValue && !updatedTariff.ValidDays.HasValue)
            {
                return BadRequest("Укажите либо длительность в часах, либо срок действия в днях");
            }

            if (updatedTariff.DurationHours.HasValue && updatedTariff.ValidDays.HasValue)
            {
                return BadRequest("Тариф не может быть одновременно почасовым и абонементом");
            }

            tariff.Name = updatedTariff.Name;
            tariff.Price = updatedTariff.Price;
            tariff.Info = updatedTariff.Info;
            tariff.DurationHours = updatedTariff.DurationHours;
            tariff.ValidDays = updatedTariff.ValidDays;

            _dbContext.Tariffs.Update(tariff);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tariff = await _dbContext.Tariffs.FindAsync(id);
            if (tariff == null)
            {
                return NotFound($"Тариф с ID {id} не найден");
            }

            var hasActiveBookings = await _dbContext.Bookings
                .AnyAsync(b => b.Id_tariff == id && b.Status == BookingStatus.Active);

            if (hasActiveBookings)
            {
                return BadRequest("Нельзя удалить тариф с активными бронированиями");
            }

            _dbContext.Tariffs.Remove(tariff);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }
    }
}