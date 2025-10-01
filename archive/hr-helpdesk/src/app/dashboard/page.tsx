
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard/ai-assistant');
  }, [router]);

  return <div>Redirecting...</div>;
}
