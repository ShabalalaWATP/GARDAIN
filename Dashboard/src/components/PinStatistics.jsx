import React, { useState } from "react";

export default function PinStatistics({ pinData, isLoading, error }) {
  const [isMinimized, setIsMinimized] = useState(false);

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

  if (!pinData || !Array.isArray(pinData) || pinData.length === 0) {
    return null;
  }

  // Calculate statistics
  const totalPeople = pinData.length;
  const toEvacuate = pinData.filter(person => person.to_evacuate === true).length;
  const notToEvacuate = pinData.filter(person => person.to_evacuate === false).length;

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
        marginBottom: "15px"
      }}>
        <h3 style={{
          margin: "0",
          fontSize: "18px",
          fontWeight: "600",
          color: "#1F2937"
        }}>
          Entitled Persons Statistics
        </h3>
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