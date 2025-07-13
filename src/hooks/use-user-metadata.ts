import { useUser } from '@clerk/tanstack-react-start';
import { z } from 'zod';

export function useUserMetadata(): UserMetadata | null {
	const { user } = useUser();

	if (user == null) {
		return null;
	}

	const result = userMetadataSchema.safeParse(user.publicMetadata);

	if (result.success) {
		return result.data;
	} else {
		console.error(result.error);
		return null;
	}
}

export function useUserPermissions(): UserMetadata['permissions'] {
	const userMetadata = useUserMetadata();

	if (userMetadata == null) {
		return {
			bills: false,
		};
	}

	return userMetadata.permissions;
}

type UserMetadata = z.infer<typeof userMetadataSchema>;

const userMetadataSchema = z.object({
	permissions: z.object({
		bills: z.boolean(),
	}),
});
