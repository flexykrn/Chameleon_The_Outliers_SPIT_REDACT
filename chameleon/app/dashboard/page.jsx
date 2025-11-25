"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Send } from "lucide-react";
import TransferModal from "./dashboardComponents/transferModal";
import BankLogo from "@/components/bankLogo";
import Link from "next/link";

// Firebase Imports
import { auth, db } from "../firebase"; // Ensure this path matches your project structure
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// New component imports
import RecentTransactions from "./dashboardComponents/RecentTransactions";
import FixedDeposits from "./dashboardComponents/FixedDeposits";

const Index = () => {
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  // State Management
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // 1. Listen for Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/authentication/signinpage"); // Redirect if not logged in
      } else {
        // 2. Once we have the UID, Listen to the Firestore Document
        const docRef = doc(db, "users", currentUser.uid);

        // onSnapshot gives real-time updates
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.log("No user data found");
          }
          setLoading(false); // Data loaded
        });

        // Cleanup listener when component unmounts or user changes
        return () => unsubscribeSnapshot();
      }
    });

    // Cleanup auth listener
    return () => unsubscribeAuth();
  }, [router]);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  // --- EMPTY STATE (Safe guard) ---
  if (!userData) return null;

  // Extract data with fallbacks to prevent crashes
  const balance = userData.accBalance || 0;
  const transactions = userData.transactions || [];
  const fixedDeposits = userData.fixedDeposits || [];
  const documents = userData.documents || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        uid={userData.uid}
        availableBalance={Number(userData.accBalance || 0)}
      />
      <div className="mx-auto max-w-7xl space-y-6">
        <BankLogo></BankLogo>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {userData.firstName} {userData.lastName}
            </p>
          </div>
          <Button className="gap-2" onClick={() => setTransferOpen(true)}>
            <Send className="h-4 w-4" />
            Transfer Money
          </Button>
        </div>

        {/* Account Balance Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Balance</CardTitle>
                <CardDescription>
                  Savings Account - ****{userData.uid.slice(0, 4)}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {showBalance
                ? `₹${balance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}`
                : "••••••••"}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions (component) */}
        <RecentTransactions transactions={transactions} />

        {/* Fixed Deposits (component) */}
        <FixedDeposits fixedDeposits={fixedDeposits} />

        {/* Documents */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Your bank documents and statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No documents found.
                </p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <svg
                          className="h-5 w-5 text-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2a2 2 0 00-2 2v7H7l5 5 5-5h-3V4a2 2 0 00-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {doc.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • {doc.size}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
