// convex/convex.config.ts
import { defineApp } from "convex/server";
import cache from "@convex-dev/action-cache/convex.config";
import migrations from "@convex-dev/migrations/convex.config";

const app = defineApp();
app.use(cache);
app.use(migrations);

export default app;
