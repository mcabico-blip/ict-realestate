"use client";

import { useState } from "react";
import { Share2, Check, Copy, MessageCircle, ExternalLink } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-40 bg-white border border-gray-100 rounded-2xl shadow-lg p-3 min-w-[200px]">
            <p className="text-xs text-gray-400 font-semibold px-2 mb-2">Share via</p>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-blue-600" />
              Facebook
            </a>

            <a
              href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-green-50 text-sm text-gray-700 hover:text-green-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp
            </a>

            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Link copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
