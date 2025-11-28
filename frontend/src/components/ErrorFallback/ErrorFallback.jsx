import React from "react";
import './ErrorFallback.css';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-fallback">
      <h2>⚠️ Something went wrong</h2>

      <p style={{ color: "red" }}>
        {error?.message || "An unexpected error occurred"}
      </p>

      <button onClick={resetErrorBoundary} className="btn-primary">
        🔄 Try Again
      </button>
      <button onClick={() => window.location.reload()} className="btn-secondary">
        ♻️ Refresh App
      </button>
    </div>
  );
}
