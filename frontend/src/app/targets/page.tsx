"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Target {
  id?: string | number;
  name?: string;
  server_status?: boolean;
  description?: string;
  server_tag?: string;
  server_alias?: string;
  server_path?: string;
  server_port?: string | number;
  server_role?: string;
}

export default function Home() {
  const [isLogin, setIsLogin] = useState(false);
  const [targetList, setTargetList] = useState<Target[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLogin(false);
      } else {
        setIsLogin(true);
      }
    }
  }, [router]);

  useEffect(() => {
    if (isLogin) {
      fetch("http://localhost:8000/targets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setTargetList(data))
        .catch((err) => console.error(err));
    }
  }, [isLogin]);

  // Card display for targets
  const renderTargetCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full mt-8">
      {targetList.map((target, idx) => (
        <div
          key={target.id || idx}
          className="dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-2xl p-6 flex flex-col items-start border border-purple-300 dark:border-purple-700 hover:scale-105 transition-transform duration-200"
        >
          <div className="flex items-center mb-4 w-full">
            {/* Use Next.js Image if available, else fallback to Font Awesome */}
            <span className="mr-3 text-2xl text-blue-700 dark:text-blue-300">
              <i className="fas fa-server" aria-label="Server Icon"></i>
            </span>
            <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700">
              {target.name || "Unnamed Target"}
            </h3>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold
              ${target.server_status ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}
            `}>
              {target.server_status ? "Online" : "Offline"}
            </span>
          </div>
          <p className="mb-3 text-gray-700 dark:text-gray-300 italic">{target.description || "No description"}</p>
          <div className="grid grid-cols-2 gap-2 w-full mb-2">
            <div className="text-sm text-gray-700 dark:text-gray-200">
              <strong>Tag:</strong> {target.server_tag}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-200">
              <strong>Alias:</strong> {target.server_alias}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-200">
              <strong>Path:</strong> <span className="font-mono">{target.server_path}</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-200">
              <strong>Port:</strong> <span className="font-mono">{target.server_port}</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-200 col-span-2">
              <strong>Role:</strong> <span className="px-2 py-1 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100">{target.server_role}</span>
            </div>
          </div>
          <button
            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:scale-105 transition-transform font-semibold"
            onClick={() => alert(`Manage server: ${target.name}`)}
          >
            Manage
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {!isLogin ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
          <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-2xl p-10 flex flex-col items-center">
            <Image
              src="/next.svg"
              alt="Access Denied"
              width={64}
              height={64}
              className="mb-6 animate-bounce"
            />
            <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700">
              Invalid Access
            </h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300 text-center">
              You need to log in to continue. Please return to the login page.
            </p>
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:scale-105 transition-transform font-semibold"
              onClick={() => router.replace("/login")}
            >
              Back to Login
            </button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-12 relative">
          {/* Animated Logout Button */}
          <button
            className="fixed top-8 right-8 z-50 px-7 py-3 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform font-bold ring-2 ring-pink-400 hover:ring-purple-500 animate-pulse"
            onClick={async () => {
              const token = localStorage.getItem("access_token");
              if (!token) return;
              try {
                await fetch("http://localhost:8000/auth/jwt/logout", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ token }),
                });
                localStorage.removeItem("access_token");
                setIsLogin(false);
                router.replace("/login");
              } catch (err) {
                // handle error if needed
              }
            }}
          >
            <span className="mr-2">
              <i className="fas fa-sign-out-alt"></i>
            </span>
            Logout
          </button>

          {/* Fancy Header */}
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 drop-shadow-lg animate-fade-in">
              Targets Dashboard
            </h1>
            <span className="px-4 py-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-purple-900 rounded-full font-semibold shadow-md animate-bounce">
              {targetList.length} Active
            </span>
          </div>

          {/* Targets List or Empty State */}
          {targetList.length > 0 ? (
            <div className="relative animate-fade-in-up">
              <div className="fixed inset-0 -z-10 pointer-events-none w-screen h-screen">
                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 opacity-60 blur-lg"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300 opacity-30 rounded-full blur-2xl"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-300 opacity-30 rounded-full blur-2xl"></div>
                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-400 opacity-20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              {renderTargetCards()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-16 animate-fade-in">
              <Image
                src="/empty-box.svg"
                alt="No targets"
                width={80}
                height={80}
                className="mb-6 opacity-80"
              />
              <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-2">
                No targets found.
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Try adding a new target or check your connection.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
