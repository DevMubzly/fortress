import { DocsPage } from "@/components/docs/DocsPage";

export const metadata = {
  title: "Administration - Fortress AI Documentation",
  description: "Managing users, roles, and settings in Fortress AI.",
};

export default function AdministrationPage() {
  const toc = [
    { id: "users-roles", title: "Users & Roles" },
    { id: "api-keys", title: "API Key Management" },
    { id: "sso-config", title: "SSO Configuration" },
    { id: "model-management", title: "Model Management" },
  ];

  return (
    <DocsPage 
      title="Administration" 
      description="Manage your organization's AI infrastructure, users, and security policies."
      toc={toc}
    >
      <h2 id="users-roles" className="scroll-mt-24">Users & Roles</h2>
      <p>
        Fortress uses a Role-Based Access Control (RBAC) system to ensure granular security. Admins can assign users to predefined roles or create custom permission sets.
      </p>

      <div className="grid md:grid-cols-3 gap-6 my-8 not-prose">
        <div className="p-6 border rounded-xl bg-slate-50 dark:bg-slate-900">
          <h3 className="font-semibold text-lg mb-2 text-blue-600">Administrator</h3>
          <p className="text-muted-foreground text-sm">
             Full access to all settings, user management, audit logs, and system configuration.
          </p>
        </div>
        <div className="p-6 border rounded-xl bg-slate-50 dark:bg-slate-900">
          <h3 className="font-semibold text-lg mb-2 text-green-600">Developer</h3>
          <p className="text-muted-foreground text-sm">
            Can create API keys, deploy new models, and access the Playground. No access to user management.
          </p>
        </div>
        <div className="p-6 border rounded-xl bg-slate-50 dark:bg-slate-900">
          <h3 className="font-semibold text-lg mb-2 text-purple-600">Viewer</h3>
          <p className="text-muted-foreground text-sm">
            Read-only access to chat interfaces and shared knowledge bases. Cannot modify settings.
          </p>
        </div>
      </div>

      <h2 id="api-keys" className="scroll-mt-24">API Key Management</h2>
      <p>
        API keys are scoped to specific projects or users. As an administrator, you can revoke keys, set usage limits, and monitor consumption in real-time.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Create keys with expiration dates.</li>
        <li>Limit requests per minute (rate limiting).</li>
        <li>View last used timestamps for security audits.</li>
      </ul>

      <h2 id="sso-config" className="scroll-mt-24">SSO Configuration</h2>
      <p>
        Fortress supports SAML 2.0 and OIDC for Single Sign-On. We integrate seamlessly with:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Okta</li>
        <li>Azure Active Directory</li>
        <li>Google Workspace</li>
        <li>Keycloak</li>
      </ul>

      <h2 id="model-management" className="scroll-mt-24">Model Management</h2>
      <p>
        Admins can pull new models from Ollama or Hugging Face directly through the dashboard. You can also configure default system prompts and temperature settings for each model.
      </p>
    </DocsPage>
  );
}
