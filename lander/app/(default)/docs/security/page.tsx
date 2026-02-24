import { DocsPage } from "@/components/docs/DocsPage";

export const metadata = {
  title: "Security Protocols - Fortress AI Documentation",
  description: "Advanced security measures implemented in Fortress AI.",
};

export default function SecurityPage() {
  const toc = [
    { id: "encryption", title: "Encryption Standards" },
    { id: "network-security", title: "Network Security" },
    { id: "pii-redaction", title: "PII Redaction" },
    { id: "container-hardening", title: "Container Hardening" },
  ];

  return (
    <DocsPage 
      title="Security Protocols" 
      description="Protecting your data and models at every layer."
      toc={toc}
    >
      <h2 id="encryption" className="scroll-mt-24">Encryption Standards</h2>
      <p>
        Data security is paramount. Fortress employs industry-standard encryption practices to ensure your data remains confidential.
      </p>

      <div className="grid md:grid-cols-2 gap-6 my-8 not-prose">
         <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">At Rest (AES-256)</h3>
          <p className="text-muted-foreground text-sm">
             All persistent data, including vector databases, model weights, and logs, are encrypted on disk using AES-256.
          </p>
        </div>
        <div className="p-6 border rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">In Transit (TLS 1.3)</h3>
          <p className="text-muted-foreground text-sm">
             All communication between components and client applications is secured via TLS 1.3, ensuring end-to-end encryption.
          </p>
        </div>
      </div>

      <h2 id="network-security" className="scroll-mt-24">Network Security</h2>
      <p>
        Fortress is designed to operate in isolate networks (air-gapped).
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Zero Egress:</strong> The platform does not require internet access to function once installed.</li>
        <li><strong>VPC Support:</strong> Deploy within your AWS VPC, Azure VNet, or Google VPC with private subnets.</li>
        <li><strong>Firewall Rules:</strong> Strict ingress rules allow traffic only on port 443 (HTTPS) and 80 (HTTP redirect).</li>
      </ul>

      <h2 id="pii-redaction" className="scroll-mt-24">PII Redaction</h2>
      <p>
        Prevent sensitive data from leaking into model prompts or logs. Fortress includes a built-in PII (Personally Identifiable Information) scrubber powered by Microsoft Presidio.
      </p>
      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md font-mono text-sm not-prose my-4 border">
        <span className="text-muted-foreground">// Input:</span> "Contact John Doe at 555-0199"<br/>
        <span className="text-green-600">// Output:</span> "Contact &lt;PERSON&gt; at &lt;PHONE_NUMBER&gt;"
      </div>

      <h2 id="container-hardening" className="scroll-mt-24">Container Hardening</h2>
      <p>
        Our Docker containers are built on minimal base images (Alpine/Distroless) to reduce the attack surface. They run as non-root users by default and follow CIS benchmarks.
      </p>
    </DocsPage>
  );
}
