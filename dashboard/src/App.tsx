import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LoginPage from "./pages/auth/LoginPage";
import OverviewPage from "./pages/dashboard/OverviewPage";
import AuditLogsPage from "./pages/dashboard/AuditLogsPage";
import IdentityAccessPage from "./pages/dashboard/IdentityAccessPage";
import SystemHealthPage from "./pages/dashboard/SystemHealthPage";
import ModelHubPage from "./pages/dashboard/ModelHubPage";
import ApiKeysPage from "./pages/dashboard/ApiKeysPage";
import MonitoringAnalyticsPage from "./pages/dashboard/MonitoringAnalyticsPage";
import ChatPage from "./pages/dashboard/ChatPage";
import PromptLibraryPage from "./pages/dashboard/PromptLibraryPage";
import PersonalRAGPage from "./pages/dashboard/PersonalRAGPage";
import SupportPage from "./pages/dashboard/SupportPage";
import DocumentationPage from "./pages/dashboard/DocumentationPage";
import ReleaseNotesPage from "./pages/dashboard/ReleaseNotesPage";
import AboutPage from "./pages/dashboard/AboutPage";
import MainLayout from "./layouts/MainLayout";
import NotFound from "./pages/NotFound";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DownloadProvider } from "@/contexts/DownloadContext";
import { LicenseProvider } from "@/contexts/LicenseContext";
import { AuthProvider } from "@/contexts/AuthContext";


const queryClient = new QueryClient();

const App = () => (
  <LicenseProvider>
  <DownloadProvider>
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes with Main Layout */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<OverviewPage />} />
                <Route path="/monitoring" element={<MonitoringAnalyticsPage />} />
                <Route path="/model-hub" element={<ModelHubPage />} />
                <Route path="/apikeys" element={<ApiKeysPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/identity-access" element={<IdentityAccessPage />} />
                <Route path="/system-health" element={<SystemHealthPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/prompt-library" element={<PromptLibraryPage />} />
                <Route path="/personal-rag" element={<PersonalRAGPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/documentation" element={<DocumentationPage />} />
                <Route path="/release-notes" element={<ReleaseNotesPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Route>
  
              <Route path="*" element={<NotFound />} />
              </Routes>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </NotificationProvider>
  </DownloadProvider>
  </LicenseProvider>
);

export default App;
