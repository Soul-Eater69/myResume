import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { HttpError } from "./errors";
import { logger } from "./logger";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export async function parseJson<S extends ZodTypeAny>(
  req: Request,
  schema: S
): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "invalid_json", "request body is not valid JSON");
  }
  return schema.parse(body);
}

export function handle(handler: (req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const path = first?.path?.length ? first.path.join(".") : "";
        const message = first
          ? `${path ? path + ": " : ""}${first.message}`
          : "Invalid input.";
        return NextResponse.json(
          { error: "validation_error", message, issues: err.issues },
          { status: 400 }
        );
      }
      if (err instanceof HttpError) {
        return NextResponse.json(
          { error: err.code, message: err.message },
          { status: err.status }
        );
      }
      const message = err instanceof Error ? err.message : "unknown error";
      logger.error("unhandled_api_error", { message });
      return NextResponse.json(
        { error: "internal", message: "something went wrong" },
        { status: 500 }
      );
    }
  };
}
