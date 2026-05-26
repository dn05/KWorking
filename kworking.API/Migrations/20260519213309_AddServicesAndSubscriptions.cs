using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace kworking.API.Migrations
{
    /// <inheritdoc />
    public partial class AddServicesAndSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PricePerHour",
                table: "WorkPlaces",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "AvailableQuantity",
                table: "Tariffs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsService",
                table: "Tariffs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PricingType",
                table: "Tariffs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id_booking",
                table: "Payments",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "Id_client",
                table: "Payments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSubscription",
                table: "Payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionEnd",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionStart",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id_tariff",
                table: "Bookings",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "ServicesJson",
                table: "Bookings",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Id_client",
                table: "Payments",
                column: "Id_client");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Clients_Id_client",
                table: "Payments",
                column: "Id_client",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Clients_Id_client",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_Id_client",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PricePerHour",
                table: "WorkPlaces");

            migrationBuilder.DropColumn(
                name: "AvailableQuantity",
                table: "Tariffs");

            migrationBuilder.DropColumn(
                name: "IsService",
                table: "Tariffs");

            migrationBuilder.DropColumn(
                name: "PricingType",
                table: "Tariffs");

            migrationBuilder.DropColumn(
                name: "Id_client",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "IsSubscription",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SubscriptionEnd",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SubscriptionStart",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ServicesJson",
                table: "Bookings");

            migrationBuilder.AlterColumn<int>(
                name: "Id_booking",
                table: "Payments",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id_tariff",
                table: "Bookings",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
