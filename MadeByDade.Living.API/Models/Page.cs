namespace MadeByDade.Living.API.Models;

public class Page<T>(IEnumerable<T> items, int totalItems, int pageNumber, int pageSize) where T : class
{
    public IEnumerable<T> Items { get; } = items;

    public int TotalItems { get; } = totalItems;

    public int PageNumber { get; } = pageNumber;

    public int PageSize { get; } = pageSize;

    public int TotalPages => (int)Math.Ceiling(TotalItems / (double)PageSize);

}
