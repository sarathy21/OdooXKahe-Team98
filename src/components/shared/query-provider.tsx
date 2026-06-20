"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SyncService } from "@/lib/sync/sync-service";
import { migrateLegacyLocalStorage } from "@/lib/erp/migration";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    // 1. Run legacy mock localStorage data migration
    migrateLegacyLocalStorage();
    
    // 2. Start background synchronizer
    SyncService.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}