using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MadeByDade.Living.Data;
using MadeByDade.Living.Data.Bills;

namespace MadeByDade.Living.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BillPaymentsController(LivingContext context) : ControllerBase
    {

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BillPayment>>> GetBillPayments([FromQuery] bool unpaidOnly = true)
        {
            if (unpaidOnly)
                return await context.BillPayments.Where(payment => !payment.DatePaid.HasValue).Include(bp => bp.Bill).ToListAsync();

            return await context.BillPayments.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BillPayment>> GetBillPayment(int id)
        {
            var billPayment = await context.BillPayments.FindAsync(id);

            if (billPayment == null)
            {
                return NotFound();
            }

            return billPayment;
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
                await context.SaveChangesAsync();
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
            context.BillPayments.Add(billPayment);
            await context.SaveChangesAsync();

            return CreatedAtAction("GetBillPayment", new { id = billPayment.Id }, billPayment);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBillPayment(int id)
        {
            var billPayment = await context.BillPayments.FindAsync(id);
            if (billPayment == null)
            {
                return NotFound();
            }

            context.BillPayments.Remove(billPayment);
            await context.SaveChangesAsync();

            return NoContent();
        }

        private bool BillPaymentExists(int id)
        {
            return context.BillPayments.Any(e => e.Id == id);
        }
    }
}
