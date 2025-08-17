import { clerkClient } from "@clerk/clerk-sdk-node";
import { v } from "convex/values";
import { action, query } from "./_generated/server";

// Server function to get user from Clerk by userId
export const getUserById = action({
	args: { userId: v.string() },
	async handler(ctx, args) {
		try {
			var user = await clerkClient.users.getUser(args.userId);
			return {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				fullName: `${user.firstName} ${user.lastName}`,
				email: user.emailAddresses[0]?.emailAddress,
				hasImage: user.hasImage,
				imageUrl: user.imageUrl,
			};
		} catch (error) {
			console.error("Error fetching user from Clerk:", error);
			throw new Error("Failed to fetch user");
		}
	},
});
