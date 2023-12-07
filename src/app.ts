import express from "express";
import cors from "cors";
import "express-async-errors"; // this must come before the routes are imported
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import route from "./routes/route";

// Whenever we bump our express version to 5.x., we can remove this dependency

dotenv.config();
// -----------------------------------------------------------------------
// Express setup
// -----------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------
// Routers
// -----------------------------------------------------------------------
app.use("/", route);

// error handler middleware should always be last in the middleware chain (except 404)
app.use(errorHandler);

// if we get all the way through and don't hit anything, return 404
app.use((_req, res) => {
  res.status(404).json("Not Found");
});

export default app;
