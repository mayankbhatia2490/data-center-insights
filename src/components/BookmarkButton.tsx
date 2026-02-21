import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

const BOOKMARKS_KEY = "dcp-bookmarks";

export const getBookmarks = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
};

const BookmarkButton = ({ articleId }: { articleId: string }) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getBookmarks().includes(articleId));
  }, [articleId]);

  const toggle = () => {
    const bookmarks = getBookmarks();
    const next = saved
      ? bookmarks.filter((id) => id !== articleId)
      : [...bookmarks, articleId];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    setSaved(!saved);
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); toggle(); }}
      className={`p-1.5 transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
      aria-label={saved ? "Remove bookmark" : "Bookmark article"}
    >
      <Bookmark size={13} fill={saved ? "currentColor" : "none"} />
    </button>
  );
};

export default BookmarkButton;
