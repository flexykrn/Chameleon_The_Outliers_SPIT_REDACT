"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

/**
 * props:
 * - transactions: array of transaction objects
 *   each transaction: { id, type: "credit"|"debit", description, date, amount }
 */

export default function RecentTransactions({ transactions = [] }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest account activity</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Make the transactions list scrollable with max height */}
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2`}>
                    {transaction.type === "credit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-chart-2" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <div
                  className={`text-lg font-semibold ${
                    transaction.type === "credit" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : ""}
                  ₹{Math.abs(transaction.amount).toLocaleString("en-IN")}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
