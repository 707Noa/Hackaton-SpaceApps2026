import React from 'react';

function MoxieIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="1.5em"
      height="1.5em"
      role="img"
      aria-label="Máquina MOXIE fabricando oxígeno"
      shapeRendering="crispEdges"
    >
      <rect x="2" y="12" width="20" height="16" rx="2" fill="#4a5d84" stroke="#9fc0f5" strokeWidth="2" />
      <rect x="5" y="15" width="9" height="4" fill="#0f1a2e" />
      <circle cx="9" cy="24" r="3" fill="#f59e0b" stroke="#0f1a2e" strokeWidth="1.5" />
      <rect x="15" y="16" width="4" height="2" fill="#34D399" />
      <rect x="15" y="20" width="4" height="2" fill="#2f6f55" />
      <rect x="22" y="17" width="6" height="3" fill="#6b7a99" />
      <circle cx="25" cy="9" r="6.5" fill="#bae6fd" stroke="#e0f2fe" strokeWidth="1.5" />
      <text x="25" y="11.6" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0c4a6e" fontFamily="system-ui, sans-serif">O₂</text>
      <circle cx="19" cy="5" r="1.6" fill="#e0f2fe" />
      <circle cx="15" cy="8" r="1.1" fill="#e0f2fe" />
    </svg>
  );
}

export default function MissionIcon({ icon }) {
  if (icon === 'moxie') return <MoxieIcon />;
  return <>{icon}</>;
}
