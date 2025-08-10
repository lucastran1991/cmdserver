"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function AuthButton() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome!</p>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return <a href="/login">Login</a>;
}