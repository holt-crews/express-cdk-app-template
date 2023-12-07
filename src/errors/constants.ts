export const ERRORS = {
  SERVER1001: {
    code: "SERVER1001",
    message: "Invalid Request.",
    details: "{detailsText}",
  },
  DEFAULT_ERROR: {
    code: "DEFAULT_ERROR",
    message: "Internal Server Error",
    details: "Error occurred, please try again",
  },
} as const;
