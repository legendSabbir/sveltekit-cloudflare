import { dev } from "$app/environment";
import { sequence } from "@sveltejs/kit/hooks";
import { drizzle } from "drizzle-orm/d1";
import * as table from "./lib/server/db/schema";

/** @type {import('@sveltejs/kit').Handle} */
const handlePlatform = async ({ event, resolve }) => {
  if (dev) {
    const { unstable_dev } = await import("wrangler");
    const { getBindings } = await import("cfw-bindings-wrangler-bridge");
    const worker = await unstable_dev(
      "./node_modules/cfw-bindings-wrangler-bridge/worker/index.js",
      {
        experimental: { disableExperimentalWarning: true },
      },
    );
    const env = await getBindings({
      bridgeWorkerOrigin: `http://${worker.address}:${worker.port}`,
    });
    event.platform = { env };
  }

  event.locals.db = drizzle(event.platform.env.DB);
  return resolve(event);
};

/** @type {import('@sveltejs/kit').Handle} */
const handleAuth = async ({ event, resolve }) => {
  console.log("handleAuth");

  const users = await event.locals.db.select().from(table.users);
  console.log(users);
  return resolve(event);
};

export const handle = sequence(handlePlatform, handleAuth);
