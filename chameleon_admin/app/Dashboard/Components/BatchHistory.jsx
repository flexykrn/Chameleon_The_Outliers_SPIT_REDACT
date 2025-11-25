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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  ExternalLink,
  Copy,
  RefreshCw,
  CheckCircle2,
  Clock,
  Database,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Blockchain Batch History Component
 * Shows all batches that have been anchored to blockchain
 */
export default function BatchHistory() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch batches
  const fetchBatches = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/batches?limit=20");
      const data = await response.json();

      if (data.success) {
        setBatches(data.batches || []);
        if (showToast) {
          toast.success(`Loaded ${data.batches?.length || 0} batches`);
        }
      } else {
        toast.error("Failed to load batches");
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load batch history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      // Handle ISO string
      if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleString();
      }
      // Handle Unix timestamp
      if (typeof timestamp === "number") {
        return new Date(timestamp * 1000).toLocaleString();
      }
      return "N/A";
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Blockchain Batch History</CardTitle>
              <CardDescription>
                All attack log batches anchored to blockchain
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBatches(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading batches...</p>
            </div>
          </div>
        ) : batches.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No batches anchored yet. Click "Anchor Last 10 Logs" to create the
              first batch.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Logs</TableHead>
                  <TableHead>Merkle Root</TableHead>
                  <TableHead>Block #</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-secondary px-2 py-1 text-xs font-mono">
                          {batch.batchId?.substring(0, 20)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(batch.batchId)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{batch.logCount} logs</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs">
                          {batch.merkleRoot?.substring(0, 12)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(batch.merkleRoot)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{batch.blockNumber || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDate(batch.timestamp || batch.timestampISO)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Anchored
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.transactionHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            window.open(
                              `https://hoodi.etherscan.io/tx/${batch.transactionHash}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
