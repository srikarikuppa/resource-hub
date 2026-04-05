import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ResourceProvider } from "@/lib/resource-context";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import ResourceDetail from "./pages/ResourceDetail";
import Upload from "./pages/Upload";
import Saved from "./pages/Saved";
import Channels from "./pages/Channels";
import ChannelChat from "./pages/ChannelChat";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
              <Route path="/channels/:id" element={<ChannelChat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
        </ResourceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
