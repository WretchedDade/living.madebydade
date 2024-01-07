using System.ComponentModel.DataAnnotations;

namespace MadeByDade.Living.Data.Bills;

public class BillPayment
{
    public int Id { get; set; }
    public DateTime DateDue { get; set; }
    public DateTime? DatePaid { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.Today;

    public int BillId { get; set; }
    public Bill Bill { get; set; }

    public bool IsPaid => DatePaid.HasValue;
}
