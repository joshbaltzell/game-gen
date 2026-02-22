// Basic blocklist for client-side pre-filtering.
// The OpenAI Moderation API handles the heavy lifting server-side.
// This list catches the most obvious cases instantly before any API call.

const BLOCKED_PATTERNS: RegExp[] = [
  // These patterns catch common profanity and slurs.
  // Kept deliberately minimal — the OpenAI moderation API covers edge cases.
  /\b(f+u+c+k+|sh+i+t+|a+ss+h+o+l+e+|d+a+m+n+|b+i+t+c+h+)\b/i,
  /\b(n+i+g+g+|f+a+g+|r+e+t+a+r+d+)\b/i,
  /\b(k+i+l+l\s+(your|my)self)\b/i,
  /\b(s+u+i+c+i+d+e+)\b/i,
];

export function checkBlockedWords(input: string): {
  blocked: boolean;
  reason?: string;
} {
  const normalized = input.toLowerCase().trim();

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        blocked: true,
        reason: "This word isn't allowed. Try something more creative!",
      };
    }
  }

  return { blocked: false };
}
