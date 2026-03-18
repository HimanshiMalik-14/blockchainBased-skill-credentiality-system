import { HttpError } from "./httpError.js";

export function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : 500;
  const payload = {
    error: err instanceof HttpError ? err.message : "Internal Server Error"
  };

  if (err instanceof HttpError && err.details) {
    payload.details = err.details;
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json(payload);
}

