"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

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

export default function ChartRadarAttack({
  dataCounts = null,
  title = "Attack Distribution",
}) {
  // Fallback sample if nothing provided
  const sample = { benign: 120, xss: 50, sqli: 42, bruteforce: 7 };
  const counts = dataCounts || sample;

  // MUST EXIST — Radar data with dataset keys
  const radarData = [
    { category: "Benign", value: counts.benign ?? 0 },
    { category: "XSS", value: counts.xss ?? 0 },
    { category: "SQLi", value: counts.sqli ?? 0 },
    { category: "BruteForce", value: counts.bruteforce ?? 0 },
  ];

  const chartConfig = {
    value: {
      label: "Attacks",
      color: "var(--chart-1)", // Shadcn reads this inside ChartContainer
    },
  };

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Showing distribution of attack types
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-0">
        {/* 🔥 FIX: Wrap in ChartContainer so useChart works */}
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[260px]"
        >
          <RadarChart data={radarData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <Radar
              dataKey="value"
              name="Attacks"
              stroke="var(--chart-2)"
              fill="var(--chart-1)"
              fillOpacity={0.6}
              dot={{ r: 4, strokeWidth: 2, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending overview <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground">
          Last scan snapshot
        </div>
      </CardFooter>
    </Card>
  );
}
