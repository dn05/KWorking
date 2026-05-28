using Microsoft.EntityFrameworkCore;
using kworking.API.Models;
using kworking.API.Data;

namespace kworking.API.Data;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<KworkingDbContext>();

       

        if (!await context.WorkPlaces.AnyAsync())
        {
            context.WorkPlaces.AddRange(
                new WorkPlace { Id_workplace = 4, Name = "Комната A", Description = "отдельная комната", Status = WorkPlaceStatus.free, Capacity = 1, Type = "Room", PricePerHour = 600.00m, PhotoUrl = "/uploads/workplaces/b7d8a232-83e5-4cff-af73-263c75c92cde.webp" },
                new WorkPlace { Id_workplace = 5, Name = "Комната В", Description = "отдельная комната", Status = WorkPlaceStatus.free, Capacity = 1, Type = "Room", PricePerHour = 600.00m, PhotoUrl = "/uploads/workplaces/93cd4a0b-40e3-4eda-bf66-4a0449575036.jpeg" },
                new WorkPlace { Id_workplace = 6, Name = "Комната C", Description = "отдельная комната", Status = WorkPlaceStatus.free, Capacity = 1, Type = "Room", PricePerHour = 600.00m, PhotoUrl = "/uploads/workplaces/4ea78707-9039-435f-ba09-b020ffce36bd.png"},
                new WorkPlace { Id_workplace = 8, Name = "Открытое пространство", Description = "одно рабочее место", Status = WorkPlaceStatus.free, Capacity = 30, Type = "OpenSpace", PricePerHour = 400.00m, PhotoUrl = "/uploads/workplaces/d47f65c5-3e64-4517-b7c5-391ed2371b54.jpeg" },
                new WorkPlace { Id_workplace = 9, Name = "Переговорная", Description = "комната с круглым столом", Status = WorkPlaceStatus.free, Capacity = 10, Type = "MeetingRoom", PricePerHour = 700.00m, PhotoUrl = "/uploads/workplaces/674637b4-296b-4dc2-a86b-e9a5b2ead147.webp" }
                
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Clients.AnyAsync())
        {
            context.Clients.AddRange(
                new Client { Id = 1, Name = "Григорий", Surname = "Кокиев", Phone = "89763674878", Email = "A@gmail.com" },
                new Client { Id = 2, Name = "умар", Surname = "шабазов", Phone = "89766789876", Email = "m@gmail.com" },
                new Client { Id = 3, Name = "string", Surname = "string", Phone = "string", Email = "string" },
                new Client { Id = 4, Name = "Саня", Surname = "Люфи", Phone = "87654567645", Email = "S@gmail.com" },
                new Client { Id = 5, Name = "ярик", Surname = "киска", Phone = "89567896576", Email = "i@gmail.com" },
                new Client { Id = 6, Name = "xz", Surname = "xz", Phone = "+7 8949494949", Email = "xz@gmail.cpm" },
                new Client { Id = 9, Name = "sos", Surname = "sos", Phone = "+77575788756", Email = "v@gmail.com" },
                new Client { Id = 10, Name = "l", Surname = "l", Phone = "+76758756758", Email = "l@gmail.com" },
                new Client { Id = 11, Name = "с", Surname = "с", Phone = "+75555555555", Email = "c@gmail.com" },
                new Client { Id = 12, Name = "C", Surname = "C", Phone = "+78888888888", Email = "C@gmail.com" },
                new Client { Id = 13, Name = "iuyrwgiuahsg", Surname = "uaghiuahg", Phone = "+75425425252", Email = "asgdadsgag@gmail.com" }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Users.AnyAsync())
        {
            context.Users.AddRange(
                new User { Id_user = 1, Login = "zxcvbnm", Password = "$2a$12$HXkRLi1mMIVmidhYbKne9ekWMc4XD2/h2IyHq6XD6NkzJp67vYVGi", Role = UserRole.SuperAdmin, Id_client = 1 },
                new User { Id_user = 2, Login = "qwert", Password = "$2a$12$2q2TI59TJ.B1m4XjdeoXDuXJI8nS2uEjMqKZReA9TosjUENevE2iG", Role = UserRole.Employee, Id_client = 2 },
                new User { Id_user = 3, Login = "string", Password = "$2a$12$5LUbU3h6NM6RLGwR1Jl0ee2kYyiQtEpmHvkcotyUooA36qxqDiuAu", Role = UserRole.Employee, Id_client = 3 },
                new User { Id_user = 4, Login = "qwertyuiop", Password = "$2a$12$t9XqkZQqCzdmoVuKTJ7MqO4A5oqWuefQf7QhKlVW2gjb29.rpLsGa", Role = UserRole.Cashier, Id_client = 4 },
                new User { Id_user = 5, Login = "qazxsw", Password = "$2a$12$hjndzJtjtR9hG9yDzDR1IObhW.J3n3Srj98TkDPC87iP8b.aEifBq", Role = UserRole.Administrator, Id_client = 5 },
                new User { Id_user = 6, Login = "xz", Password = "$2a$12$uPQM.Uo5fQJWdB0HZ3VW0.CZ67VBY7a0hz2DEUcTRUO9Rjvti.LzK", Role = UserRole.Client, Id_client = 6 },
                new User { Id_user = 7, Login = "lol", Password = "$2a$12$fjnk6XbRgbWdtwgxMT5RweLVZKq8Te/lxSUbcqMvcdgIB1I2n2qkq", Role = UserRole.Cashier, Id_client = null },
                new User { Id_user = 9, Login = "sos", Password = "$2a$12$QXetTYhkGNCPkMGyo4REn.8ogYAO1m2ugGWRAnd6a8iVxq8dkjzRi", Role = UserRole.Client, Id_client = 9 },
                new User { Id_user = 10, Login = "l", Password = "$2a$12$rfcqMh32o60hfvyU8fIkaO5bSY7.KM/rWCDiO2FA2I/HQV/iYelsW", Role = UserRole.Client, Id_client = 10 },
                new User { Id_user = 11, Login = "с", Password = "$2a$12$320n/NBh2ryDRjYFedPYp.a.XA17UoeKX4Mdgi8cxxNbRd97/sRgu", Role = UserRole.Client, Id_client = 11 },
                new User { Id_user = 12, Login = "C", Password = "$2a$12$Jl3YSlw3deKIcKgJqiINkeRuyWYLCiu1jDYugbkKEGsbwnlyjMfca", Role = UserRole.Client, Id_client = 12 },
                new User { Id_user = 13, Login = "aiugoiaudh", Password = "$2a$12$ziBt2GO1Rst/7ah0BeBuq.gYovpK4Y9xGowOSe2amBIgOcGxhJRyq", Role = UserRole.Client, Id_client = 13 }
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Tariffs.AnyAsync())
        {
            context.Tariffs.AddRange(
                new Tariff { Id_tariff = 1, Name = "рабочее место", Price = 500.00m, Info = "рабочее место для одного человека", IsService = false, PricingType = "Hourly" },
                new Tariff { Id_tariff = 2, Name = "комната", Price = 700.00m, Info = "отдельная комната", IsService = false, PricingType = "Hourly" },
                new Tariff { Id_tariff = 3, Name = "переговорная", Price = 800.00m, Info = "пространство с вместимостью до 10 человек", IsService = false, PricingType = "Hourly" },
                new Tariff { Id_tariff = 4, Name = "компьютер", Price = 550.00m, Info = "рабочее место с компьютером", IsService = false, PricingType = "Hourly" },
                new Tariff { Id_tariff = 5, Name = "Печать", Price = 150.00m, Info = "", IsService = true, PricingType = "Flat" },
                new Tariff { Id_tariff = 6, Name = "Ноутбук", Price = 200.00m, Info = "", IsService = true, PricingType = "Flat" }
            );
            await context.SaveChangesAsync();
        }

        Console.WriteLine("SeedData: Все данные успешно загружены!");
    }
}