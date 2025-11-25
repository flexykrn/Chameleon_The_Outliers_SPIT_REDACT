'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Send } from "lucide-react";
import BankLogo from "@/components/bankLogo";
import RecentTransactions from "../dashboard/dashboardComponents/RecentTransactions";
import FixedDeposits from "../dashboard/dashboardComponents/FixedDeposits";
import TrapTransferModal from "./TrapTransferModal";

export default function TrapPage() {
  const [showBalance, setShowBalance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);

  // Fake user data for the honeypot
  const fakeUserData = {
    firstName: "John",
    lastName: "Doe",
    uid: "trap_user_12345",
    accBalance: 1250000.50,
    transactions: [
      {
        id: "txn1",
        name: "Salary Credit",
        date: "2025-11-20",
        amount: 85000,
        type: "credit"
      },
      {
        id: "txn2",
        name: "Amazon Payment",
        date: "2025-11-19",
        amount: -2499,
        type: "debit"
      },
      {
        id: "txn3",
        name: "Electricity Bill",
        date: "2025-11-18",
        amount: -1850,
        type: "debit"
      },
      {
        id: "txn4",
        name: "Dividend Credit",
        date: "2025-11-15",
        amount: 12500,
        type: "credit"
      }
    ],
    fixedDeposits: [
      {
        id: "fd1",
        amount: 500000,
        interestRate: 7.5,
        maturityDate: "2026-03-15",
        status: "Active"
      },
      {
        id: "fd2",
        amount: 300000,
        interestRate: 7.25,
        maturityDate: "2025-12-20",
        status: "Active"
      }
    ],
    documents: [
      {
        id: "doc1",
        name: "Account Statement - Nov 2025",
        type: "PDF",
        size: "245 KB"
      },
      {
        id: "doc2",
        name: "Tax Certificate 2024-25",
        type: "PDF",
        size: "180 KB"
      },
      {
        id: "doc3",
        name: "Fixed Deposit Receipt",
        type: "PDF",
        size: "156 KB"
      }
    ]
  };

  // Log that someone accessed the trap page
  useEffect(() => {
    const logTrapAccess = async () => {
      try {
        await fetch('/api/log-attack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: 'Accessed honeypot dashboard directly',
            classification: 'Suspicious',
            confidence: 0.9,
            deceptiveResponse: 'User accessed fake banking dashboard'
          })
        });
      } catch (err) {
        console.error('Trap logging error:', err);
      }
      setLoading(false);
    };

    logTrapAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  const balance = fakeUserData.accBalance;
  const transactions = fakeUserData.transactions;
  const fixedDeposits = fakeUserData.fixedDeposits;
  const documents = fakeUserData.documents;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <TrapTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        availableBalance={fakeUserData.accBalance}
      />
      <div className="mx-auto max-w-7xl space-y-6">
        <BankLogo />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {fakeUserData.firstName} {fakeUserData.lastName}
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
                  Savings Account - ****{fakeUserData.uid.slice(-4)}
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={async () => {
                        // Classify the download attempt
                        const classifyResponse = await fetch('/api/classify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            input: `Download request for document: ${doc.name}` 
                          }),
                        });

                        const classifyData = await classifyResponse.json();

                        // Log the download attempt
                        await fetch('/api/log-attack', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            input: `Attempted to download: ${doc.name}`,
                            classification: classifyData.classification || 'Document Download',
                            confidence: classifyData.confidence || 0.85,
                            deceptiveResponse: 'Document download attempted in honeypot'
                          })
                        });
                        
                        alert('Download started! Check your downloads folder.');
                      }}
                    >
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
}
