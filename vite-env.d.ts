/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly CLERK_PUBLISHABLE_KEY: string;
	readonly CLERK_SECRET_KEY: string;
	readonly VITE_CONVEX_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
