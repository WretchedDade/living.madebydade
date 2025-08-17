import { useUser } from "@clerk/tanstack-react-start";
import { useEffect, useState } from "react";

export function useClerkUser(userId: string) {
	const [user, setUser] = useState<{ fullName?: string; id: string } | null>(null);
	const { getUser } = useUser();

	useEffect(() => {
		let isMounted = true;
		async function fetchUser() {
			if (!userId) {
				setUser(null);
				return;
			}
			try {
				const clerkUser = await getUser(userId);
				if (isMounted) {
					setUser({
						fullName:
							clerkUser?.fullName || clerkUser?.username || clerkUser?.emailAddress || clerkUser?.id,
						id: clerkUser?.id,
					});
				}
			} catch (e) {
				setUser(null);
			}
		}
		fetchUser();
		return () => {
			isMounted = false;
		};
	}, [userId, getUser]);

	return user;
}
