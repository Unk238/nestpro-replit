import React from 'react';
import { useLocation } from 'wouter';
import { Building2, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] text-[#172033] p-4 text-center">
      <Card className="max-w-md w-full p-8 space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2F6FED] mx-auto">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#172033]">404 — Page Not Found</h1>
          <p className="text-xs text-[#667085] mt-1.5">
            The page or operational route you are looking for does not exist.
          </p>
        </div>
        <Button onClick={() => navigate('/')} className="btn-primary w-full text-xs font-bold">
          <Home className="h-4 w-4 mr-1.5" /> Return to Dashboard
        </Button>
      </Card>
    </div>
  );
}
