import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const linkClass = "hover:text-foreground transition-colors no-underline text-muted-foreground";

const SiteFooter = () => (
  <footer className="border-t border-border bg-card">
    <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Data Center Pulse</span>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <Link to="/news" className={linkClass}>News</Link>
        <Link to="/data" className={linkClass}>Data Center Tracker</Link>
        <Link to="/archive" className={linkClass}>Briefing Archive</Link>
        <Link to="/leaders" className={linkClass}>Industry Leaders</Link>
        <Link to="/stats" className={linkClass}>Statistics</Link>
        <Link to="/about" className={linkClass}>About</Link>
        <Link to="/about/methodology" className={linkClass}>Methodology</Link>
        <Link to="/privacy" className={linkClass}>Privacy</Link>
        <Link to="/terms" className={linkClass}>Terms</Link>
        <Link to="/contact" className={linkClass}>Contact</Link>
      </nav>
      <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Data Center Pulse</span>
    </div>
  </footer>
);

export default SiteFooter;
