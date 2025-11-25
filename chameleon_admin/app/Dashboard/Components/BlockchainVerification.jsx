"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldCheck,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  Clock,
  User,
  Database,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Blockchain Verification Component for Admin Dashboard
 * Allows admins to verify batch integrity on the blockchain
 */
export default function BlockchainVerification() {
  const [batchId, setBatchId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [anchoringBatch, setAnchoringBatch] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [anchorResult, setAnchorResult] = useState(null);

  // Verify a batch on blockchain
  const handleVerify = async () => {
    if (!batchId.trim()) {
      toast.error("Please enter a batch ID");
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch("/api/verify-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batchId.trim() }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        setVerificationResult({
          verified: true,
          ...data.batch,
        });
        toast.success("Batch verified on blockchain!");
      } else {
        setVerificationResult({
          verified: false,
          error: data.error || "Batch not found on blockchain",
        });
        toast.error("Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        verified: false,
        error: error.message,
      });
      toast.error("Verification request failed");
    } finally {
      setVerifying(false);
    }
  };

  // Anchor a new batch to blockchain
  const handleAnchorBatch = async () => {
    setAnchoringBatch(true);
    setAnchorResult(null);

    try {
      const response = await fetch("/api/anchor-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 10 }),
      });

      const data = await response.json();

      if (data.success) {
        setAnchorResult({
          success: true,
          ...data,
        });
        toast.success(
          `Successfully anchored ${data.batch.logCount} logs to blockchain!`
        );
        // Auto-populate batch ID for verification
        setBatchId(data.batch.batchId);
      } else {
        setAnchorResult({
          success: false,
          error: data.error || "Anchoring failed",
        });
        toast.error("Failed to anchor batch");
      }
    } catch (error) {
      console.error("Anchoring error:", error);
      setAnchorResult({
        success: false,
        error: error.message,
      });
      toast.error("Anchoring request failed");
    } finally {
      setAnchoringBatch(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Anchor New Batch Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Anchor Logs to Blockchain</CardTitle>
              <CardDescription>
                Create a tamper-proof batch of recent attack logs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-secondary/30 p-4">
            <p className="text-sm text-muted-foreground">
              Anchoring creates a Merkle root from recent attack logs and stores
              it on the blockchain, making the logs immutable and verifiable.
            </p>
          </div>

          <Button
            onClick={handleAnchorBatch}
            disabled={anchoringBatch}
            className="w-full gap-2"
            size="lg"
          >
            {anchoringBatch ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Anchoring to Blockchain...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Anchor Last 10 Logs
              </>
            )}
          </Button>

          {/* Anchor Result */}
          {anchorResult && (
            <div
              className={`rounded-lg border p-4 ${
                anchorResult.success
                  ? "border-primary/30 bg-primary/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              {anchorResult.success ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    Successfully Anchored!
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch ID:</span>
                      <code className="font-mono text-xs">
                        {anchorResult.batch?.batchId}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Logs Count:</span>
                      <span className="font-medium">
                        {anchorResult.batch?.logCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Block #:</span>
                      <span className="font-medium">
                        {anchorResult.blockchain?.blockNumber}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Merkle Root
                    </Label>
                    <div className="group relative flex items-center gap-2 rounded-md border bg-background p-2">
                      <code className="flex-1 truncate font-mono text-xs">
                        {anchorResult.batch?.merkleRoot}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          copyToClipboard(anchorResult.batch?.merkleRoot)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {anchorResult.blockchain?.explorerUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() =>
                        window.open(
                          anchorResult.blockchain.explorerUrl,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Block Explorer
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm">{anchorResult.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Batch Card */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Verify Batch Integrity</CardTitle>
              <CardDescription>
                Check if a batch exists on blockchain and view its details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch ID</Label>
            <div className="flex gap-2">
              <Input
                id="batchId"
                placeholder="batch-1234567890-10"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
              <Button
                onClick={handleVerify}
                disabled={verifying || !batchId.trim()}
                className="gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div
              className={`rounded-lg border p-4 ${
                verificationResult.verified
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              {verificationResult.verified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Batch Verified on Blockchain
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 rounded-md bg-background p-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Batch ID
                        </div>
                        <code className="block font-mono text-sm">
                          {verificationResult.batchId}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-md bg-background p-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Merkle Root (SHA-256)
                        </div>
                        <div className="group relative flex items-center gap-2">
                          <code className="block break-all font-mono text-xs">
                            {verificationResult.merkleRoot}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() =>
                              copyToClipboard(verificationResult.merkleRoot)
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-md bg-background p-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Anchored At
                        </div>
                        <div className="text-sm font-medium">
                          {verificationResult.timestampISO
                            ? new Date(
                                verificationResult.timestampISO
                              ).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-md bg-background p-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Committer Address
                        </div>
                        <code className="block break-all font-mono text-xs">
                          {verificationResult.committer}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      ✓ This batch is cryptographically secured on the
                      blockchain. Any tampering with the original logs will
                      result in a different Merkle root, proving the evidence
                      has been altered.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <XCircle className="h-5 w-5" />
                    Verification Failed
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {verificationResult.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          {!verificationResult && (
            <div className="flex gap-3 rounded-lg bg-blue-500/5 p-4 text-blue-600 dark:text-blue-400">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-xs">
                Enter a batch ID to verify its integrity on the blockchain.
                Verified batches prove that attack logs haven't been tampered
                with by insiders or attackers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
