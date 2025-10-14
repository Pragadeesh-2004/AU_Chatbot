"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    const role = params.get("role");
    const id = params.get("id");
    const code = params.get("code");
    if (!role || !id || !code) {
      setStatus("invalid");
      setError("Invalid verification link.");
      return;
    }
    fetch(`${API_BASE}/authentication/verify-code?role=${role}&id=${id}&code=${code}`)
      .then(async res => {
        if (res.ok) {
          setStatus("valid");
          // Wait 1s, then redirect to password page with token
          setTimeout(() => {
            const token = btoa(`${role}:${id}`);
            router.replace(`/modules/authentication/signup?step=3&token=${token}`);
          }, 1000);
        } else {
          const data = await res.json();
          setStatus("invalid");
          setError(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("invalid");
        setError("Verification failed.");
      });
  }, [params, router]);

  if (status === "checking") return <div className="p-8 text-center">Verifying...</div>;
  if (status === "invalid") return <div className="p-8 text-center text-red-600">{error}</div>;
  return <div className="p-8 text-center text-green-600">Verification successful! Redirecting...</div>;
}