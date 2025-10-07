// src/App.tsx
import React from "react";
import CalendarPreview from "./components/CalendarPreview";

export default function App() {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Dashboard</h1>
      <CalendarPreview />
    </div>
  );
}