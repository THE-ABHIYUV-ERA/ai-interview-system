"use client";
import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

function GithubCallbackContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const code = searchParams.get("code");
  const called = React.useRef(false);

  useEffect(() => {
    if (code && !called.current) {
      called.current = true;
      api.post("/auth/github/", { code })
        .then(res => {
          login(res.data.access, res.data.refresh, res.data.user);
        })
        .catch(err => {
          console.error(err);
          window.location.href = "/login?error=GithubAuthFailed";
        });
    }
  }, [code, login]);

  return <div className="p-8 text-center">Authenticating with GitHub...</div>;
}

export default function GithubCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GithubCallbackContent />
    </Suspense>
  );
}
