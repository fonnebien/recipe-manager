import { Hono } from "hono";
import { requestId } from "./middleware/request-id.js";
import { requestLogging } from "./middleware/logging.js";
import { onError } from "./middleware/error-handler.js";
import { recipesRoute } from "./routes/recipes.js";
import { pantryRoute } from "./routes/pantry.js";
import { groceryListRoute } from "./routes/grocery-list.js";

const app = new Hono()
  .use(requestId)
  .use(requestLogging)
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/recipes", recipesRoute)
  .route("/pantry", pantryRoute)
  .route("/grocery-list", groceryListRoute);

app.onError(onError);

export type AppType = typeof app;
export { app };
