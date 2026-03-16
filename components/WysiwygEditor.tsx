"use client";

import { forwardRef, type FC } from "react";

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function insertWrap(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const newValue =
    textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  onChange(newValue);
  requestAnimationFrame(() => {
    textarea.focus();
    const cursor = start + before.length + selected.length + after.length;
    textarea.setSelectionRange(cursor, cursor);
  });
}

function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="min-w-[28px] rounded px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-accent-soft"
    >
      {children}
    </button>
  );
}

const WysiwygEditor = forwardRef<HTMLTextAreaElement, WysiwygEditorProps>(
  ({ value, onChange, placeholder }, ref) => {
    function ins(before: string, after = "") {
      const el =
        typeof ref === "function"
          ? null
          : (ref as React.RefObject<HTMLTextAreaElement>)?.current;
      if (!el) return;
      insertWrap(el, before, after, onChange);
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-line">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-white/70 px-2 py-1.5 dark:bg-white/10">
          <ToolBtn onClick={() => ins("<strong>", "</strong>")} title="Gras (Ctrl+B)">
            <strong>B</strong>
          </ToolBtn>
          <ToolBtn onClick={() => ins("<em>", "</em>")} title="Italique (Ctrl+I)">
            <em>I</em>
          </ToolBtn>
          <ToolBtn onClick={() => ins("<u>", "</u>")} title="Souligné">
            <u>U</u>
          </ToolBtn>
          <ToolBtn onClick={() => ins("<s>", "</s>")} title="Barré">
            <s>S</s>
          </ToolBtn>
          <span className="mx-1 h-4 w-px bg-line" />
          <ToolBtn onClick={() => ins("\n<h2>", "</h2>\n")} title="Titre H2">
            H2
          </ToolBtn>
          <ToolBtn onClick={() => ins("\n<h3>", "</h3>\n")} title="Titre H3">
            H3
          </ToolBtn>
          <ToolBtn onClick={() => ins("\n<h4>", "</h4>\n")} title="Titre H4">
            H4
          </ToolBtn>
          <span className="mx-1 h-4 w-px bg-line" />
          <ToolBtn onClick={() => ins("\n<p>", "</p>\n")} title="Paragraphe">
            ¶
          </ToolBtn>
          <ToolBtn
            onClick={() => ins("\n<blockquote>\n  ", "\n</blockquote>\n")}
            title="Citation"
          >
            ❝
          </ToolBtn>
          <ToolBtn
            onClick={() => ins("\n<ul>\n  <li>", "</li>\n</ul>\n")}
            title="Liste à puces"
          >
            •—
          </ToolBtn>
          <ToolBtn
            onClick={() => ins("\n<ol>\n  <li>", "</li>\n</ol>\n")}
            title="Liste numérotée"
          >
            1.
          </ToolBtn>
          <span className="mx-1 h-4 w-px bg-line" />
          <ToolBtn onClick={() => ins('<a href="https://">', "</a>")} title="Lien">
            🔗
          </ToolBtn>
          <ToolBtn onClick={() => ins("\n<hr />\n", "")} title="Séparateur">
            —
          </ToolBtn>
        </div>

        {/* ── Textarea HTML ── */}
        <textarea
          ref={ref}
          className="min-h-[400px] w-full resize-y bg-white/70 px-4 py-3 font-mono text-sm leading-relaxed dark:bg-white/10 dark:text-foreground"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    );
  },
);

WysiwygEditor.displayName = "WysiwygEditor";

export default WysiwygEditor;
