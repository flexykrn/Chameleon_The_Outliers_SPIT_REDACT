"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/**
 * ChartLineAttacks
 *
 * Props:
 *  - events: Array<EventObject> (optional)
 *      EventObject schema:
 *        {
 *          id: string,                    // unique id
 *          type: "benign" | "xss" | "sqli" | "bruteforce", // attack category
 *          timestamp: string              // e.g. "November 23, 2025 at 5:25:01\u202FAM UTC+5:30"
 *        }
 *
 *  - title: string (optional)
 *
 * Notes:
 * - If `events` is not provided, the component generates demo events (NOT from CSV).
 * - The timestamp format above is parsed and normalized (supports the exact format you provided).
 * - This component aggregates events into the last 12 hourly buckets (oldest → newest).
 *
 * DATASET_URL is provided for your backend/dev usage (local path to uploaded CSV).
 */
export const DATASET_URL = "/mnt/data/7b7483be-3dd1-47df-8e47-ee2f2f2a667e.csv";

export default function ChartLineAttacks({
  events = null,
  title = "Attacks — Last 12 hours",
}) {
  // parse the given timestamp format robustly
  function parseTimestampString(ts) {
    if (!ts || typeof ts !== "string") return null;

    // Normalize narrow no-break spaces and non-breaking spaces
    let s = ts.replace(/\u202F/g, " ").replace(/\u00A0/g, " ");

    // Normalize " at " to single space for easier parsing (keeps the timestamp readable)
    s = s.replace(/\s+at\s+/i, " ");

    // Replace "UTC" with "GMT" so Date parsing with timezone offset works in browser
    s = s.replace(/\bUTC\b/i, "GMT");

    s = s.trim();

    // Try parsing directly
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // Fallbacks: remove stray text after timezone or try ISO-like replacement
    const tzMatch = s.match(/(GMT|UTC)([+\-]\d{1,2}:\d{2})/i);
    if (tzMatch) {
      // keep as-is (should have worked); but attempt to replace any localized names
      // final fallback: remove timezone and parse as local
      const s2 = s.replace(/\s+(GMT|UTC)[+\-]\d{1,2}:\d{2}/i, "");
      d = new Date(s2);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  }

  // Build chart data (12 hourly buckets) from events prop
  const chartData = useMemo(() => {
    const now = new Date();
    const H = 12;

    // Build bins oldest -> newest
    const bins = [];
    for (let i = H - 1; i >= 0; i--) {
      const start = new Date(now.getTime() - i * 60 * 60 * 1000);
      start.setMinutes(0, 0, 0);
      bins.push(start);
    }

    // counts per hour
    const counts = Array(bins.length).fill(0);

    // Events to use (if none provided, synthesize demo events)
    let list = events;
    if (!Array.isArray(list)) {
      // synthesize demo events (randomly distributed across last 12 hours)
      list = [];
      const totalDemo = 60;
      for (let i = 0; i < totalDemo; i++) {
        // bias recent more
        const bias = Math.random() ** 1.1;
        const offsetMs = Math.floor(bias * H * 60 * 60 * 1000);
        const d = new Date(now.getTime() - offsetMs - Math.floor(Math.random() * 59) * 1000);
        // Compose timestamp string in your exact format:
        // "November 23, 2025 at 5:25:01\u202FAM UTC+5:30"
        const options = {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        };
        const s = d.toLocaleString("en-US", options); // may include "GMT+5:30"
        const normalized = s.replace(",", "").replace("GMT", "UTC").replace(/\s+([A-Z]{3}[\+\-]\d{1,2}:\d{2})$/, " UTC$1");
        list.push({
          id: `demo_${i}`,
          type: ["benign", "xss", "sqli", "bruteforce"][Math.floor(Math.random() * 4)],
          timestamp: normalized,
        });
      }
    }

    // Place events into appropriate bin
    for (const ev of list) {
      const d = parseTimestampString(ev.timestamp);
      if (!d) continue;
      const msDiff = now.getTime() - d.getTime();
      if (msDiff < 0 || msDiff > H * 60 * 60 * 1000) continue; // outside 12h
      for (let i = 0; i < bins.length; i++) {
        const start = bins[i].getTime();
        const end = start + 60 * 60 * 1000;
        if (d.getTime() >= start && d.getTime() < end) {
          counts[i] += 1;
          break;
        }
      }
    }

    // Map to chart-friendly array (oldest -> newest)
    return bins.map((b, i) => {
      const label = b.toLocaleTimeString([], { hour: "numeric", hour12: true });
      return { hourLabel: label, attacks: counts[i] };
    });
  }, [events]);

  const chartConfig = {
    attacks: { label: "Attacks", color: "var(--chart-1)" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Number of attacks per hour — last 12 hours</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line dataKey="attacks" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </CardContent>

    </Card>
  );
}
