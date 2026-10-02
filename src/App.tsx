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
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Methodology from "./pages/Methodology";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import News from "./pages/News";
import Story from "./pages/Story";
import Tracker from "./pages/Tracker";
import Facility from "./pages/Facility";

// Pages that are not pre-rendered load on demand, so they stay out of the main script. The pre-rendered
// pages (home, news, story, tracker, facility, about, pricing, legal) must stay eager: the server
// renders them synchronously and the browser has to hydrate the same markup.
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Confirm = lazy(() => import("./pages/Confirm"));
const Archive = lazy(() => import("./pages/Archive"));
const Leaders = lazy(() => import("./pages/Leaders"));
const LeaderProfile = lazy(() => import("./pages/LeaderProfile"));
const Intelligence = lazy(() => import("./pages/Intelligence"));
const Insights = lazy(() => import("./pages/Insights"));
const Login = lazy(() => import("./pages/Login"));
const Account = lazy(() => import("./pages/Account"));
const AdminClaims = lazy(() => import("./pages/AdminClaims"));
const AdminPeopleVerification = lazy(() => import("./pages/AdminPeopleVerification"));

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
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
            <Route path="/stats" element={<Stats />} />
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
          </Suspense>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
