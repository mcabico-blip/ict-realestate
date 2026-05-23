"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  propertyId: string;
  initialFavorited?: boolean;
  className?: string;
}

export function FavoriteButton({ propertyId, initialFavorited = false, className }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      window.location.href = "/auth/login";
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    setFavorited((prev) => !prev);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      } else {
        // Revert on error
        setFavorited((prev) => !prev);
      }
    } catch {
      setFavorited((prev) => !prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm",
        loading && "opacity-60",
        className
      )}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          favorited ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"
        )}
      />
    </button>
  );
}
