using System.ComponentModel.DataAnnotations;

namespace MadeByDade.Living.Data.Bills;

public class Bill
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public int DayDue { get; set; }

    public bool IsAutoPay { get; set; } = false;

    [Required]
    public BillDueType DueType { get; set; }
}

public enum BillDueType
{
    Fixed, EndOfMonth
}
