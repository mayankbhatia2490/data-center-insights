import { Linkedin, Twitter, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url: string;
  title: string;
}

const ShareButtons = ({ url, title }: ShareButtonsProps) => {
  const { toast } = useToast();

  const share = (platform: string) => {
    const encoded = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, "_blank");
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Article link copied to clipboard." });
    }
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      <button
        onClick={() => share("linkedin")}
        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin size={13} />
      </button>
      <button
        onClick={() => share("twitter")}
        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Share on X"
      >
        <Twitter size={13} />
      </button>
      <button
        onClick={() => share("copy")}
        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Copy link"
      >
        <Link2 size={13} />
      </button>
    </div>
  );
};

export default ShareButtons;
