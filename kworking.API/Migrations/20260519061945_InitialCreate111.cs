using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace kworking.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate111 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                name: "FK_Users_Clients_Id_client",
                table: "Users");

            migrationBuilder.AddColumn<int>(
                name: "Capacity",
                table: "WorkPlaces",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "WorkPlaces",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Tariffs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Info",
                table: "Tariffs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Payments",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Surname",
                table: "Clients",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Phone",
                table: "Clients",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Clients",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Clients",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<decimal>(
                name: "LastPrice",
                table: "Bookings",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Id_booking",
                table: "Payments",
                column: "Id_booking");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Clients_Id_client",
                table: "Bookings",
                column: "Id_client",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Tariffs_Id_tariff",
                table: "Bookings",
                column: "Id_tariff",
                principalTable: "Tariffs",
                principalColumn: "Id_tariff",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_WorkPlaces_Id_workPlace",
                table: "Bookings",
                column: "Id_workPlace",
                principalTable: "WorkPlaces",
                principalColumn: "Id_workplace",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Bookings_Id_booking",
                table: "Payments",
                column: "Id_booking",
                principalTable: "Bookings",
                principalColumn: "Id_booking",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Clients_Id_client",
                table: "Users",
                column: "Id_client",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
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
                name: "FK_Payments_Bookings_Id_booking",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Clients_Id_client",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Payments_Id_booking",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Capacity",
                table: "WorkPlaces");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "WorkPlaces");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Tariffs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Info",
                table: "Tariffs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Payments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "Surname",
                table: "Clients",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Phone",
                table: "Clients",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Clients",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Clients",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<decimal>(
                name: "LastPrice",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

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
                name: "FK_Users_Clients_Id_client",
                table: "Users",
                column: "Id_client",
                principalTable: "Clients",
                principalColumn: "Id");
        }
    }
}
