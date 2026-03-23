import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ResourceProvider } from "@/lib/resource-context";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import ResourceDetail from "./pages/ResourceDetail";
import Upload from "./pages/Upload";
import Saved from "./pages/Saved";
import Channels from "./pages/Channels";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ResourceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/resource/:id" element={<ResourceDetail />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/channels" element={<Channels />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </ResourceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
