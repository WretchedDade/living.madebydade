import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
	"Create upcoming payments",
	{
		hourUTC: 13, // EST 8am
		minuteUTC: 0,
	},
	internal.billPayments.createUpcomingPayments,
);

crons.daily(
	"Prune old transactions (>6 months)",
	{
		hourUTC: 14, // EST 9am
		minuteUTC: 0,
	},
	internal.transactions.pruneOldTransactions,
);

export default crons;
