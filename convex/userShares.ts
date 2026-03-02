import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

export async function getAccessibleUserIds(ctx: QueryCtx): Promise<string[]> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity?.subject) throw new Error("User not authenticated");

	const shares = await ctx.db
		.query("userShares")
		.withIndex("bySharedWithId", q => q.eq("sharedWithId", identity.subject))
		.collect();

	return [identity.subject, ...shares.map(s => s.ownerId)];
}

export const listSharedByMe = query({
	args: {},
	handler: async ctx => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		return await ctx.db
			.query("userShares")
			.withIndex("byOwnerId", q => q.eq("ownerId", identity.subject))
			.collect();
	},
});

export const listSharedWithMe = query({
	args: {},
	handler: async ctx => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		return await ctx.db
			.query("userShares")
			.withIndex("bySharedWithId", q => q.eq("sharedWithId", identity.subject))
			.collect();
	},
});

export const createShare = mutation({
	args: {
		sharedWithId: v.string(),
		permissions: v.union(v.literal("read"), v.literal("write")),
	},
	handler: async (ctx, { sharedWithId, permissions }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		if (sharedWithId === identity.subject) {
			throw new Error("Cannot share with yourself");
		}

		const existing = await ctx.db
			.query("userShares")
			.withIndex("byOwnerAndSharedWith", q =>
				q.eq("ownerId", identity.subject).eq("sharedWithId", sharedWithId),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { permissions });
			return existing._id;
		}

		return await ctx.db.insert("userShares", {
			ownerId: identity.subject,
			sharedWithId,
			permissions,
		});
	},
});

export const revokeShare = mutation({
	args: {
		shareId: v.id("userShares"),
	},
	handler: async (ctx, { shareId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const share = await ctx.db.get(shareId);

		if (!share) {
			throw new Error("Share not found");
		}

		if (share.ownerId !== identity.subject) {
			throw new Error("Not authorized to revoke this share");
		}

		await ctx.db.delete(shareId);
	},
});
