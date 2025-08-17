// This type should be kept in sync with your Convex schema for the activity table
export type BillPaidActivity = {
	type: "billPaid";
	userId: string;
	targetId: string;
	timestamp: number;
	details: {
		description: string;
		amount: number;
		billName: string;
	};
};

export type QuestCompletedActivity = {
	type: "questCompleted";
	userId: string;
	targetId: string;
	timestamp: number;
	details: {
		description: string;
		questName: string;
		xpEarned: number;
	};
};

export type BillAddedActivity = {
	type: "billAdded";
	userId: string;
	targetId: string;
	timestamp: number;
	details: {
		description: string;
		billName: string;
	};
};

export type BillRemovedActivity = {
	type: "billRemoved";
	userId: string;
	targetId: string;
	timestamp: number;
	details: {
		description: string;
		billName: string;
	};
};

export type BillUpdatedActivity = {
	type: "billUpdated";
	userId: string;
	targetId: string;
	timestamp: number;
	details: {
		description: string;
		billName: string;
		changes: Array<{
			field: string;
			before: unknown;
			after: unknown;
		}>;
	};
};

export type BillDueActivity = {
	type: "billDue";
	userId: string;
	targetId: string;
	timestamp: number;
	details: {
		description: string;
		dueDate: string; // ISO date string
		billName: string;
	};
};

export type Activity =
	| BillPaidActivity
	| QuestCompletedActivity
	| BillAddedActivity
	| BillRemovedActivity
	| BillUpdatedActivity
	| BillDueActivity;

// Type for Convex backend results (includes _id, _creationTime, etc.)
export type ActivityDoc = Activity & { _id: string; _creationTime?: number; [key: string]: any };

// Type guard functions
export function isBillPaidActivity(activity: Activity): activity is BillPaidActivity {
	return activity.type === "billPaid";
}

export function isQuestCompletedActivity(activity: Activity): activity is QuestCompletedActivity {
	return activity.type === "questCompleted";
}

export function isBillAddedActivity(activity: Activity): activity is BillAddedActivity {
	return activity.type === "billAdded";
}

export function isBillRemovedActivity(activity: Activity): activity is BillRemovedActivity {
	return activity.type === "billRemoved";
}

export function isBillUpdatedActivity(activity: Activity): activity is BillUpdatedActivity {
	return activity.type === "billUpdated";
}

export function isBillDueActivity(activity: Activity): activity is BillDueActivity {
	return activity.type === "billDue";
}
