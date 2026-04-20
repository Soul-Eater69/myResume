export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg: string, code = "bad_request") =>
  new HttpError(400, code, msg);
export const unauthorized = (msg = "unauthorized") =>
  new HttpError(401, "unauthorized", msg);
export const forbidden = (msg = "forbidden") => new HttpError(403, "forbidden", msg);
export const notFound = (msg = "not found") => new HttpError(404, "not_found", msg);
export const conflict = (msg: string) => new HttpError(409, "conflict", msg);
export const internal = (msg = "internal error") =>
  new HttpError(500, "internal", msg);
