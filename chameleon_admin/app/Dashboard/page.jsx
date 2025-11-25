"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/app/firebase"; // adjust path if needed

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"; // if you have a spinner component; otherwise fallback
import { toast } from "sonner"; // ensure Toaster is in layout
import { generateDashboardPDF } from "@/lib/pdfExport"; // PDF export utility
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
import BlockchainVerification from "./Components/BlockchainVerification";

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

  // 🔥 Firebase data states
  const [attacks, setAttacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sqli: 0,
    xss: 0,
    bruteforce: 0,
    benign: 0,
    avgConfidence: 0
  });

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

  // 🔥 Real-time attack listener from Firebase
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'attacks'),
      orderBy('timestamp', 'desc'),
      limit(500) // Get more data for charts
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attacksData = [];
      let sqliCount = 0, xssCount = 0, bruteCount = 0, benignCount = 0;
      let totalConfidence = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        attacksData.push({ id: doc.id, ...data });
        
        const classification = data.classification?.toLowerCase();
        if (classification === 'sqli' || classification === 'sql injection') sqliCount++;
        else if (classification === 'xss') xssCount++;
        else if (classification === 'brute force' || classification === 'bruteforce') bruteCount++;
        else if (classification === 'benign') benignCount++;

        totalConfidence += (data.confidence || 0);
      });

      setAttacks(attacksData);
      setStats({
        total: attacksData.length,
        sqli: sqliCount,
        xss: xssCount,
        bruteforce: bruteCount,
        benign: benignCount,
        avgConfidence: attacksData.length > 0 ? Math.round((totalConfidence / attacksData.length) * 100) : 0
      });
    });

    return () => unsubscribe();
  }, [uid]);

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

  // Save Reports - Generate PDF
  const handleSaveReports = async () => {
    setReportLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Generating PDF report... (Console warnings are normal)", { duration: 10000 });
    
    try {
      // Small delay to ensure all components are fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate comprehensive PDF with current dashboard state
      const result = await generateDashboardPDF(stats, attacks);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(`✅ Dashboard report saved: ${result.fileName}`, { duration: 5000 });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Report generation error:", err);
      toast.error(`❌ Failed to generate report: ${err.message}`, { duration: 5000 });
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
          <div id="kpi-cards-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Threats"
              value={stats.total}
              icon={AlertTriangle}
            />
            <KPICard
              title="Average Confidence"
              value={stats.avgConfidence + "%"}
              icon={Activity}
            />
            <KPICard
              title="XSS Attacks"
              value={stats.xss}
              icon={X}
            />
            <KPICard
              title="SQLi Attacks"
              value={stats.sqli}
              icon={ShieldAlert}
            />
          </div>
          <div id="charts-row" className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartRadarAttack
              dataCounts={{ 
                benign: stats.benign, 
                xss: stats.xss, 
                sqli: stats.sqli
              }}
              title="Attack Distribution"
            />

            <ChartLineAttacks
              events={attacks.slice(0, 100).map(attack => ({
                id: attack.id,
                type: (attack.classification || 'benign').toLowerCase(),
                timestamp: attack.timestamp?.toDate?.()?.toString() || attack.timestampISO || new Date().toString()
              }))}
              title="Attacks (Last 12 Hours)"
            />
            <div id="map-section">
              <MapZone
                zones={attacks
                  .filter(a => a.latitude && a.longitude && a.latitude !== 0 && a.longitude !== 0)
                  .slice(0, 50)
                  .map((attack, idx) => ({
                    id: attack.id || idx,
                    lat: attack.latitude,
                    lng: attack.longitude,
                    radius: 500,
                    color: attack.classification === 'sqli' ? 'rgba(239,68,68,0.7)' : 
                           attack.classification === 'xss' ? 'rgba(251,146,60,0.7)' : 
                           'rgba(240,196,25,0.7)',
                    popup: `${attack.city || 'Unknown'}, ${attack.country || 'Unknown'}`
                  }))
                }
                mapHeight="480px"
              />
            </div>
          </div>
          <div id="logs-section" className="mt-8">
            <SecurityLogsTable logs={attacks.slice(0, 100).map(attack => ({
              id: attack.id,
              sessionId: attack.id.substring(0, 16),
              input: attack.payload || attack.input || 'N/A',
              time: attack.timestamp?.toDate?.()?.toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'long'
              }) || attack.timestampISO || 'N/A',
              ip: attack.ip || attack.clientIp || 'Unknown',
              city: attack.city || 'Unknown',
              country: attack.country || 'Unknown',
              classification: (attack.classification || 'benign').toLowerCase(),
              httpMethod: attack.httpMethod || 'N/A',
              endpoint: attack.endpoint || 'N/A',
              attackIntent: attack.attackIntention || attack.geminiAnalysis || 'No analysis available',
              xaiExplanation: attack.xaiExplanation || 'No XAI explanation available'
            }))} />
          </div>

          {/* Blockchain Verification Section - Merkle Tree */}
          {typeof window !== 'undefined' && (
            <div className="mt-8">
              <h2 className="mb-4 text-2xl font-bold">Blockchain Integrity Verification</h2>
              <p className="mb-6 text-muted-foreground">
                Ensure attack logs are tamper-proof using cryptographic Merkle roots anchored on blockchain.
                Any modification to the logs will be instantly detectable.
              </p>
              <BlockchainVerification />
            </div>
          )}
         
        </div>
      </main>
    </div>
  );
}
