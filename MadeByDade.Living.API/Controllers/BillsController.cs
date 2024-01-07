using MadeByDade.Living.Data;
using MadeByDade.Living.Data.Bills;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

namespace MadeByDade.Living.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[AuthorizeForScopes(ScopeKeySection = "AzureAd:Scopes")]
public class BillsController : ControllerBase
{
    private readonly LivingContext _context;

    public BillsController(LivingContext context) => _context = context;

    // GET: api/Bills
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Bill>>> GetBills() => await _context.Bills.ToListAsync();

    // GET: api/Bills/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Bill>> GetBill(int id)
    {
        Bill? bill = await _context.Bills.FindAsync(id);

        return bill == null ? (ActionResult<Bill>)NotFound() : (ActionResult<Bill>)bill;
    }

    // PUT: api/Bills/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutBill(int id, Bill bill)
    {
        if (id != bill.Id)
        {
            return BadRequest();
        }

        _context.Entry(bill).State = EntityState.Modified;


        try
        {
            _ = await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!BillExists(id))
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

    // POST: api/Bills
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Bill>> PostBill(Bill bill)
    {
        _ = _context.Bills.Add(bill);
        _ = await _context.SaveChangesAsync();

        return CreatedAtAction("GetBill", new { id = bill.Id }, bill);
    }

    // DELETE: api/Bills/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBill(int id)
    {
        Bill? bill = await _context.Bills.FindAsync(id);
        if (bill == null)
        {
            return NotFound();
        }

        _ = _context.Bills.Remove(bill);
        _ = await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool BillExists(int id) => _context.Bills.Any(e => e.Id == id);
}
