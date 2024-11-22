import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import {
  BackendError,
  createBackendError,
  isBackendError,
} from "@/data-access/error";
import { createClient } from "@/lib/supabase/server";

export type StandardResponse<T> = Promise<
  | { data: T extends null ? never : T; error: null }
  | { data: null; error: BackendError }
>;

type AuthedAction<T, Args extends any[]> = (
  userId: string,
  ...args: Args
) => StandardResponse<T>;

type UnauthedAction<T, Args extends any[]> = (
  ...args: Args
) => StandardResponse<T>;

type ServerActionLayerOptions = {
  authRequired: boolean;
  revalidationPath?: string;
  revalidationType?: "layout" | "page";
};

export function createServerActionLayer(
  options: ServerActionLayerOptions & { authRequired: true }
): <T, Args extends any[]>(
  action: AuthedAction<T, Args>
) => (...args: Args) => StandardResponse<T>;

export function createServerActionLayer(
  options: ServerActionLayerOptions & { authRequired?: false }
): <T, Args extends any[]>(
  action: UnauthedAction<T, Args>
) => (...args: Args) => StandardResponse<T>;

export function createServerActionLayer({
  authRequired,
  revalidationPath,
  revalidationType = undefined,
}: ServerActionLayerOptions) {
  return function serverActionLayer<T, Args extends any[]>(
    action: AuthedAction<T, Args> | UnauthedAction<T, Args>
  ): (...args: Args) => StandardResponse<T> {
    return (async (...args) => {
      try {
        if (!authRequired) {
          // Auth not required, no userId =>
          const result = await (action as UnauthedAction<T, Args>)(...args);
          revalidationPath &&
            revalidatePath(revalidationPath, revalidationType);
          return { data: result.data, error: result.error };
        }

        // Auth required, userId available =>
        const supabase = createClient({
          setCookies: false,
        });
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token || !session.user?.id) {
          return {
            data: null,
            error: createBackendError("AUTH_FAILED", "Access denied"),
          };
        }

        if (
          jwt.verify(
            session.access_token,
            process.env.SUPABASE_JWT_SECRET as string
          )
        ) {
          // Auth required, userId available =>
          const result = await (action as AuthedAction<T, Args>)(
            session.user.id,
            ...args
          );
          if (revalidationPath) {
            revalidatePath(revalidationPath, revalidationType);
          }
          return { data: result.data, error: result.error };
        } else {
          return {
            data: null,
            error: createBackendError("AUTH_FAILED", "Access denied"),
          };
        }
      } catch (error) {
        if (isBackendError(error)) {
          return { data: null, error: error };
        } else if (error instanceof Error) {
          return {
            data: null,
            error: createBackendError("GENERIC_ERROR", error.message),
          };
        } else {
          return {
            data: null,
            error: createBackendError(
              "GENERIC_ERROR",
              "An unknown error occurred"
            ),
          };
        }
      }
    }) as typeof authRequired extends true
      ? (userId: string, ...args: Args) => StandardResponse<T>
      : (...args: Args) => StandardResponse<T>;
  };
}

// Seperate file for error handling 👇

type ErrorCodeKey = keyof typeof ERROR_CODES;
type ErrorCodeValue = (typeof ERROR_CODES)[ErrorCodeKey];

export const ERROR_CODES = {
  RATE_LIMITED: "ERR_RATE_LIMITED",
  INVALID_INPUT: "ERR_INVALID_INPUT",
  ACCOUNT_LIMITATION: "ERR_ACCOUNT_LIMITATION",
  NETWORK_FAILURE: "ERR_NETWORK_FAILURE",
  GENERIC_ERROR: "ERR_GENERIC_ERROR",
  AUTH_FAILED: "ERR_AUTH_FAILED",
  NOT_FOUND: "ERR_NOT_FOUND",
} as const;

// Frontend translations
const frontendMessages: Record<ErrorCodeValue, string> = {
  [ERROR_CODES.RATE_LIMITED]:
    "You have been ratelimited. Please try again later.",
  [ERROR_CODES.INVALID_INPUT]: "Please check your input, and try again.",
  [ERROR_CODES.GENERIC_ERROR]: "An error occurred. Please try again.",
  [ERROR_CODES.ACCOUNT_LIMITATION]:
    "You have reached the limit for your account plan.",
  [ERROR_CODES.AUTH_FAILED]: "Authentication failed. Please log in again.",
  [ERROR_CODES.NETWORK_FAILURE]: "Network error. Please try again.",
  [ERROR_CODES.NOT_FOUND]: "Could not find resource, please try again.",
};

export type BackendError = {
  message: string;
  code: ErrorCodeKey;
  frontendMessage: string;
};

export function handleError(code: ErrorCodeValue): string {
  return frontendMessages[code] || "An unknown error occurred.";
}

export function createBackendError(
  code: ErrorCodeKey,
  message: string,
  customFrontendMessage?: string
): BackendError {
  const frontendMsgKey = ERROR_CODES[code];
  return {
    code: code,
    message: message,
    frontendMessage: customFrontendMessage || frontendMessages[frontendMsgKey],
  };
}

export function isBackendError(error: unknown): error is BackendError {
  if (typeof error !== "object" || error === null) {
    console.log("Error is not an object or is null");
    return false;
  }

  const hasMessage = "message" in error;
  const hasCode = "code" in error;
  const hasFrontendMessage = "frontendMessage" in error;

  if (!hasMessage || !hasCode) {
    console.warn("Error is not BackendError: ", error);
    return false;
  }

  const messageIsString = typeof (error as BackendError).message === "string";
  const codeIsString = typeof (error as BackendError).code === "string";
  const frontendMessageIsValid =
    !hasFrontendMessage ||
    typeof (error as BackendError).frontendMessage === "string";

  console.warn(
    "Error is BackendError?: ",
    messageIsString && codeIsString && frontendMessageIsValid
  );

  return messageIsString && codeIsString && frontendMessageIsValid;
}
