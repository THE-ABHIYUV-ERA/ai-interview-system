"use client";
import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const code = searchParams.get("code");
  const called = React.useRef(false);

  useEffect(() => {
    if (code && !called.current) {
      called.current = true;
      api.post("/auth/google/", { code })
        .then(res => {
          login(res.data.access, res.data.refresh, res.data.user);
        })
        .catch(err => {
          console.error(err);
          window.location.href = "/login?error=GoogleAuthFailed";
        });
    }
  }, [code, login]);

  return <div className="p-8 text-center">Authenticating with Google...</div>;
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
