"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import FriendRequests from "@/components/friends/requests";

export default function RequestsPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setUserId(null);
        return;
      }
      setUserId(data.user?.id ?? null);
    });
  }, []);

  if (!userId) {
    return (
      <div className="mx-auto w-full p-6 text-gray-text">
        <p className="text-sm text-gray-muted">Please sign in to view requests.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full p-6 text-gray-text">
      <FriendRequests userId={userId} />
    </div>
  );
}