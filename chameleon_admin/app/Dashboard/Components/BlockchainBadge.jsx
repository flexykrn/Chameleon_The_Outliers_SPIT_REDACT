"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, CheckCircle2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

/**
 * Blockchain Verification Badge
 * Shows if a log is part of a blockchain-anchored batch
 * Displays verification details when clicked
 */
export default function BlockchainBadge({ logId, compact = false }) {
  const [isVerified, setIsVerified] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkIfAnchored();
  }, [logId]);

  const checkIfAnchored = async () => {
    try {
      // Fetch batches and check if this log is in any
      const response = await fetch("/api/batches?limit=100");
      const data = await response.json();

      if (data.success && data.batches) {
        // Check if log is in any batch
        const foundBatch = data.batches.find((batch) =>
          batch.logIds?.includes(logId)
        );

        if (foundBatch) {
          setIsVerified(true);
          setBatchInfo(foundBatch);
        }
      }
    } catch (error) {
      console.error("Failed to check anchoring status:", error);
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (checking) {
    return null; // Don't show anything while checking
  }

  if (!isVerified) {
    return compact ? null : (
      <Badge variant="outline" className="gap-1 text-xs">
        <Shield className="h-3 w-3" />
        Not Anchored
      </Badge>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(true)}
        className={compact ? "h-6 px-2" : "gap-2"}
      >
        <Badge
          variant="default"
          className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
        >
          <CheckCircle2 className="h-3 w-3" />
          {!compact && "Blockchain Verified"}
        </Badge>
      </Button>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Blockchain Verification Details
            </DialogTitle>
            <DialogDescription>
              This log is cryptographically secured on the blockchain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Verification Status */}
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
              <div className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Verified and Tamper-Proof
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                This attack log is part of a batch that has been anchored to the
                blockchain. Any modification to the log will be instantly
                detectable through Merkle root verification.
              </p>
            </div>

            {/* Batch Details */}
            {batchInfo && (
              <div className="space-y-3">
                <div className="rounded-lg border bg-secondary/30 p-3">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Batch ID
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate font-mono text-sm">
                      {batchInfo.batchId}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(batchInfo.batchId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-secondary/30 p-3">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Merkle Root (SHA-256)
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all font-mono text-xs">
                      {batchInfo.merkleRoot}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(batchInfo.merkleRoot)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-secondary/30 p-3">
                    <div className="mb-1 text-xs text-muted-foreground">
                      Block Number
                    </div>
                    <div className="font-semibold">
                      {batchInfo.blockNumber || "N/A"}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-secondary/30 p-3">
                    <div className="mb-1 text-xs text-muted-foreground">
                      Logs in Batch
                    </div>
                    <div className="font-semibold">
                      {batchInfo.logCount || 0}
                    </div>
                  </div>
                </div>

                {batchInfo.transactionHash && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() =>
                      window.open(
                        `https://hoodi.etherscan.io/tx/${batchInfo.transactionHash}`,
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Transaction on Block Explorer
                  </Button>
                )}
              </div>
            )}

            {/* Explanation */}
            <div className="rounded-lg bg-primary/5 p-4 text-sm">
              <p className="font-medium">What does this mean?</p>
              <p className="mt-2 text-muted-foreground">
                The blockchain acts as an immutable ledger. The Merkle root is a
                cryptographic fingerprint of all logs in this batch. If anyone
                (including insiders or persistent attackers) tries to modify,
                delete, or tamper with this log, the Merkle root will no longer
                match, proving the evidence has been compromised.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
