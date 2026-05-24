"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileText, X } from "lucide-react";

const SUGGESTED_TYPES = [
  "Reservation Agreement",
  "Contract to Sell",
  "Deed of Absolute Sale",
  "Transfer Certificate of Title (TCT)",
  "Tax Declaration",
  "Real Property Tax Receipt",
  "BIR Certificate Authorizing Registration (CAR)",
  "Buyer Valid ID",
  "Seller Valid ID",
  "Marriage Certificate",
  "Notarized Special Power of Attorney",
  "Other",
];

export function DocumentUploader({ engagementId }: { engagementId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState("Deed of Absolute Sale");
  const [customType, setCustomType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDocumentType("Deed of Absolute Sale");
    setCustomType("");
    setFile(null);
    setNotes("");
    setError(null);
    setOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    setError(null);
    const finalType = documentType === "Other" ? customType.trim() : documentType;
    if (!finalType) {
      setError("Please enter a document type.");
      return;
    }
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", finalType);
      if (notes.trim()) fd.append("notes", notes.trim());
      const res = await fetch(`/api/engagements/${engagementId}/documents`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <Upload className="h-4 w-4" />
        Upload Document
      </button>
    );
  }

  return (
    <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900">Upload Contract Document</h3>
        <button
          onClick={reset}
          className="p-1 hover:bg-gray-100 rounded-lg"
          aria-label="Cancel"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {SUGGESTED_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {documentType === "Other" && (
          <input
            type="text"
            placeholder="Enter custom document type"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">File (PDF or image, max 10 MB)</label>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
        {file && (
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g., Awaiting buyer signature on page 3"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={reset}
          disabled={uploading}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Upload
        </button>
      </div>
    </div>
  );
}
