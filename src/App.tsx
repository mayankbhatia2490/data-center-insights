import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import Archive from "./pages/Archive";
import Leaders from "./pages/Leaders";
import LeaderProfile from "./pages/LeaderProfile";
import Stats from "./pages/Stats";
import Intelligence from "./pages/Intelligence";
import Insights from "./pages/Insights";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/leaders" element={<Leaders />} />
            <Route path="/leaders/:id" element={<LeaderProfile />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/account" element={<Account />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
