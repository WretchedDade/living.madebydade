using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadeByDade.Living.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedCreatedOnToBillPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BillPayment_Bills_BillId",
                table: "BillPayment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_BillPayment",
                table: "BillPayment");

            migrationBuilder.RenameTable(
                name: "BillPayment",
                newName: "BillPayments");

            migrationBuilder.RenameIndex(
                name: "IX_BillPayment_BillId",
                table: "BillPayments",
                newName: "IX_BillPayments_BillId");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedOn",
                table: "BillPayments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddPrimaryKey(
                name: "PK_BillPayments",
                table: "BillPayments",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BillPayments_Bills_BillId",
                table: "BillPayments",
                column: "BillId",
                principalTable: "Bills",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BillPayments_Bills_BillId",
                table: "BillPayments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_BillPayments",
                table: "BillPayments");

            migrationBuilder.DropColumn(
                name: "CreatedOn",
                table: "BillPayments");

            migrationBuilder.RenameTable(
                name: "BillPayments",
                newName: "BillPayment");

            migrationBuilder.RenameIndex(
                name: "IX_BillPayments_BillId",
                table: "BillPayment",
                newName: "IX_BillPayment_BillId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_BillPayment",
                table: "BillPayment",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BillPayment_Bills_BillId",
                table: "BillPayment",
                column: "BillId",
                principalTable: "Bills",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
