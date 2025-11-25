"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, ChevronsUpDown, Activity, Shield, AlertTriangle, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/**
 * NOTE: Uploaded dataset path (for later server-side processing)
 * We'll send this path to any tool that needs it.
 */
const DATASET_PATH = "/mnt/data/7b7483be-3dd1-47df-8e47-ee2f2f2a667e.csv";

export default function SecurityLogsTable({ logs = [] }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [allDialogOpen, setAllDialogOpen] = useState(false);

  const totalLogs = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  // preview shows first `pageSize` rows inline to keep layout compact
  const previewLogs = useMemo(
    () => logs.slice(0, Math.min(20, totalLogs)),
    [logs, totalLogs]
  );

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page, pageSize]);

  const getClassificationColor = (classification) => {
    switch (classification) {
      case "xss":
        return "bg-destructive/20 text-destructive border-destructive/50";
      case "sqli":
        return "bg-warning/20 text-warning border-warning/50";
      case "bruteforce":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "benign":
        return "bg-success/20 text-success border-success/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const truncateSessionId = (id) =>
    id ? `${id.slice(0, 8)}...${id.slice(-4)}` : "";

  const handleExportCSV = () => {
    const header = [
      "id",
      "time",
      "ip",
      "location",
      "sessionId",
      "classification",
      "input",
    ];
    const rows = logs.map((l) =>
      [
        l.id,
        l.time,
        l.ip,
        `${l.city}, ${l.country}`,
        l.sessionId,
        l.classification,
        `"${(l.input || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "security_logs_export.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Inline CSS to theme modal scrollbar (limited scope) */}
      <style>{`
        /* applies only inside elements we mark with .modal-scrollbar */
        .modal-scrollbar::-webkit-scrollbar { height: 10px; width: 10px; }
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(15,138,87,0.35);
          border-radius: 8px;
          border: 2px solid rgba(7,20,11,0.12);
        }
        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        /* firefox scrollbar */
        .modal-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(15,138,87,0.35) transparent; }
      `}</style>

      {/* Header (clean: only actions that work) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Security Logs</h3>
          <span className="text-sm text-muted-foreground">
            Showing {Math.min(20, totalLogs)} of {totalLogs}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPage(1);
              setAllDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <ChevronsUpDown className="h-4 w-4" />
            View All
          </Button>

          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Small inline preview table */}
      <motion.div
        layout
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="rounded-lg border border-border bg-card overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {previewLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-secondary/40">
                <TableCell className="font-mono text-sm">{log.time}</TableCell>
                <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                <TableCell className="text-sm">
                  {log.city}, {log.country}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {truncateSessionId(log.sessionId)}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={getClassificationColor(log.classification)}
                  >
                    {log.classification.toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                    aria-label="View details"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {previewLogs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground p-6"
                >
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* DETAILS MODAL (single log) */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              Security Event Details
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Comprehensive analysis and forensic information for this attack event
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 py-4">
              {/* Overview Section */}
              <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Event Overview
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Timestamp</p>
                    <p className="text-base font-mono font-semibold">{selectedLog.time}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">IP Address</p>
                    <p className="text-base font-mono font-semibold text-primary">{selectedLog.ip}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Location</p>
                    <p className="text-base font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {selectedLog.city}, {selectedLog.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Classification & Request Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Classification
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Threat Type</p>
                      <Badge
                        variant="outline"
                        className={`${getClassificationColor(selectedLog.classification)} text-base px-4 py-2 font-semibold`}
                      >
                        {selectedLog.classification.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Session ID</p>
                      <p className="font-mono text-sm bg-secondary/50 p-3 rounded border">
                        {selectedLog.sessionId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Request Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">HTTP Method</p>
                      <Badge className="font-mono font-bold text-sm px-3 py-1">
                        {selectedLog.httpMethod || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Endpoint</p>
                      <p className="font-mono text-sm bg-secondary/50 p-3 rounded border break-all">
                        {selectedLog.endpoint || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payload Section */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Malicious Payload
                </h3>
                <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                  <pre className="font-mono text-sm whitespace-pre-wrap break-all max-h-48 overflow-y-auto text-destructive">
                    {selectedLog.input}
                  </pre>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  AI-Powered Attack Analysis (Gemini)
                </h3>
                <div className="bg-white/50 dark:bg-black/20 p-5 rounded-lg border border-blue-500/20">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {selectedLog.attackIntent || 'No analysis available'}
                  </p>
                </div>
              </div>

              {/* XAI Explanation Section */}
              <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  Explainable AI (XAI) Model Insights
                </h3>
                <div className="bg-white/50 dark:bg-black/20 p-5 rounded-lg border border-purple-500/20 max-h-80 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedLog.xaiExplanation ? 
                      (typeof selectedLog.xaiExplanation === 'object' ? 
                        JSON.stringify(selectedLog.xaiExplanation, null, 2) : 
                        selectedLog.xaiExplanation
                      ) : 
                      'No XAI explanation available'
                    }
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FULL TABLE MODAL (larger, shifted left, animated) */}
      <Dialog open={allDialogOpen} onOpenChange={() => setAllDialogOpen(false)}>
        {/* DialogContent handles the overlay; we animate the inner wrapper */}
        <DialogContent
          // larger width and left shift: use margin-left negative translate for left position.
          className="!max-w-[1200px] w-[92vw] md:w-[1100px] p-0 bg-transparent shadow-none"
        >
          {/* animated panel */}
          <motion.div
            initial={{ opacity: 0, y: 12, x: -40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, x: -20, scale: 0.99 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative z-[2000] mx-2 md:mx-0 bg-card border border-border rounded-lg overflow-hidden"
            style={{ boxShadow: "0 10px 30px rgba(3,6,4,0.6)" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">All Security Logs</h3>
                <p className="text-sm text-muted-foreground">
                  Full history — page {page} / {totalPages}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100, logs.length].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s === logs.length ? "All" : `${s}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <div className="px-3 py-1 rounded border border-border bg-secondary text-sm">
                  {page} / {totalPages}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
                <Button size="sm" variant="secondary" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAllDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* table area with themed scrollbar */}
            <div className="modal-scrollbar max-h-[72vh] overflow-auto p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-secondary/40">
                      <TableCell className="font-mono text-sm">
                        {log.time}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.city}, {log.country}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncateSessionId(log.sessionId)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getClassificationColor(log.classification)}
                        >
                          {log.classification.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {/* Eye opens DETAILS modal */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-4 p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, totalLogs)} of {totalLogs}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  First
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
