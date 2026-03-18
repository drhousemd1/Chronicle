import React from "react";

const ApiInspectorPage: React.FC = () => {
  return (
    <iframe
      title="API Call Inspector"
      src="/api-call-inspector-chronicle.html"
      style={{ width: "100vw", height: "100vh", border: "none", display: "block" }}
    />
  );
};

export default ApiInspectorPage;
