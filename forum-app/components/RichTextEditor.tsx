"use client";
import { useRef } from "react";

export default function RichTextEditor({
  value, onChange, placeholder,
}: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || "");
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, padding: 8,
        borderBottom: "1px solid var(--line)", background: "var(--paper-dim)",
      }}>
        <ToolBtn label="B" title="מודגש" onClick={() => exec("bold")} style={{ fontWeight: 700 }} />
        <ToolBtn label="I" title="נטוי" onClick={() => exec("italic")} style={{ fontStyle: "italic" }} />
        <ToolBtn label="U" title="קו תחתון" onClick={() => exec("underline")} style={{ textDecoration: "underline" }} />
        <span style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
        <select onChange={(e) => exec("fontSize", e.target.value)} defaultValue="3" title="גודל גופן">
          <option value="1">קטן מאוד</option>
          <option value="2">קטן</option>
          <option value="3">רגיל</option>
          <option value="4">בינוני</option>
          <option value="5">גדול</option>
          <option value="6">גדול מאוד</option>
        </select>
        <input type="color" title="צבע טקסט" onChange={(e) => exec("foreColor", e.target.value)} style={{ width: 34, padding: 2 }} />
        <span style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
        <ToolBtn label="•" title="רשימה" onClick={() => exec("insertUnorderedList")} />
        <ToolBtn label="1." title="רשימה ממוספרת" onClick={() => exec("insertOrderedList")} />
        <ToolBtn label="⟲" title="בטל" onClick={() => exec("undo")} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
        dangerouslySetInnerHTML={{ __html: value || "" }}
        data-placeholder={placeholder}
        style={{ minHeight: 140, padding: 12, outline: "none", fontSize: 15, lineHeight: 1.6 }}
      />
    </div>
  );
}

function ToolBtn({ label, title, onClick, style }: { label: string; title: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{ minWidth: 32, padding: "6px 8px", ...style }}>
      {label}
    </button>
  );
}
