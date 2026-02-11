import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormButton } from "../Modal";

export default function NoteForm({ childId, onDone, onClose }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.createNote({ child: childId, note: note.trim() });
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Note" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
            }}
          />
        </FormField>
        <FormButton color="#EC4899" disabled={saving || !note.trim()}>
          {saving ? "Saving..." : "Save Note"}
        </FormButton>
      </form>
    </Modal>
  );
}
