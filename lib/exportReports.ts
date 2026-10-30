/**
 * Export utilities for Decision-Making Reports in InteriorFinder Admin Panel.
 * Generates fully styled Excel workbooks (SpreadsheetML) and printable vector PDF views.
 */

export interface ExportColumn {
  header: string;
  key: string;
  width?: number; // character width approx
  type?: "string" | "number" | "currency" | "percent" | "date";
  align?: "left" | "center" | "right";
}

export interface ExportSummaryCard {
  label: string;
  value: string | number;
}

export interface ExportReportPayload {
  reportTitle: string;
  reportSubtitle?: string;
  fileName: string;
  filtersApplied: Record<string, string>;
  summaryCards: ExportSummaryCard[];
  columns: ExportColumn[];
  rows: Record<string, any>[];
  keyFindings?: string[];
}

/**
 * Escapes text for XML insertion.
 */
function escapeXml(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates a styled Excel workbook (SpreadsheetML XML) with frozen headers,
 * auto-widths, formatted summary cards, and full tabular data.
 */
export function exportReportToExcel(payload: ExportReportPayload) {
  const { reportTitle, fileName, filtersApplied, summaryCards, columns, rows } = payload;
  const nowStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  let filterSummary = Object.entries(filtersApplied)
    .filter(([_, v]) => v && v !== "all")
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ");
  if (!filterSummary) filterSummary = "All available records (No restrictive filters)";

  const xmlParts: string[] = [];

  xmlParts.push(`<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXml(reportTitle)}</Title>
  <Author>InteriorFinder Platform</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1C2D27"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="BrandTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0c4037"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#66756e"/>
   <Alignment ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="CardLabel">
   <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#14594c"/>
   <Interior ss:Color="#e9f0e9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#c7ddce"/>
   </Borders>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CardValue">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0c4037"/>
   <Interior ss:Color="#f5faf6" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#c7ddce"/>
   </Borders>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#14594c" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0c4037"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#237061"/>
   </Borders>
  </Style>
  <Style ss:ID="TableCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
   </Borders>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableCellCenter">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
   </Borders>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableCellNumber">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
   </Borders>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="TableCellPercent">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E8E2"/>
   </Borders>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Report Data">
  <Table ss:DefaultRowHeight="20">`);

  // Column definitions
  for (const col of columns) {
    const width = col.width ? col.width * 8 : 120;
    xmlParts.push(`   <Column ss:Width="${width}"/>`);
  }

  // Row 1: Title
  xmlParts.push(`   <Row ss:Height="30">
    <Cell ss:MergeAcross="${Math.max(columns.length - 1, 1)}" ss:StyleID="BrandTitle">
      <Data ss:Type="String">InteriorFinder — ${escapeXml(reportTitle)}</Data>
    </Cell>
   </Row>`);

  // Row 2: Generation metadata
  xmlParts.push(`   <Row ss:Height="18">
    <Cell ss:MergeAcross="${Math.max(columns.length - 1, 1)}" ss:StyleID="MetaLabel">
      <Data ss:Type="String">Generated: ${escapeXml(nowStr)} | Filters: ${escapeXml(filterSummary)}</Data>
    </Cell>
   </Row>`);

  // Row 3: Blank separator
  xmlParts.push(`   <Row ss:Height="12"><Cell><Data ss:Type="String"></Data></Cell></Row>`);

  // Summary Metrics Section (if available)
  if (summaryCards.length > 0) {
    xmlParts.push(`   <Row ss:Height="18">`);
    for (const card of summaryCards) {
      xmlParts.push(`    <Cell ss:StyleID="CardLabel"><Data ss:Type="String">${escapeXml(card.label)}</Data></Cell>`);
    }
    xmlParts.push(`   </Row>`);

    xmlParts.push(`   <Row ss:Height="24">`);
    for (const card of summaryCards) {
      const isNum = typeof card.value === "number";
      xmlParts.push(
        `    <Cell ss:StyleID="CardValue"><Data ss:Type="${isNum ? "Number" : "String"}">${escapeXml(card.value)}</Data></Cell>`
      );
    }
    xmlParts.push(`   </Row>`);

    xmlParts.push(`   <Row ss:Height="16"><Cell><Data ss:Type="String"></Data></Cell></Row>`);
  }

  // Table Headers
  xmlParts.push(`   <Row ss:Height="24">`);
  for (const col of columns) {
    xmlParts.push(`    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`);
  }
  xmlParts.push(`   </Row>`);

  // Table Rows
  for (const row of rows) {
    xmlParts.push(`   <Row ss:Height="20">`);
    for (const col of columns) {
      const val = row[col.key];
      let styleId = "TableCell";
      let type = "String";
      let formattedVal = val;

      if (col.type === "number") {
        styleId = "TableCellNumber";
        type = "Number";
        formattedVal = Number(val) || 0;
      } else if (col.type === "percent") {
        styleId = "TableCellPercent";
        type = "Number";
        formattedVal = (Number(val) || 0) / 100;
      } else if (col.align === "center") {
        styleId = "TableCellCenter";
      }

      xmlParts.push(
        `    <Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(formattedVal)}</Data></Cell>`
      );
    }
    xmlParts.push(`   </Row>`);
  }

  xmlParts.push(`  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>7</SplitHorizontal>
   <TopRowBottomPane>7</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`);

  const fullXml = xmlParts.join("\n");
  const blob = new Blob([fullXml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a professional, formatted printable PDF view in a dedicated window.
 */
export function exportReportToPdf(payload: ExportReportPayload) {
  const { reportTitle, reportSubtitle, filtersApplied, summaryCards, columns, rows, keyFindings } = payload;
  const nowStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  let filterSummary = Object.entries(filtersApplied)
    .filter(([_, v]) => v && v !== "all")
    .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
    .join(" &nbsp;|&nbsp; ");
  if (!filterSummary) filterSummary = "All available records (No filter restrictions)";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to open the printable PDF report.");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(reportTitle)} — InteriorFinder Decision Report</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1.2cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1f2d26;
      background: #fff;
      margin: 0;
      padding: 20px;
      font-size: 11px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #14594c;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 800;
      color: #0c4037;
    }
    .brand-mark {
      background: #14594c;
      color: #fff;
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }
    .title-area h1 {
      margin: 6px 0 2px;
      font-size: 20px;
      color: #0c4037;
    }
    .title-area p {
      margin: 0;
      color: #55675e;
      font-size: 11px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #64736a;
    }
    .filter-bar {
      background: #f4f7f4;
      border: 1px solid #dce4dd;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 10px;
      margin-bottom: 16px;
      color: #3b4e44;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(${Math.min(summaryCards.length, 6)}, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: #fafcfa;
      border: 1px solid #dce5dd;
      border-radius: 6px;
      padding: 10px 12px;
      border-top: 3px solid #14594c;
    }
    .summary-card small {
      display: block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #55675e;
      margin-bottom: 4px;
    }
    .summary-card strong {
      font-size: 18px;
      color: #0c4037;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10.5px;
    }
    th {
      background: #14594c;
      color: #fff;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      border: 1px solid #14594c;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #e1e7e2;
    }
    tr:nth-child(even) td {
      background: #f8faf8;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .findings-card {
      background: #edf5f0;
      border-left: 4px solid #14594c;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 20px;
    }
    .findings-card h4 {
      margin: 0 0 6px;
      font-size: 12px;
      color: #0c4037;
    }
    .findings-card ul {
      margin: 0;
      padding-left: 18px;
      color: #3b4e44;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #e1e7e2;
      padding-top: 10px;
      display: flex;
      justifyContent: space-between;
      font-size: 9px;
      color: #77857d;
      margin-top: 24px;
    }
    .no-print {
      margin-bottom: 14px;
      display: flex;
      justifyContent: flex-end;
      gap: 10px;
    }
    .print-btn {
      background: #14594c;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF 🖨</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">
        <span class="brand-mark">⌂</span>
        <span>InteriorFinder</span>
      </div>
      <div class="title-area">
        <h1>${escapeXml(reportTitle)}</h1>
        <p>${escapeXml(reportSubtitle || "Authoritative Executive Decision Report")}</p>
      </div>
    </div>
    <div class="meta-box">
      <div><strong>Report Type:</strong> Administrative Intelligence</div>
      <div><strong>Generated:</strong> ${escapeXml(nowStr)}</div>
      <div><strong>Source:</strong> Authoritative PostgreSQL Database</div>
    </div>
  </div>

  <div class="filter-bar">
    <strong>Filter Criteria:</strong> ${filterSummary}
  </div>

  ${
    summaryCards.length > 0
      ? `<div class="summary-grid">
      ${summaryCards
        .map(
          (c) => `
        <div class="summary-card">
          <small>${escapeXml(c.label)}</small>
          <strong>${escapeXml(c.value)}</strong>
        </div>
      `
        )
        .join("")}
    </div>`
      : ""
  }

  ${
    keyFindings && keyFindings.length > 0
      ? `<div class="findings-card">
      <h4>Executive Key Findings & Decision Signals</h4>
      <ul>
        ${keyFindings.map((f) => `<li>${escapeXml(f)}</li>`).join("")}
      </ul>
    </div>`
      : ""
  }

  <table>
    <thead>
      <tr>
        ${columns
          .map(
            (c) => `
          <th class="${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}">
            ${escapeXml(c.header)}
          </th>
        `
          )
          .join("")}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `
        <tr>
          ${columns
            .map((c) => {
              const val = r[c.key];
              const alignClass =
                c.align === "right" || c.type === "number" || c.type === "percent"
                  ? "text-right"
                  : c.align === "center"
                  ? "text-center"
                  : "";
              const formatted =
                c.type === "percent"
                  ? `${Number(val || 0).toFixed(1)}%`
                  : val !== null && val !== undefined
                  ? escapeXml(val)
                  : "—";
              return `<td class="${alignClass}">${formatted}</td>`;
            })
            .join("")}
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <span>InteriorFinder Platform Administration &copy; ${new Date().getFullYear()}</span>
    <span>Confidential — Internal Executive Review Only</span>
  </div>

  <script>
    // Auto-trigger print dialog after layout settles
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
