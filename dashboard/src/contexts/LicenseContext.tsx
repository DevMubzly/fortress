import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = "http://localhost:8000/api";

type LicenseStatus = "active" | "expiring" | "expired" | "invalid" | "none" | "error";

interface LicenseData {
    status: LicenseStatus;
    type: string;
    organization: string;
    issuedDate: string | null;
    expiryDate: string;
    daysRemaining: number;
    maxUsers: number;
    activeUsers: number;
    features: string[];
}

interface LicenseContextType {
    license: LicenseData | null;
    isLoading: boolean;
    refreshLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
    const [license, setLicense] = useState<LicenseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLicense = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE}/system/license`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === "none" || data.status === "error") {
                    setLicense(null); // Or keep basic info if available even if error?
                } else {
                    setLicense({
                        status: data.status,
                        type: data.tier.charAt(0).toUpperCase() + data.tier.slice(1),
                        organization: data.organization,
                        issuedDate: data.issued_at,
                        expiryDate: data.expires_at,
                        daysRemaining: data.days_remaining,
                        maxUsers: data.max_users,
                        activeUsers: data.active_users,
                        features: data.features
                    });
                }
            } else {
                setLicense(null);
            }
        } catch (error) {
            console.error("Failed to fetch license:", error);
            setLicense(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch initially
        fetchLicense();

        // Optional: Poll or listen for events? Polling every 5 mins for now?
        const interval = setInterval(fetchLicense, 300000); 
        return () => clearInterval(interval);
    }, []);

    const refreshLicense = async () => {
        await fetchLicense();
    };

    return (
        <LicenseContext.Provider value={{ license, isLoading, refreshLicense }}>
            {children}
        </LicenseContext.Provider>
    );
}

export function useLicense() {
    const context = useContext(LicenseContext);
    if (context === undefined) {
        throw new Error("useLicense must be used within a LicenseProvider");
    }
    return context;
}
