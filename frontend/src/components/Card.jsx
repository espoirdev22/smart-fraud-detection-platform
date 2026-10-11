function Card({ title, accent = "alert", className = "", children }) {
    const accents = {
      alert: "border-t-alert",
      safe: "border-t-safe",
      warn: "border-t-warn",
    };
  
    return (
      <div
        className={`bg-surface border border-border border-t-2 ${accents[accent]} rounded-lg shadow-card p-6 ${className}`}
      >
        {title && (
          <h2 className="font-mono text-sm text-muted uppercase tracking-wide mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    );
  }
  
  export default Card;