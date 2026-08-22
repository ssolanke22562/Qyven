/**
 * src/lib/tracing/redactor.ts
 *
 * Automatic secret and sensitive credential redaction utility.
 * Sanitizes prompts, tool arguments, HTTP headers, environment values,
 * and error messages before they are stored in traces or returned via API.
 */

// Patterns to detect sensitive secrets, auth headers, private tokens, and API keys
const SENSITIVE_KEY_PATTERNS = [
  /pub_[a-zA-Z0-9_\-]{16,}/gi,              // NewsData.io API keys
  /gsk_[a-zA-Z0-9_\-]{20,}/gi,              // Groq API keys
  /AIza[0-9A-Za-z\-_]{35}/gi,               // Google Gemini / Firebase API keys
  /sk-[a-zA-Z0-9_\-]{20,}/gi,               // OpenAI API keys
  /Bearer\s+[a-zA-Z0-9_\-\.]{15,}/gi,       // Bearer tokens
  /basic\s+[a-zA-Z0-9_\-\.]{10,}/gi,        // Basic auth tokens
  /api[_\-]?key\s*[:=]\s*["']?[^"'&\s]{8,}["']?/gi,
  /secret\s*[:=]\s*["']?[^"'&\s]{8,}["']?/gi,
  /password\s*[:=]\s*["']?[^"'&\s]{4,}["']?/gi,
  /authorization\s*[:=]\s*["']?[^"'&\s]{8,}["']?/gi,
];

/**
 * Recursively redacts sensitive strings, objects, and arrays.
 */
export function redactSensitiveData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    let sanitized: string = input;
    for (const pattern of SENSITIVE_KEY_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match) => {
        if (match.toLowerCase().startsWith("bearer ")) {
          return "Bearer [REDACTED_AUTH_TOKEN]";
        }
        if (match.toLowerCase().startsWith("pub_")) {
          return "pub_[REDACTED_NEWSDATA_KEY]";
        }
        if (match.toLowerCase().startsWith("gsk_")) {
          return "gsk_[REDACTED_GROQ_KEY]";
        }
        if (match.startsWith("AIza")) {
          return "AIza[REDACTED_GEMINI_KEY]";
        }
        if (match.toLowerCase().startsWith("sk-")) {
          return "sk-[REDACTED_API_KEY]";
        }
        return "[REDACTED_SECRET]";
      });
    }
    return sanitized as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const redactedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("key") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("auth") ||
        lowerKey.includes("password") ||
        lowerKey.includes("cookie") ||
        lowerKey.includes("credential")
      ) {
        if (typeof value === "string" && value.length > 0) {
          redactedObj[key] = `[REDACTED_${key.toUpperCase()}]`;
        } else {
          redactedObj[key] = "[REDACTED]";
        }
      } else {
        redactedObj[key] = redactSensitiveData(value);
      }
    }
    return redactedObj as unknown as T;
  }

  return input;
}
