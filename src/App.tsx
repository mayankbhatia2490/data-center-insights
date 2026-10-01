import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import Confirm from "./pages/Confirm";
import Archive from "./pages/Archive";
import Leaders from "./pages/Leaders";
import LeaderProfile from "./pages/LeaderProfile";
import Intelligence from "./pages/Intelligence";
import Insights from "./pages/Insights";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";
import AdminClaims from "./pages/AdminClaims";
import AdminPeopleVerification from "./pages/AdminPeopleVerification";
import About from "./pages/About";
import Methodology from "./pages/Methodology";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import News from "./pages/News";
import Story from "./pages/Story";
import Tracker from "./pages/Tracker";
import Facility from "./pages/Facility";

// Stats pulls in Leaflet, which touches `window` at import time, so it loads only in the browser.
const Stats = lazy(() => import("./pages/Stats"));

// The router is injectable so the pre-render script can use StaticRouter.
type RouterComponent = ComponentType<{ children?: ReactNode }>;

const App = ({ Router = BrowserRouter, queryClient }: { Router?: RouterComponent; queryClient: QueryClient }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Analytics />
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<Story />} />
            <Route path="/data" element={<Tracker />} />
            <Route path="/data/facilities/:country/:slug" element={<Facility />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/confirm" element={<Confirm />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/leaders" element={<Leaders />} />
            <Route path="/leaders/:id" element={<LeaderProfile />} />
            <Route path="/stats" element={<Suspense fallback={null}><Stats /></Suspense>} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/claims" element={<AdminClaims />} />
            <Route path="/admin/people-verification" element={<AdminPeopleVerification />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/methodology" element={<Methodology />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
