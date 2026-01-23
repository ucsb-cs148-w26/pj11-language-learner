"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <main style={{ padding: 24 }}>
      <button onClick={() => signIn("google")}>
        Continue with Google
      </button>
    </main>
  );
}
