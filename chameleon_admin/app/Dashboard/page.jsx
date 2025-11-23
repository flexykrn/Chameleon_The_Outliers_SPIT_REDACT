"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase"; // adjust path if needed

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"; // if you have a spinner component; otherwise fallback
import { toast } from "sonner"; // ensure Toaster is in layout
import KPICard from "./Components/kpiCards";
import {
  Shield,
  AlertTriangle,
  Activity,
  Globe,
  X,
  ShieldAlert,
} from "lucide-react";
import ChartRadarAttack from "./Components/RadarCharts";
import ChartLineAttacks from "./Components/LineChart";
import dynamic from "next/dynamic";
import SecurityLogsTable from "./Components/LogBox";

const MapZone = dynamic(() => import("./Components/Map"), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true); // initial auth loading
  const [adminLoading, setAdminLoading] = useState(false); // for fetching admin doc
  const [admin, setAdmin] = useState(null); // admin doc data
  const [uid, setUid] = useState(null);

  // UI states
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // listen for auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoadingAuth(false);
        router.push("/admin/signin"); // redirect to admin sign-in, adjust route
        return;
      }
      setUid(user.uid);
      setLoadingAuth(false);

      // fetch admin doc
      setAdminLoading(true);
      try {
        const dref = doc(db, "admin", user.uid);
        const snap = await getDoc(dref);
        if (snap.exists()) {
          setAdmin(snap.data());
        } else {
          // If no admin doc, sign out and redirect
          await signOut(auth);
          router.push("/admin/signin");
          toast.error("Not authorized as admin.");
        }
      } catch (err) {
        console.error("Failed fetching admin:", err);
        toast.error("Failed to load admin profile.");
      } finally {
        setAdminLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  // Close popover when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [popoverOpen]);

  // Derived values
  const displayName =
    admin?.Name ||
    `${admin?.firstName || ""} ${admin?.lastName || ""}`.trim() ||
    "";
  const initials = (() => {
    if (!displayName) return "";
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  // Logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
      toast.success("Logged out");
      router.push("../Authentication/signin");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to logout");
      setLogoutLoading(false);
    }
  };

  // Save Reports placeholder
  const handleSaveReports = async () => {
    setReportLoading(true);
    try {
      // TODO: replace with actual report generation API call
      // await fetch("/api/admin/generate-report", { method: "POST", body: ... })
      await new Promise((r) => setTimeout(r, 1200));
      toast.success("Report saved to Reports folder (demo)");
    } catch (err) {
      console.error("Report error:", err);
      toast.error("Failed to save report");
    } finally {
      setReportLoading(false);
    }
  };

  // loading skeleton
  if (loadingAuth || adminLoading) {
    return (
      <div className="min-h-screen bg-background px-8 py-4 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <Logo />
          </div>
          <div className="flex items-center gap-2 justify-center">
            <svg
              className="animate-spin h-6 w-6 text-primary"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
            <div className="text-muted-foreground">Loading admin...</div>
          </div>
        </div>
      </div>
    );
  }

  // main UI
  return (
    <div className="min-h-screen bg-background px-8 py-4">
      <header className="flex items-center justify-between w-full">
        {/* LEFT — Logo */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* RIGHT — Save Reports + Admin Avatar */}
        <div className="flex items-center gap-6">
          {/* Save Reports */}
          <Button
            variant="outline"
            onClick={handleSaveReports}
            disabled={reportLoading}
          >
            {reportLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Reports"
            )}
          </Button>

          {/* Admin Name + Initials Popover */}
          <div className="relative" ref={popoverRef}>
            <div className="flex items-center gap-3">
              <div className="text-right mr-1">
                <div className="text-sm font-medium text-foreground">
                  {displayName || "Admin"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Administrator
                </div>
              </div>

              <button
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold"
                onClick={() => setPopoverOpen((s) => !s)}
                aria-expanded={popoverOpen}
              >
                {initials || "AD"}
              </button>
            </div>

            {popoverOpen && (
              <div className="absolute right-0 mt-3 w-44 bg-card border border-border rounded-lg shadow-md z-30">
                <div className="p-3">
                  <button
                    className="w-full text-left px-3 py-2 rounded hover:bg-secondary/30"
                    onClick={() => {
                      router.push("/admin/profile");
                      setPopoverOpen(false);
                    }}
                  >
                    Profile
                  </button>

                  <hr className="my-2" />

                  <button
                    className="w-full text-left px-3 py-2 rounded text-destructive hover:bg-secondary/30 flex items-center justify-between"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                  >
                    {logoutLoading ? "Signing out..." : "Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mt-8">
        {/* Insert dashboard content here */}
        <div className="max-w-7xl  mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Threats"
              value="247"
              icon={AlertTriangle}
              trend={{ value: 12, isPositive: false }}
            />
            <KPICard
              title="Average Confidence"
              value={"92" + "%"}
              icon={Activity}
              trend={{ value: 8, isPositive: true }}
            />
            <KPICard
              title="XSS Attack"
              value="50"
              icon={X}
              trend={{ value: 5, isPositive: true }}
            />
            <KPICard
              title="SQI Attack"
              value="42"
              icon={ShieldAlert}
              trend={{ value: 3, isPositive: true }}
            />
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartRadarAttack
              dataCounts={{ benign: 120, xss: 50, sqli: 42, bruteforce: 7 }}
              title="Attacks (last 24h)"
            />

            <ChartLineAttacks
              events={[
                {
                  id: "1",
                  type: "xss",
                  timestamp: "November 23, 2025 at 5:25:01\u202FAM UTC+5:30",
                },
                {
                  id: "2",
                  type: "sqli",
                  timestamp: "November 23, 2025 at 6:03:55\u202FAM UTC+5:30",
                },
                // ...
              ]}
              title="Attacks (12h)"
            />
            <MapZone
              zones={[
                {
                  id: 1,
                  lat: 19.076,
                  lng: 72.8777,
                  radius: 800,
                  color: "rgba(240,196,25,0.95)", // yellow accent
                  popup: "Mumbai Zone",
                },
                {
                  id: 2,
                  lat: 12.9716,
                  lng: 77.5946,
                  radius: 1000,
                  color: "rgba(15,138,87,0.9)", // your green primary
                  popup: "Bangalore Zone",
                },
              ]}
              mapHeight="480px"
            />
          </div>
          <div className="mt-8">
 <SecurityLogsTable logs={myLogsFromFirestore} />
          </div>
         
        </div>
      </main>
    </div>
  );
}

const dummyLogs = [
  {
    id: "log1",
    sessionId: "SID-a82jf9asf9823jh2",
    input: "<script>alert(1)</script>",
    time: "November 23, 2025 at 5:25:01 AM UTC+5:30",
    ip: "192.168.1.45",
    city: "Mumbai",
    country: "India",
    classification: "xss",
  },
  {
    id: "log2",
    sessionId: "SID-98asdh98h12h8912",
    input: "' OR 1=1 --",
    time: "November 23, 2025 at 4:55:42 AM UTC+5:30",
    ip: "103.44.22.10",
    city: "Delhi",
    country: "India",
    classification: "sqli",
  },
  {
    id: "log3",
    sessionId: "SID-1j2h3jh12hj3h123",
    input: "admin' OR 'a'='a",
    time: "November 23, 2025 at 4:30:12 AM UTC+5:30",
    ip: "45.122.88.210",
    city: "Bengaluru",
    country: "India",
    classification: "sqli",
  },
  {
    id: "log4",
    sessionId: "SID-12398123nasd98123",
    input: "password=123456",
    time: "November 23, 2025 at 4:10:59 AM UTC+5:30",
    ip: "152.57.69.12",
    city: "Pune",
    country: "India",
    classification: "bruteforce",
  },
  {
    id: "log5",
    sessionId: "SID-asd8123u12b3u12b",
    input: "<img src=x onerror=alert('xss')>",
    time: "November 23, 2025 at 3:55:17 AM UTC+5:30",
    ip: "122.177.33.90",
    city: "Kolkata",
    country: "India",
    classification: "xss",
  },
  {
    id: "log6",
    sessionId: "SID-n12b3n12b3n1b23",
    input: "normal_login_attempt",
    time: "November 23, 2025 at 3:40:02 AM UTC+5:30",
    ip: "49.207.18.205",
    city: "Chennai",
    country: "India",
    classification: "benign",
  },
  {
    id: "log7",
    sessionId: "SID-b123b123b123b123",
    input: "'; DROP TABLE users; --",
    time: "November 23, 2025 at 3:10:30 AM UTC+5:30",
    ip: "185.199.110.22",
    city: "Berlin",
    country: "Germany",
    classification: "sqli",
  },
  {
    id: "log8",
    sessionId: "SID-b2123b21b3n21b32",
    input: "GET /admin HTTP/1.1",
    time: "November 23, 2025 at 2:50:15 AM UTC+5:30",
    ip: "77.88.8.8",
    city: "Moscow",
    country: "Russia",
    classification: "bruteforce",
  },
  {
    id: "log9",
    sessionId: "SID-jh123jh12jh3j12h",
    input: "<svg/onload=confirm(123)>",
    time: "November 23, 2025 at 2:30:44 AM UTC+5:30",
    ip: "82.44.12.56",
    city: "London",
    country: "United Kingdom",
    classification: "xss",
  },
  {
    id: "log10",
    sessionId: "SID-18h1h82h182h182",
    input: "valid input",
    time: "November 23, 2025 at 2:05:10 AM UTC+5:30",
    ip: "110.172.201.220",
    city: "Hyderabad",
    country: "India",
    classification: "benign",
  },
  {
    id: "log11",
    sessionId: "SID-n12b3n12b3n1b23",
    input: "normal_login_attempt",
    time: "November 23, 2025 at 3:40:02 AM UTC+5:30",
    ip: "49.207.18.205",
    city: "Chennai",
    country: "India",
    classification: "benign",
  },
  {
    id: "log12",
    sessionId: "SID-b123b123b123b123",
    input: "'; DROP TABLE users; --",
    time: "November 23, 2025 at 3:10:30 AM UTC+5:30",
    ip: "185.199.110.22",
    city: "Berlin",
    country: "Germany",
    classification: "sqli",
  },
  {
    id: "log13",
    sessionId: "SID-b2123b21b3n21b32",
    input: "GET /admin HTTP/1.1",
    time: "November 23, 2025 at 2:50:15 AM UTC+5:30",
    ip: "77.88.8.8",
    city: "Moscow",
    country: "Russia",
    classification: "bruteforce",
  },
  {
    id: "log14",
    sessionId: "SID-jh123jh12jh3j12h",
    input: "<svg/onload=confirm(123)>",
    time: "November 23, 2025 at 2:30:44 AM UTC+5:30",
    ip: "82.44.12.56",
    city: "London",
    country: "United Kingdom",
    classification: "xss",
  },
  {
    id: "log15",
    sessionId: "SID-18h1h82h182h182",
    input: "valid input",
    time: "November 23, 2025 at 2:05:10 AM UTC+5:30",
    ip: "110.172.201.220",
    city: "Hyderabad",
    country: "India",
    classification: "benign",
  },
];
const myLogsFromFirestore = dummyLogs; // replace with actual data fetch
