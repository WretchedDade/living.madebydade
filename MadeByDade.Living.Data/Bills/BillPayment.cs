namespace MadeByDade.Living.Data.Bills;

public class BillPayment
{
    public int Id { get; set; }
    public DateOnly DateDue { get; set; }
    public DateOnly DatePaid { get; set; }

    public int BillId { get; set; }
    public Bill Bill { get; set; }
}
