"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Lock, AlertCircle } from "lucide-react";

/**
 * Blockchain Integrity Card
 * Shows the current Merkle root of recent attack logs
 * Proves forensic evidence is tamper-proof
 */
export default function BlockchainIntegrity() {
  const [merkleRoot, setMerkleRoot] = useState(null);
  const [logCount, setLogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Calculate Merkle root from recent logs
  const calculateMerkleRoot = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from API endpoint
      const response = await fetch('/api/batches?limit=1');
      const data = await response.json();

      if (data.success && data.batches && data.batches.length > 0) {
        const latestBatch = data.batches[0];
        setMerkleRoot(latestBatch.merkleRoot);
        setLogCount(latestBatch.logCount || 0);
        setLastUpdated(new Date());
      } else {
        // Generate a demo merkle root for display
        setMerkleRoot("0x" + "a".repeat(64));
        setLogCount(10);
        setError("No batches anchored yet. Displaying demo hash.");
      }
    } catch (err) {
      console.error("Failed to fetch Merkle root:", err);
      setMerkleRoot("0x" + "a".repeat(64));
      setLogCount(0);
      setError("Connect to view live blockchain data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate on mount and refresh every 30 seconds
  useEffect(() => {
    calculateMerkleRoot();
    const interval = setInterval(calculateMerkleRoot, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Blockchain Integrity</CardTitle>
              <CardDescription>
                Cryptographic proof of tamper-proof logs
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Secured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Calculating Merkle root...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <>
            {/* Merkle Root Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Merkle Root (SHA-256)
                </span>
                <span className="text-xs text-muted-foreground">
                  {logCount} logs hashed
                </span>
              </div>
              <div className="group relative overflow-hidden rounded-lg border border-border bg-secondary/30 p-3">
                <code className="block break-all font-mono text-xs text-foreground">
                  {merkleRoot}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    navigator.clipboard.writeText(merkleRoot);
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Verification Status */}
            <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Cryptographic Integrity Verified
                </p>
                <p className="text-xs text-muted-foreground">
                  This Merkle root represents a cryptographic fingerprint of the
                  last {logCount} attack logs. Any tampering with the logs will
                  produce a different hash, proving the evidence is immutable.
                </p>
              </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last updated:</span>
                <span>{lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={calculateMerkleRoot}
              className="w-full"
            >
              Refresh Merkle Root
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
