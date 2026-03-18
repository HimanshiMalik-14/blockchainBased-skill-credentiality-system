import { HttpError } from "./httpError.js";

export function notFound(req, res, next) {
  next(new HttpError(404, "Not found"));
}

