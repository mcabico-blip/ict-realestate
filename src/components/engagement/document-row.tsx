"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Trash2, Loader2 } from "lucide-react";

export function DocumentRow({
  id,
  documentType,
  fileName,
  fileSize,
  notes,
  uploadedBy,
  uploadedAt,
  canDelete,
}: {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  notes: string | null;
  uploadedBy: { name: string | null; role: string };
  uploadedAt: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove "${fileName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900">{documentType}</p>
        <p className="text-xs text-gray-500 truncate">{fileName}</p>
        {notes && <p className="text-xs text-gray-600 mt-1">📝 {notes}</p>}
        <p className="text-[11px] text-gray-400 mt-1">
          {uploadedBy.name} · {(fileSize / 1024).toFixed(0)} KB ·{" "}
          {new Date(uploadedAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={`/api/contracts/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-purple-600 transition-colors"
          title="View / Download"
        >
          <Download className="h-4 w-4" />
        </a>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
