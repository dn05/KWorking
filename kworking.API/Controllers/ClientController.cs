using kworking.API.Controllers;
using kworking.API.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net.Sockets;

namespace kworking.API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]

    public class ClientController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<Client>> GetAll()
        {
            var clients = new List<Client>()
            {
                new Client
                {
                     Id_client = 1,
                        Name = "Виктор",
                     Surname = "Иванов",
                      Phone = "89632916798",
                     Email = "qwerty@gmail.com",
                }
            };
        
            return Ok(clients);        
        }
      

    }
}
            
   
            
        
    

