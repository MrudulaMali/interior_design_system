"use client";

import React from "react";

// -------------------------------------------------------------
// 1. Bar Chart (Simple or Grouped)
// -------------------------------------------------------------
export interface BarChartItem {
  label: string;
  value: number;
  secondaryValue?: number;
  secondaryLabel?: string;
  color?: string;
}

export function BarChart({
  items,
  height = 240,
  primaryLabel = "Approved",
  secondaryLabel,
  valueSuffix = "",
}: {
  items: BarChartItem[];
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  valueSuffix?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        No chart data available for the current filter selection.
      </div>
    );
  }

  const maxValue = Math.max(
    ...items.map((i) => Math.max(i.value, i.secondaryValue !== undefined ? i.secondaryValue : 0)),
    5
  );

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", marginBottom: "14px", fontSize: "11px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", background: "var(--green)", borderRadius: "2px" }} />
          <span>{primaryLabel}</span>
        </div>
        {secondaryLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", background: "#d1ded5", borderRadius: "2px" }} />
            <span>{secondaryLabel}</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "18px",
          height: `${height}px`,
          paddingBottom: "36px",
          borderBottom: "1px solid var(--line)",
          minWidth: items.length * 60 > 400 ? `${items.length * 70}px` : "100%",
        }}
      >
        {items.map((item, idx) => {
          const barHeight = Math.max((item.value / maxValue) * (height - 60), item.value > 0 ? 6 : 0);
          const secBarHeight =
            item.secondaryValue !== undefined
              ? Math.max((item.secondaryValue / maxValue) * (height - 60), item.secondaryValue > 0 ? 6 : 0)
              : null;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
                position: "relative",
              }}
            >
              {/* Tooltip / value */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  alignItems: "flex-end",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {/* Secondary Bar if exists (e.g. Total or Pending) */}
                {secBarHeight !== null && (
                  <div
                    title={`${secondaryLabel || "Total"}: ${item.secondaryValue}${valueSuffix}`}
                    style={{
                      width: "16px",
                      height: `${secBarHeight}px`,
                      background: "#c9d9cd",
                      borderRadius: "3px 3px 0 0",
                      position: "relative",
                      transition: "height 0.3s ease",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "-18px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#52665b",
                      }}
                    >
                      {item.secondaryValue}
                    </span>
                  </div>
                )}

                {/* Primary Bar (e.g. Approved) */}
                <div
                  title={`${primaryLabel}: ${item.value}${valueSuffix}`}
                  style={{
                    width: secBarHeight !== null ? "16px" : "28px",
                    height: `${barHeight}px`,
                    background: item.color || "var(--green)",
                    borderRadius: "3px 3px 0 0",
                    position: "relative",
                    transition: "height 0.3s ease",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-18px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--deep)",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              </div>

              {/* Label */}
              <span
                style={{
                  position: "absolute",
                  bottom: "-28px",
                  fontSize: "10.5px",
                  color: "var(--ink)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "80px",
                  textAlign: "center",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. Horizontal Progress / Distribution Bars
// -------------------------------------------------------------
export interface HorizontalBarItem {
  label: string;
  value: number;
  total: number;
  color?: string;
  badge?: string;
}

export function HorizontalBarChart({ items }: { items: HorizontalBarItem[] }) {
  if (!items || items.length === 0) {
    return <div style={{ color: "var(--muted)", fontSize: "12px" }}>No data to display.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {items.map((item, idx) => {
        const percent = item.total > 0 ? (item.value / item.total) * 100 : 0;
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 500 }}>
              <span style={{ color: "var(--deep)", fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: "var(--muted)" }}>
                {item.value} / {item.total} {item.badge && `(${item.badge})`}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "10px",
                background: "#e9f0e9",
                borderRadius: "5px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(percent, 100)}%`,
                  height: "100%",
                  background: item.color || "var(--green)",
                  borderRadius: "5px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// 3. Donut / Status Ring Chart
// -------------------------------------------------------------
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  centerTitle = "Total",
  centerValue,
  size = 180,
}: {
  segments: DonutSegment[];
  centerTitle?: string;
  centerValue?: number | string;
  size?: number;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);

  let accumulatedPercent = 0;
  const gradientStops = segments.map((seg) => {
    const start = accumulatedPercent;
    const percent = total > 0 ? (seg.value / total) * 100 : 0;
    accumulatedPercent += percent;
    return `${seg.color} ${start}% ${accumulatedPercent}%`;
  });

  const conicStyle =
    total > 0
      ? `conic-gradient(${gradientStops.join(", ")})`
      : `conic-gradient(#e4e8e2 0% 100%)`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap", justifyContent: "center" }}>
      {/* Donut circle */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: conicStyle,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: `${size - 54}px`,
            height: `${size - 54}px`,
            borderRadius: "50%",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {centerTitle}
          </span>
          <strong style={{ fontSize: "20px", color: "var(--deep)" }}>
            {centerValue !== undefined ? centerValue : total}
          </strong>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "160px" }}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: seg.color }} />
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{seg.label}</span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <strong style={{ color: "var(--deep)" }}>{seg.value}</strong>
                <span style={{ color: "var(--muted)", fontSize: "10px" }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. Line / Area Monthly Trend Chart
// -------------------------------------------------------------
export interface MonthlyTrendData {
  labels: string[];
  series: {
    name: string;
    color: string;
    values: number[];
  }[];
}

export function MonthlyTrendChart({
  data,
  height = 240,
}: {
  data: MonthlyTrendData;
  height?: number;
}) {
  const { labels, series } = data;
  if (!labels || labels.length === 0) {
    return <div style={{ color: "var(--muted)", fontSize: "12px" }}>No historical data available.</div>;
  }

  const allVals = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allVals, 5);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", marginBottom: "14px", fontSize: "11px", flexWrap: "wrap" }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "3px", background: s.color, borderRadius: "2px" }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: `${height}px`,
          paddingBottom: "32px",
          borderBottom: "1px solid var(--line)",
          position: "relative",
          minWidth: labels.length * 60,
        }}
      >
        {labels.map((lbl, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              height: "100%",
              position: "relative",
              gap: "4px",
            }}
          >
            {/* Grouped miniature columns per series */}
            <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "100%" }}>
              {series.map((s, sIdx) => {
                const val = s.values[idx] || 0;
                const barHeight = Math.max((val / maxVal) * (height - 50), val > 0 ? 5 : 0);
                return (
                  <div
                    key={sIdx}
                    title={`${s.name} (${lbl}): ${val}`}
                    style={{
                      width: "12px",
                      height: `${barHeight}px`,
                      background: s.color,
                      borderRadius: "2px 2px 0 0",
                      position: "relative",
                      transition: "height 0.3s ease",
                    }}
                  />
                );
              })}
            </div>

            {/* Label below */}
            <span
              style={{
                position: "absolute",
                bottom: "-24px",
                fontSize: "10px",
                color: "var(--muted)",
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              {lbl}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
