"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * props:
 * - fixedDeposits: array of FD objects
 *   each FD: { id, amount, rate, tenure, maturityDate }
 */

export default function FixedDeposits({ fixedDeposits = [] }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Fixed Deposits</CardTitle>
        <CardDescription>Your investment portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Grid wrapper with vertical scroll if many FDs */}
        <div className="grid gap-4 md:grid-cols-2 max-h-64 overflow-y-auto">
          {fixedDeposits.length === 0 ? (
            <p className="text-muted-foreground text-sm col-span-2">
              No active fixed deposits.
            </p>
          ) : (
            fixedDeposits.map((fd) => (
              <div
                key={fd.id}
                className="rounded-lg border border-border bg-secondary/50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">FD Amount</span>
                  <Badge variant="secondary">{fd.tenure}</Badge>
                </div>
                <div className="mb-1 text-2xl font-bold text-foreground">
                  ₹{fd.amount.toLocaleString("en-IN")}
                </div>
                <div className="mb-2 text-sm text-muted-foreground">
                  <div className="mb-2 text-sm text-muted-foreground">
                    Interest Rate:{" "}
                    <span className="font-semibold text-chart-2">{fd.rate}% p.a.</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Matures on: {fd.maturityDate}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
