using MadeByDade.Living.API.Models;
using MadeByDade.Living.Data;
using MadeByDade.Living.Data.Bills;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MadeByDade.Living.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BillPaymentsController(LivingContext context) : ControllerBase
{

    [HttpGet]
    public async Task<IActionResult> GetBillPayments(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] bool unpaidOnly = true,
        [FromQuery] int? billId = null
    )
    {
        IQueryable<BillPayment> query = context.BillPayments
            .Include(payment => payment.Bill)
            .OrderByDescending(payment => payment.DateDue)
            .AsQueryable();

        if (billId.HasValue)
            query = query.Where(payment => payment.BillId == billId.Value);

        if (unpaidOnly)
            query = query.Where(payment => !payment.DatePaid.HasValue);

        if(page.HasValue && pageSize.HasValue)
        {
            var totalCount = await query.CountAsync();

            query = query.Skip(page.Value * pageSize.Value).Take(pageSize.Value);

            return Ok(new Page<BillPayment>(await query.ToListAsync(), totalCount, page.Value, pageSize.Value));
        }
        else
        {
            return Ok(await query.ToListAsync());
        }


    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BillPayment>> GetBillPayment(int id)
    {
        BillPayment? billPayment = await context.BillPayments.FindAsync(id);

        return billPayment == null ? (ActionResult<BillPayment>)NotFound() : (ActionResult<BillPayment>)billPayment;
    }

    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutBillPayment(int id, BillPayment billPayment)
    {
        if (id != billPayment.Id)
        {
            return BadRequest();
        }

        context.Entry(billPayment).State = EntityState.Modified;

        try
        {
            _ = await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!BillPaymentExists(id))
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
    public async Task<ActionResult<BillPayment>> PostBillPayment(BillPayment billPayment)
    {
        _ = context.BillPayments.Add(billPayment);
        _ = await context.SaveChangesAsync();

        return CreatedAtAction("GetBillPayment", new { id = billPayment.Id }, billPayment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBillPayment(int id)
    {
        BillPayment? billPayment = await context.BillPayments.FindAsync(id);
        if (billPayment == null)
        {
            return NotFound();
        }

        _ = context.BillPayments.Remove(billPayment);
        _ = await context.SaveChangesAsync();

        return NoContent();
    }

    private bool BillPaymentExists(int id) => context.BillPayments.Any(e => e.Id == id);
}
