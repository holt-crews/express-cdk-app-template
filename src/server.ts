import app from "./app";
import { BaseError } from "./errors/BaseError";

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 server started at http://localhost:${port}`);
});

/*
Purpose of 👇 handlers is to handle errors that fall outside of the express routes.
*/

process.on("unhandledRejection", (error: Error) => {
  throw error;
});

process.on("uncaughtException", (error: Error) => {
  if (error instanceof BaseError) {
    process.exit(1);
  }
});
