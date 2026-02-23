import { useLocation } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

const pageInfo: Record<string, { title: string; description: string }> = {
  "/activity": { title: "Live Activity", description: "Real-time monitoring of all system operations" },
  "/documents": { title: "Document Vault", description: "Secure storage for enterprise knowledge" },
  "/pipeline": { title: "Vector Pipeline", description: "Monitor embedding and indexing status" },
  "/models": { title: "Model Hub", description: "Browse and manage AI models" },
  "/gpu": { title: "GPU Monitor", description: "Hardware performance and utilization" },
  "/audit": { title: "Audit Logs", description: "Complete activity trail for compliance" },
  "/access": { title: "Access Control", description: "LDAP and permission management" },
  "/alerts": { title: "Compliance Alerts", description: "Security and policy notifications" },
};

const PlaceholderPage = () => {
  const location = useLocation();
  const info = pageInfo[location.pathname] || { title: "Page", description: "Coming soon" };

  return (
    <div className="space-y-6">
      <PageHeader title={info.title} description={info.description} />

      {/* Placeholder Content */}
      <div className="glass rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">Under Construction</h2>
        <p className="text-muted-foreground max-w-md">
          This section is being built. Check back soon for full functionality.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
