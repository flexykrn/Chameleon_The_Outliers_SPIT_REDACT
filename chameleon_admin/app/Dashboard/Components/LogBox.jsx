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
import { Eye, Download, ChevronsUpDown } from "lucide-react";
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              Full details of the attack event.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-mono">{selectedLog.time}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono">{selectedLog.ip}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p>
                    {selectedLog.city}, {selectedLog.country}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Classification
                  </p>
                  <Badge
                    variant="outline"
                    className={getClassificationColor(
                      selectedLog.classification
                    )}
                  >
                    {selectedLog.classification.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Session ID</p>
                <p className="font-mono text-xs bg-secondary p-2 rounded">
                  {selectedLog.sessionId}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Payload</p>
                <p className="font-mono text-xs bg-secondary p-2 rounded max-h-40 overflow-y-auto">
                  {selectedLog.input}
                </p>
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
