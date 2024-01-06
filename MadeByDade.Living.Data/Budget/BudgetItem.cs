using System.ComponentModel.DataAnnotations;

namespace MadeByDade.Living.Data.Budget;

public sealed class BudgetItem
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;
}
