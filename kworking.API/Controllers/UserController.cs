using Microsoft.AspNetCore.Mvc;
using kworking.API.Models;
using kworking.API.Controllers;

namespace kworking.API.Controllers

{
    [ApiController]
    [Route("api/[controller]")]


    public class UserController : ControllerBase
    {
        [HttpGet]
        public ActionResult<List<User>> GetAll()
        {
            var users = new List<User>()
            {
                new User
                {
                    Id_user = 1,
                    Login = "qwerty",
                    Password = "ytrewq",
                    Role = "Admin"
    }

            };
            return Ok(users);
        }

    }
}




