using MadeByDade.Living.Data;

namespace MadeByDade.Living.API.Jobs;

public interface ICreateUpcomingBillPayments
{
    Task Execute();
}

public class CreateUpcomingBillPayments(LivingContext context) : ICreateUpcomingBillPayments
{
    public async Task Execute()
    {
        Console.WriteLine("Test");
    }
}
