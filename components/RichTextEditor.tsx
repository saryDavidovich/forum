"use client";
import { useEffect, useRef, useState } from "react";

export type Attachment = { name: string; url: string };

export default function RichTextEditor({
  value, onChange, placeholder, attachments, onAttachmentsChange,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (files: Attachment[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Set<string>>(new Set());

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || "");
    updateActive();
  }

  function updateActive() {
    const next = new Set<string>();
    ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].forEach((c) => {
      try { if (document.queryCommandState(c)) next.add(c); } catch { /* ignore */ }
    });
    setActive(next);
  }

  useEffect(() => {
    document.addEventListener("selectionchange", updateActive);
    return () => document.removeEventListener("selectionchange", updateActive);
  }, []);

  function addLink() {
    const url = window.prompt("כתובת הקישור:");
    if (url) exec("createLink", url);
  }

  function onFiles(files: FileList | null) {
    if (!files || !onAttachmentsChange) return;
    const current = attachments || [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        onAttachmentsChange([...current, { name: file.name, url: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeAttachment(i: number) {
    if (!onAttachmentsChange) return;
    const next = [...(attachments || [])];
    next.splice(i, 1);
    onAttachmentsChange(next);
  }

  const btnStyle = (cmd: string): React.CSSProperties =>
    active.has(cmd) ? { background: "var(--navy-950)", color: "#fff" } : {};

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, padding: 8,
        borderBottom: "1px solid var(--line)", background: "var(--paper-dim)",
      }}>
        <ToolBtn label="B" title="מודגש" onClick={() => exec("bold")} style={{ fontWeight: 700, ...btnStyle("bold") }} />
        <ToolBtn label="I" title="נטוי" onClick={() => exec("italic")} style={{ fontStyle: "italic", ...btnStyle("italic") }} />
        <ToolBtn label="U" title="קו תחתון" onClick={() => exec("underline")} style={{ textDecoration: "underline", ...btnStyle("underline") }} />
        <ToolBtn label="S" title="קו חוצה" onClick={() => exec("strikeThrough")} style={{ textDecoration: "line-through", ...btnStyle("strikeThrough") }} />
        <span style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
        <select onChange={(e) => exec("fontSize", e.target.value)} defaultValue="3" title="גודל גופן">
          <option value="1">קטן מאוד</option>
          <option value="2">קטן</option>
          <option value="3">רגיל</option>
          <option value="4">בינוני</option>
          <option value="5">גדול</option>
          <option value="6">גדול מאוד</option>
        </select>
        <select onChange={(e) => { if (e.target.value) exec("formatBlock", e.target.value); }} defaultValue="" title="כותרת">
          <option value="">פסקה רגילה</option>
          <option value="H2">כותרת גדולה</option>
          <option value="H3">כותרת בינונית</option>
          <option value="BLOCKQUOTE">ציטוט</option>
        </select>
        <input type="color" title="צבע טקסט" onChange={(e) => exec("foreColor", e.target.value)} style={{ width: 34, padding: 2 }} />
        <span style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
        <ToolBtn label="•" title="רשימה" onClick={() => exec("insertUnorderedList")} style={btnStyle("insertUnorderedList")} />
        <ToolBtn label="1." title="רשימה ממוספרת" onClick={() => exec("insertOrderedList")} style={btnStyle("insertOrderedList")} />
        <ToolBtn label="⇤" title="יישור לימין" onClick={() => exec("justifyRight")} />
        <ToolBtn label="⇥" title="יישור לשמאל" onClick={() => exec("justifyLeft")} />
        <ToolBtn label="≡" title="יישור למרכז" onClick={() => exec("justifyCenter")} />
        <ToolBtn label="🔗" title="הוספת קישור" onClick={addLink} />
        <ToolBtn label="⟲" title="בטל" onClick={() => exec("undo")} />
        <ToolBtn label="⟳" title="בצע שוב" onClick={() => exec("redo")} />
        {onAttachmentsChange && (
          <label className="btn" style={{ padding: "6px 10px", fontSize: 13, cursor: "pointer" }} title="צירוף קובץ">
            📎 צרף קובץ
            <input type="file" multiple style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
          </label>
        )}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        onInput={() => onChange(ref.current?.innerHTML || "")}
        onKeyUp={updateActive}
        onMouseUp={updateActive}
        dangerouslySetInnerHTML={{ __html: value || "" }}
        data-placeholder={placeholder}
        style={{ minHeight: 140, padding: 12, outline: "none", fontSize: 15, lineHeight: 1.6, textAlign: "right", direction: "rtl" }}
      />
      {onAttachmentsChange && attachments && attachments.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", borderTop: "1px solid var(--line)" }}>
          {attachments.map((a, i) => (
            <span key={i} className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              📄 {a.name}
              <button type="button" onClick={() => removeAttachment(i)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 12 }}>✕</button>
            </span>
          ))}
        </div>
      )}
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
