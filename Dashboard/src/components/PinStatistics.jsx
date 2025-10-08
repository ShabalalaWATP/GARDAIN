import React, { useEffect, useMemo, useRef, useState } from "react";

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item === null || item === undefined
          ? ""
          : typeof item === "object"
          ? JSON.stringify(item)
          : String(item)
      )
      .join("; ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }

  return String(value);
};

const escapeCsvValue = (value) => {
  const normalizedValue = normalizeValue(value);
  const needsQuotes = /[",\n]/.test(normalizedValue);
  const sanitizedValue = normalizedValue.replace(/"/g, '""');
  return needsQuotes ? `"${sanitizedValue}"` : sanitizedValue;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function PinStatistics({ pinData, isLoading, error }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  const tableData = useMemo(() => {
    if (!pinData || !Array.isArray(pinData) || pinData.length === 0) {
      return null;
    }

    const allKeys = new Set();
    pinData.forEach((person) => {
      Object.keys(person || {}).forEach((key) => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    const rows = pinData.map((person) =>
      headers.map((header) => normalizeValue(person ? person[header] : ""))
    );

    return { headers, rows };
  }, [pinData]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return;
    }

    const handleClickAway = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExportMenuOpen]);

  useEffect(() => {
    if (isMinimized) {
      setIsExportMenuOpen(false);
    }
  }, [isMinimized]);

  if (isLoading) {
    return (
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        minWidth: "280px",
        zIndex: 1000,
        fontFamily: "sans-serif"
      }}>
        <div style={{ color: "#6B7280", fontSize: "14px" }}>Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        minWidth: "280px",
        zIndex: 1000,
        fontFamily: "sans-serif"
      }}>
        <div style={{ color: "#DC2626", fontSize: "14px" }}>Error loading statistics</div>
      </div>
    );
  }

  if (!tableData) {
    return null;
  }

  // Calculate statistics
  const totalPeople = pinData.length;
  const toEvacuate = pinData.filter(person => person.to_evacuate === true).length;
  const notToEvacuate = pinData.filter(person => person.to_evacuate === false).length;

  const handleExport = async (format) => {
    if (!tableData) {
      return;
    }

    const dateStamp = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      const csvRows = tableData.rows.map((row) =>
        row.map((cell) => escapeCsvValue(cell)).join(",")
      );
      const csvContent = [tableData.headers.join(","), ...csvRows].join("\r\n");
      const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      triggerDownload(csvBlob, `entitled-persons-${dateStamp}.csv`);
      return;
    }

    if (format === "pdf") {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Entitled Persons", 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated ${new Date().toLocaleString()}`, 14, 26);

      autoTable(doc, {
        startY: 32,
        head: [tableData.headers],
        body: tableData.rows,
        styles: { fontSize: 8, cellWidth: "wrap" },
        headStyles: { fillColor: [29, 78, 216], textColor: 255 },
        alternateRowStyles: { fillColor: [241, 245, 249] }
      });

      doc.save(`entitled-persons-${dateStamp}.pdf`);
      return;
    }

    if (format === "docx") {
      const docx = await import("docx");
      const {
        Document,
        HeadingLevel,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        WidthType
      } = docx;

      const tableRows = [
        new TableRow({
          children: tableData.headers.map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true })]
                  })
                ]
              })
          )
        }),
        ...tableData.rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [new Paragraph({ text: normalizeValue(cell) })]
                  })
              )
            })
        )
      ];

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Entitled Persons",
                heading: HeadingLevel.HEADING_1
              }),
              new Paragraph({
                text: `Generated ${new Date().toLocaleString()}`
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows
              })
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      triggerDownload(blob, `entitled-persons-${dateStamp}.docx`);
    }
  };

  const handleExportClick = (format) => {
    setIsExportMenuOpen(false);
    handleExport(format).catch((error) => {
      console.error(`Failed to export as ${format}`, error);
    });
  };

  if (isMinimized) {
    return (
      <div 
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          zIndex: 1000,
          fontFamily: "sans-serif",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
        onClick={() => setIsMinimized(false)}
      >
        <span style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#1F2937"
        }}>
          Statistics
        </span>
        <span style={{
          fontSize: "12px",
          color: "#6B7280",
          backgroundColor: "#F3F4F6",
          padding: "2px 8px",
          borderRadius: "4px",
          fontWeight: "600"
        }}>
          {totalPeople}
        </span>
        <span style={{
          fontSize: "18px",
          color: "#6B7280",
          lineHeight: "1"
        }}>
          ▼
        </span>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      minWidth: "280px",
      zIndex: 1000,
      fontFamily: "sans-serif"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
        gap: "12px"
      }}>
        <h3 style={{
          margin: "0",
          fontSize: "18px",
          fontWeight: "600",
          color: "#1F2937"
        }}>
          Entitled Persons Statistics
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            ref={exportMenuRef}
            style={{ position: "relative" }}
          >
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              style={{
                backgroundColor: "#1D4ED8",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                fontFamily: "sans-serif",
                boxShadow: "0 1px 2px rgba(15,23,42,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Download current pin data"
            >
              Export
              <span style={{ fontSize: "10px" }}>{isExportMenuOpen ? "^" : "v"}</span>
            </button>
            {isExportMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 12px 24px rgba(15,23,42,0.18)",
                  border: "1px solid #E5E7EB",
                  minWidth: "180px",
                  overflow: "hidden",
                  zIndex: 1100
                }}
              >
                <button
                  type="button"
                  onClick={() => handleExportClick("csv")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: "13px",
                    fontFamily: "sans-serif",
                    cursor: "pointer",
                    color: "#1F2937"
                  }}
                >
                  Export CSV
                </button>
                <div style={{ height: "1px", backgroundColor: "#F3F4F6" }} />
                <button
                  type="button"
                  onClick={() => handleExportClick("pdf")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: "13px",
                    fontFamily: "sans-serif",
                    cursor: "pointer",
                    color: "#1F2937"
                  }}
                >
                  Export PDF
                </button>
                <div style={{ height: "1px", backgroundColor: "#F3F4F6" }} />
                <button
                  type="button"
                  onClick={() => handleExportClick("docx")}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: "13px",
                    fontFamily: "sans-serif",
                    cursor: "pointer",
                    color: "#1F2937"
                  }}
                >
                  Export Word
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#6B7280",
              fontSize: "18px",
              lineHeight: "1",
              fontFamily: "sans-serif"
            }}
            title="Minimize"
          >
            ▲
          </button>
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
        {/* Total */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          backgroundColor: "#F3F4F6",
          borderRadius: "6px"
        }}>
          <span style={{ fontSize: "14px", color: "#4B5563", fontWeight: "500", paddingRight: "5px" }}>
            Total People 
          </span>
          <span style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#1F2937"
          }}>
            {totalPeople}
          </span>
        </div>

        {/* To Evacuate */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          backgroundColor: "#FEE2E2",
          borderRadius: "6px"
        }}>
          <span style={{ fontSize: "14px", color: "#991B1B", fontWeight: "500", paddingRight: "5px" }}>
            To Evacuate 
          </span>
          <span style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#DC2626"
          }}>
            {toEvacuate}
          </span>
        </div>

        {/* Not To Evacuate */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          backgroundColor: "#D1FAE5",
          borderRadius: "6px"
        }}>
          <span style={{ fontSize: "14px", color: "#065F46", fontWeight: "500", paddingRight: "5px" }}>
            Not To Evacuate 
          </span>
          <span style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#059669"
          }}>
            {notToEvacuate}
          </span>
        </div>
      </div>
    </div>
  );
}
