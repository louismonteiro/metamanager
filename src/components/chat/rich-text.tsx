import * as React from "react";

/**
 * Minimal inline renderer for the agent's replies: `**bold**` and `` `code` ``.
 *
 * Deliberately not a Markdown engine — the agent's output format is still
 * settling, and a full renderer would be a dependency to unpick later.
 */
const TOKEN_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export function RichText({ children }: { children: string }) {
  const parts = children.split(TOKEN_PATTERN);

  return (
    <>
      {parts.map((part, index) => {
        const key = `${index}-${part.slice(0, 8)}`;

        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={key}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={key}
              className="bg-muted rounded px-1 py-0.5 font-mono text-[0.8em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={key}>{part}</React.Fragment>;
      })}
    </>
  );
}
