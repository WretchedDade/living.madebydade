using Hangfire;
using MadeByDade.Living.Data;
using MadeByDade.Living.Data.Bills;
using MadeByDade.Living.ServiceDefaults;
using Microsoft.EntityFrameworkCore;

namespace MadeByDade.Living.API.Jobs;

public interface ICreateUpcomingBillPayments
{
    Task Execute();
}

public class CreateUpcomingBillPayments(LivingContext context, ILogger<CreateUpcomingBillPayments> logger) : ICreateUpcomingBillPayments
{
    public async Task Execute()
    {
        List<Bill> bills = await context.Bills.Include(bill => bill.Payments).ToListAsync();

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
            if (bill.Payments.Any(payment => payment.DateDue == nextPaymentDate.Value.Date))
            {
                if(bill.IsAutoPay && DateTime.Today == nextPaymentDate.Value.Date)
                {
                    // Bill Payment already exists for this date, and the bill is set to AutoPay, so pay it
                    bill.Payments.Single(payment => payment.DateDue == nextPaymentDate.Value.Date).DatePaid = DateTime.Today;
                    await context.SaveChangesAsync();
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

            await context.BillPayments.AddAsync(billPayment);
            await context.SaveChangesAsync();

        }
    }

    public DateTime? GetNextPaymentDate(Bill bill)
    {
        if (bill.DueType == BillDueType.Fixed)
        {
            if (bill.DayDue is < 1 or > 31)
            {
                logger.LogError("Bill {BillName} is configured incorrectly. It has a fixed due type but the day due is {DayDue}", bill.Name, bill.DayDue);
                return null;
            }

            var dateDueThisMonth = new DateTime(DateTime.Today.Year, DateTime.Today.Month, bill.DayDue, 0, 0, 0, DateTimeKind.Utc);

            if (DateTime.Today.Day <= bill.DayDue)
                // Bill is due in current month
                return dateDueThisMonth;

            else
                // Bill isn't due till next month
                return dateDueThisMonth.AddMonths(1);
        }
        else if (bill.DueType == BillDueType.EndOfMonth)
        {
            var endOfCurrentMonth = DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc).ToEndOfMonth();

            if (DateTime.Today.Day < endOfCurrentMonth.Day)
                // Bill is due in current month
                return endOfCurrentMonth;
            else
            {
                // Bill isn't due till next month
                return endOfCurrentMonth.AddMonths(1);
            }
        }
        else
        {
            logger.LogError("Bill {BillName} has an unknown due type {DueType}", bill.Name, bill.DueType);
            throw new NotImplementedException($"The {bill.DueType} BillDueType has not been implemented yet.");
        }
    }
}