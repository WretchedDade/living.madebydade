using MadeByDade.Living.Data;
using MadeByDade.Living.Data.Budget;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MadeByDade.Living.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BudgetItemsController(LivingContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BudgetItem>>> GetBudgetItems() => await context.BudgetItems.ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<BudgetItem>> GetBudgetItem(int id)
    {
        BudgetItem? budgetItem = await context.BudgetItems.FindAsync(id);

        return budgetItem == null ? (ActionResult<BudgetItem>)NotFound() : (ActionResult<BudgetItem>)budgetItem;
    }

    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutBudgetItem(int id, BudgetItem budgetItem)
    {
        if (id != budgetItem.Id)
            return BadRequest();

        context.Entry(budgetItem).State = EntityState.Modified;

        try
        {
            _ = await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!BudgetItemExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<BudgetItem>> PostBudgetItem(BudgetItem budgetItem)
    {
        _ = context.BudgetItems.Add(budgetItem);
        _ = await context.SaveChangesAsync();

        return CreatedAtAction("GetBudgetItem", new { id = budgetItem.Id }, budgetItem);
    }

    // DELETE: api/BudgetItems/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBudgetItem(int id)
    {
        BudgetItem? budgetItem = await context.BudgetItems.FindAsync(id);
        if (budgetItem == null)
            return NotFound();

        _ = context.BudgetItems.Remove(budgetItem);
        _ = await context.SaveChangesAsync();

        return NoContent();
    }

    private bool BudgetItemExists(int id) => context.BudgetItems.Any(e => e.Id == id);
}
