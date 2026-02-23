import { Shield, ShieldAlert, Gauge, Server } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import SpeedometerGauge from "@/components/SpeedometerGauge";
import StatusIndicator from "@/components/StatusIndicator";
import PageHeader from "@/components/PageHeader";

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Mission Control" description="Real-time overview of your sovereign AI infrastructure" />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Sovereignty Shield */}
        <MetricCard
          title="Sovereignty Shield"
          subtitle="Savings from on-prem"
          value="$450"
          icon={Shield}
          trend={{ value: "12.5%", positive: true }}
          className="[animation-delay:100ms]"
        >
          <p className="text-xs text-muted-foreground">
            <span className="text-success font-medium">$450</span> saved from cloud this month
          </p>
        </MetricCard>

        {/* Privacy Meter */}
        <MetricCard
          title="Privacy Meter"
          subtitle="PII Protection"
          value="14"
          icon={ShieldAlert}
          iconColor="text-warning"
          className="[animation-delay:200ms]"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">SSNs Blocked</span>
              <span className="font-mono text-warning">14</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Emails Redacted</span>
              <span className="font-mono text-warning">47</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Credit Cards</span>
              <span className="font-mono text-warning">3</span>
            </div>
          </div>
        </MetricCard>

        {/* Hardware Heartbeat */}
        <MetricCard
          title="Hardware Heartbeat"
          subtitle="Processing Speed"
          value={<SpeedometerGauge value={45} max={100} label="Tokens Per Second" unit="TPS" />}
          icon={Gauge}
          iconColor="text-primary"
          className="[animation-delay:300ms]"
        />

        {/* System Health */}
        <MetricCard
          title="System Health"
          subtitle="Infrastructure Status"
          value=""
          icon={Server}
          iconColor="text-success"
          className="[animation-delay:400ms]"
        >
          <div className="space-y-2">
            <StatusIndicator label="Vector DB" status="healthy" value="12ms" />
            <StatusIndicator label="API Gateway" status="healthy" value="8ms" />
            <StatusIndicator label="GPU Cluster" status="healthy" value="45°C" />
          </div>
        </MetricCard>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-xl p-5 opacity-0 animate-fade-in [animation-delay:500ms]">
          <h3 className="text-sm font-semibold mb-4">Live Activity Stream</h3>
          <div className="space-y-3">
            {[
              { time: "2 min ago", action: "Query processed", model: "llama3:8b", tokens: "1,247" },
              { time: "5 min ago", action: "Document indexed", model: "nomic-embed", tokens: "8,432" },
              { time: "12 min ago", action: "PII redaction", model: "ner-model", tokens: "156" },
              { time: "18 min ago", action: "Query processed", model: "llama3:8b", tokens: "892" },
              { time: "25 min ago", action: "Model loaded", model: "codellama:13b", tokens: "-" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground font-mono w-20">{item.time}</span>
                  <span className="text-sm">{item.action}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {item.model}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                    {item.tokens} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-xl p-5 opacity-0 animate-fade-in [animation-delay:600ms]">
          <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Run Vector Pipeline", icon: "▶" },
              { label: "Download New Model", icon: "⬇" },
              { label: "Export Audit Log", icon: "📤" },
              { label: "System Diagnostics", icon: "🔍" },
            ].map((action, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-lg bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all text-left group"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm group-hover:text-primary transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
