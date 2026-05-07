using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace kworking.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreat1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Id_Tariff",
                table: "Tariffs",
                newName: "Id_tariff");

            migrationBuilder.RenameColumn(
                name: "Id_Booking",
                table: "Payments",
                newName: "Id_booking");

            migrationBuilder.RenameColumn(
                name: "Id_pament",
                table: "Payments",
                newName: "Id_payment");

            migrationBuilder.AddColumn<int>(
                name: "ClientId",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Id_client",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationHours",
                table: "Tariffs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ValidDays",
                table: "Tariffs",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payments",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentDate",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Users_ClientId",
                table: "Users",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Id_client",
                table: "Bookings",
                column: "Id_client");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Id_tariff",
                table: "Bookings",
                column: "Id_tariff");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Id_workPlace",
                table: "Bookings",
                column: "Id_workPlace");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Clients_Id_client",
                table: "Bookings",
                column: "Id_client",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Tariffs_Id_tariff",
                table: "Bookings",
                column: "Id_tariff",
                principalTable: "Tariffs",
                principalColumn: "Id_tariff",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_WorkPlaces_Id_workPlace",
                table: "Bookings",
                column: "Id_workPlace",
                principalTable: "WorkPlaces",
                principalColumn: "Id_workplace",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Clients_ClientId",
                table: "Users",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Clients_Id_client",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Tariffs_Id_tariff",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_WorkPlaces_Id_workPlace",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Clients_ClientId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_ClientId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_Id_client",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_Id_tariff",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_Id_workPlace",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Id_client",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DurationHours",
                table: "Tariffs");

            migrationBuilder.DropColumn(
                name: "ValidDays",
                table: "Tariffs");

            migrationBuilder.DropColumn(
                name: "PaymentDate",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "Id_tariff",
                table: "Tariffs",
                newName: "Id_Tariff");

            migrationBuilder.RenameColumn(
                name: "Id_booking",
                table: "Payments",
                newName: "Id_Booking");

            migrationBuilder.RenameColumn(
                name: "Id_payment",
                table: "Payments",
                newName: "Id_pament");

            migrationBuilder.AlterColumn<bool>(
                name: "Status",
                table: "Payments",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");
        }
    }
}
