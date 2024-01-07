using System.Globalization;

namespace MadeByDade.Living.ServiceDefaults;

public static class DateTimeExtensions
{
    public static DateTime ToFirstOfMonth(this DateTime dateTime) => new(dateTime.Year, dateTime.Month, 1);

    public static DateTime ToEndOfMonth(this DateTime dateTime) => dateTime.ToFirstOfMonth().AddMonths(1).AddTicks(-1);

    public static DateTime GetNextMonday(this DateTime dateTime) => dateTime.DayOfWeek switch
    {
        DayOfWeek.Monday => dateTime.AddDays(7),
        DayOfWeek.Tuesday => dateTime.AddDays(6),
        DayOfWeek.Wednesday => dateTime.AddDays(5),
        DayOfWeek.Thursday => dateTime.AddDays(4),
        DayOfWeek.Friday => dateTime.AddDays(3),
        DayOfWeek.Saturday => dateTime.AddDays(2),
        DayOfWeek.Sunday => dateTime.AddDays(1),
        _ => throw new NotImplementedException()
    };

    public static string ToMonthName(this int month) => CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
    public static string ToMonthAbbr(this int month) => CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(month);

}
