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

        await context.Database.MigrateAsync();

        if (!await context.WorkPlaces.AnyAsync())
        {
            context.WorkPlaces.AddRange(
                new WorkPlace 
                { 
                    Id_workplace = 4, 
                    Name = "Комната A", 
                    Description = "отдельная комната", 
                    Status = WorkPlaceStatus.free, 
                    Capacity = 1, 
                    Type = "Room", 
                    PricePerHour = 600.00m, 
                    PhotoUrl = "/uploads/workplaces/a528f82b-68ef-4a54-b880-7464833851f4.jpg" 
                },
                new WorkPlace 
                { 
                    Id_workplace = 5, 
                    Name = "Комната В", 
                    Description = "отдельная комната", 
                    Status = WorkPlaceStatus.free, 
                    Capacity = 1, 
                    Type = "Room", 
                    PricePerHour = 600.00m, 
                    PhotoUrl = "/uploads/workplaces/28575c7a-6bdd-43fc-947b-42e7c93d6ea0.jpeg" 
                },
                new WorkPlace 
                { 
                    Id_workplace = 6, 
                    Name = "Комната C", 
                    Description = "отдельная комната", 
                    Status = WorkPlaceStatus.free, 
                    Capacity = 1, 
                    Type = "Room", 
                    PricePerHour = 600.00m 
                },
                new WorkPlace 
                { 
                    Id_workplace = 8, 
                    Name = "Открытое пространство", 
                    Description = "одно рабочее место", 
                    Status = WorkPlaceStatus.free, 
                    Capacity = 30, 
                    Type = "OpenSpace", 
                    PricePerHour = 400.00m, 
                    PhotoUrl = "/uploads/workplaces/7600cc2b-9524-43aa-848e-85febc3f13e1.jpg" 
                },
                new WorkPlace 
                { 
                    Id_workplace = 9, 
                    Name = "Переговорная", 
                    Description = "комната с круглым столом с вместимостью до 10 человек", 
                    Status = WorkPlaceStatus.free, 
                    Capacity = 10, 
                    Type = "MeetingRoom", 
                    PricePerHour = 700.00m, 
                    PhotoUrl = "/uploads/workplaces/521a9400-61b8-48bf-b18d-b72a618b7ee6.jpg" 
                }
            );
            await context.SaveChangesAsync();
            Console.WriteLine("WorkPlaces добавлены");
        }

        if (!await context.Clients.AnyAsync())
        {
            context.Clients.AddRange(
                new Client { Id = 1, Name = "Григорий", Surname = "Кокиев", Phone = "89763674878", Email = "A@gmail.com" },
                new Client { Id = 2, Name = "умар", Surname = "шабазов", Phone = "89766789876", Email = "m@gmail.com" },
                new Client { Id = 4, Name = "Саня", Surname = "Люфи", Phone = "87654567645", Email = "S@gmail.com" },
                new Client { Id = 5, Name = "ярик", Surname = "киска", Phone = "89567896576", Email = "i@gmail.com" },
                new Client { Id = 6, Name = "xz", Surname = "xz", Phone = "+7 8949494949", Email = "xz@gmail.cpm" }
            );
            await context.SaveChangesAsync();
            Console.WriteLine("Clients добавлены");
        }
        
        if (!await context.Users.AnyAsync())
        {
            context.Users.AddRange(
                new User 
                { 
                    Id_user = 1, 
                    Login = "zxcvbnm", 
                    Password = "$2a$12$HXkRLi1mMIVmidhYbKne9ekWMc4XD2/h2IyHq6XD6NkzJp67vYVGi", 
                    Role = UserRole.SuperAdmin, 
                    Id_client = 1 
                },
                new User 
                { 
                    Id_user = 4, 
                    Login = "qwertyuiop", 
                    Password = "$2a$12$t9XqkZQqCzdmoVuKTJ7MqO4A5oqWuefQf7QhKlVW2gjb29.rpLsGa", 
                    Role = UserRole.Cashier, 
                    Id_client = 4 
                },
                new User 
                { 
                    Id_user = 6, 
                    Login = "xz", 
                    Password = "$2a$12$uPQM.Uo5fQJWdB0HZ3VW0.CZ67VBY7a0hz2DEUcTRUO9Rjvti.LzK", 
                    Role = UserRole.Client, 
                    Id_client = 6 
                }
            );
            await context.SaveChangesAsync();
            Console.WriteLine("Users добавлены");
        }

        Console.WriteLine("SeedData выполнен успешно!");
    }
}