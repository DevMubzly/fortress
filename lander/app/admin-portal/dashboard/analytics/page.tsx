"use client";

import { FileKey, Users, TrendingUp, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

// Skeleton loader
const GlobalAnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-6 w-40 mb-2" />
      <Skeleton className="h-4 w-72" />
    </div>
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 text-center">
          <Skeleton className="h-3 w-24 mx-auto mb-2" />
          <Skeleton className="h-10 w-16 mx-auto" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Skeleton className="h-24 w-24 rounded-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export default function GlobalAnalyticsPage() {
  const [isLoading] = useState(false);
  
  const metrics = {
    totalLicensesIssued: 47,
    activeOrganizations: 32,
    totalUsers: 2840,
    conversionRate: 68,
    trialToPayingConversion: 42,
    avgUsersPerOrg: 89,
    regionsActive: 5,
  };

  const topCountries = [
    { name: 'Uganda', orgs: 12, users: 890 },
    { name: 'Kenya', orgs: 8, users: 650 },
    { name: 'Tanzania', orgs: 5, users: 420 },
    { name: 'Rwanda', orgs: 4, users: 380 },
    { name: 'Ethiopia', orgs: 3, users: 500 },
  ];

  if (isLoading) {
    return <GlobalAnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Global Analytics</h2>
        <p className="text-gray-500">Overview of license distribution and platform adoption</p>
      </div>

      {/* Key Metrics - no backgrounds/borders, centered */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <div className="p-4 text-center border-r last:border-0 border-gray-100">
          <FileKey className="w-6 h-6 mx-auto mb-3 text-blue-500" />
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Licenses Issued</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalLicensesIssued}</p>
        </div>
        <div className="p-4 text-center border-r last:border-0 border-gray-100">
          <Globe className="w-6 h-6 mx-auto mb-3 text-green-500" />
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Active Organizations</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.activeOrganizations}</p>
        </div>
        <div className="p-4 text-center border-r last:border-0 border-gray-100">
          <Users className="w-6 h-6 mx-auto mb-3 text-purple-500" />
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
        </div>
        <div className="p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-3 text-yellow-500" />
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Conversion Rate</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.conversionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Trial → Paying</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
            <CardDescription>Active organizations by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topCountries.map((country) => (
                <div key={country.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-xs text-gray-600">
                        {country.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{country.name}</p>
                      <p className="text-xs text-gray-500">{country.orgs} Organizations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(country.users / 1000) * 100}%` }}></div>
                     </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">{country.users} users</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Other stats */}
        <Card className="border-gray-100 shadow-sm">
             <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>System usage indicators</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Avg Users / Organization</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics.avgUsersPerOrg}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Trial Retention</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics.trialToPayingConversion}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                         <p className="text-sm text-gray-500 mb-1">Active Regions</p>
                         <p className="text-2xl font-bold text-gray-900">{metrics.regionsActive}</p>
                    </div>
                </div>
             </CardContent>
        </Card>
      </div>
    </div>
  );
}
