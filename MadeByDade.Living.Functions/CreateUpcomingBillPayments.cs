using MadeByDade.Living.Data;
using MadeByDade.Living.Data.Bills;
using MadeByDade.Living.ServiceDefaults;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadeByDade.Living.Functions;

public class CreateUpcomingBillPayments
{
    private readonly ILogger<CreateUpcomingBillPayments> _logger;
    private readonly LivingContext _context;

    public CreateUpcomingBillPayments(ILogger<CreateUpcomingBillPayments> logger, LivingContext context)
    {
        _logger = logger;
        _context = context;
    }

    [Function("CreateUpcomingBillPayments")]
    public async Task RunAsync([TimerTrigger("0 0 12 * * *")] TimerInfo myTimer) // Run every day at 12:00 UTC (8:00 EST)
    {
        List<Bill> bills = await _context.Bills.Include(bill => bill.Payments).ToListAsync();

        foreach (Bill bill in bills)
        {
            DateTime? nextPaymentDate = GetNextPaymentDate(bill);

            if (!nextPaymentDate.HasValue)
                // Next Payment Date could not be determined, unable to create Bill Payment
                continue;

            if (nextPaymentDate.Value.Subtract(DateTime.Today).TotalDays >= 15)
                // Next Payment Date is more than 14 days away, do not create Bill Payment
                continue;

            // Check if Bill Payment already exists for this date
            if (bill.Payments.Any(payment => payment.DateDue.Date == nextPaymentDate.Value.Date))
            {
                if (bill.IsAutoPay && DateTime.Today == nextPaymentDate.Value.Date)
                {
                    // Bill Payment already exists for this date, and the bill is set to AutoPay, so pay it
                    bill.Payments.Single(payment => payment.DateDue.Date == nextPaymentDate.Value.Date).DatePaid = DateTime.Today;
                    continue;
                }
                else
                {
                    // Bill Payment already exists for this date, do not create another
                    continue;
                }
            }

            // Create Bill Payment
            BillPayment billPayment = new()
            {
                BillId = bill.Id,
                DateDue = nextPaymentDate.Value.Date,
            };

            _ = await _context.BillPayments.AddAsync(billPayment);
        }

        _ = await _context.SaveChangesAsync();
    }

    public DateTime? GetNextPaymentDate(Bill bill)
    {
        if (bill.DueType == BillDueType.Fixed)
        {
            if (bill.DayDue is < 1 or > 31)
            {
                _logger.LogError("Bill {BillName} is configured incorrectly. It has a fixed due type but the day due is {DayDue}", bill.Name, bill.DayDue);
                return null;
            }

            int year = DateTime.Today.Year;
            int month = DateTime.Today.Month;

            var dateDueThisMonth = new DateTime(year, month, Math.Min(DateTime.DaysInMonth(year, month), bill.DayDue), 0, 0, 0, DateTimeKind.Utc);

            if (DateTime.Today.Day <= bill.DayDue)
                // Bill is due in current month
                return dateDueThisMonth;

            else
                // Bill isn't due till next month
                return dateDueThisMonth.AddMonths(1);
        }
        else if (bill.DueType == BillDueType.EndOfMonth)
        {
            DateTime endOfCurrentMonth = DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc).ToEndOfMonth();

            if (DateTime.Today.Day < endOfCurrentMonth.Day)
            {
                // Bill is due in current month
                return endOfCurrentMonth;
            }
            else
            {
                // Bill isn't due till next month
                return endOfCurrentMonth.AddMonths(1);
            }
        }
        else
        {
            _logger.LogError("Bill {BillName} has an unknown due type {DueType}", bill.Name, bill.DueType);
            throw new NotImplementedException($"The {bill.DueType} BillDueType has not been implemented yet.");
        }
    }
}
