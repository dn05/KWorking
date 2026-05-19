using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using kworking.API.Data;
using kworking.API.Models;

namespace kworking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TariffController : ControllerBase
    {
        private readonly KworkingDbContext _db;
        private readonly ILogger<TariffController> _logger;

        public TariffController(KworkingDbContext db, ILogger<TariffController> logger)
        {
            _db = db;
            _logger = logger;
        }

        // Тарифы читают все (в т.ч. неавторизованные — для отображения на сайте)
        [HttpGet]
        public async Task<ActionResult<List<Tariff>>> GetAll()
            => Ok(await _db.Tariffs.OrderBy(t => t.Id_tariff).ToListAsync());

        [HttpGet("{id}")]
        public async Task<ActionResult<Tariff>> GetById(int id)
        {
            var tariff = await _db.Tariffs.FindAsync(id);
            return tariff == null
                ? NotFound($"Тариф с ID {id} не найден")
                : Ok(tariff);
        }

        [HttpPost]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<ActionResult<Tariff>> Create([FromBody] Tariff tariff)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!tariff.DurationHours.HasValue && !tariff.ValidDays.HasValue)
                return BadRequest("Укажите либо длительность в часах, либо срок действия в днях");

            if (tariff.DurationHours.HasValue && tariff.ValidDays.HasValue)
                return BadRequest("Тариф не может быть одновременно почасовым и абонементом");

            if (await _db.Tariffs.AnyAsync(t => t.Name == tariff.Name))
                return Conflict($"Тариф с названием '{tariff.Name}' уже существует");

            await _db.Tariffs.AddAsync(tariff);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Создан тариф ID:{Id}", tariff.Id_tariff);
            return CreatedAtAction(nameof(GetById), new { id = tariff.Id_tariff }, tariff);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] Tariff updatedTariff)
        {
            if (id != updatedTariff.Id_tariff)
                return BadRequest("ID в URL не совпадает с ID тарифа");

            var tariff = await _db.Tariffs.FindAsync(id);
            if (tariff == null)
                return NotFound($"Тариф с ID {id} не найден");

            if (!updatedTariff.DurationHours.HasValue && !updatedTariff.ValidDays.HasValue)
                return BadRequest("Укажите либо длительность в часах, либо срок действия в днях");

            if (updatedTariff.DurationHours.HasValue && updatedTariff.ValidDays.HasValue)
                return BadRequest("Тариф не может быть одновременно почасовым и абонементом");

            if (await _db.Tariffs.AnyAsync(t => t.Name == updatedTariff.Name && t.Id_tariff != id))
                return Conflict($"Тариф с названием '{updatedTariff.Name}' уже существует");

            tariff.Name          = updatedTariff.Name;
            tariff.Price         = updatedTariff.Price;
            tariff.Info          = updatedTariff.Info;
            tariff.DurationHours = updatedTariff.DurationHours;
            tariff.ValidDays     = updatedTariff.ValidDays;

            _db.Tariffs.Update(tariff);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Обновлён тариф ID:{Id}", id);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,SuperAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            var tariff = await _db.Tariffs.FindAsync(id);
            if (tariff == null)
                return NotFound($"Тариф с ID {id} не найден");

            if (await _db.Bookings.AnyAsync(b => b.Id_tariff == id && b.Status == BookingStatus.Active))
                return BadRequest("Нельзя удалить тариф с активными бронированиями");

            _db.Tariffs.Remove(tariff);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Удалён тариф ID:{Id}", id);
            return NoContent();
        }
    }
}