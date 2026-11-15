import React from 'react';

export default function CertificateModal({
  report,
  isGameOver,
  onRestart,
  rescueAvailable = false,
  onRescue
}) {
  if (isGameOver) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ borderColor: '#EF4444' }}>
          <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: 'bold', borderBottom: '2px solid #EF4444', paddingBottom: '8px' }}>
            🚨 MISIÓN EN EMERGENCIA
          </div>
          <div className="modal-desc">
            La salud del explorador llegó a cero. La escasez de recursos y la radiación pueden acumularse con cada Sol.<br /><br />
            {rescueAvailable
              ? 'Puedes usar las reservas de emergencia una sola vez. El explorador se recuperará, pero perderás 25 puntos de ciencia y 10 puntos de supervivencia.'
              : 'El protocolo de rescate ya fue utilizado. Revisa tus decisiones y vuelve a intentarlo.'}
          </div>
          {rescueAvailable && (
            <button className="pixel-btn pixel-btn-green" onClick={onRescue}>
              🚀 ACTIVAR RESCATE · −25 CIENCIA
            </button>
          )}
          <button className="pixel-btn pixel-btn-gold" onClick={onRestart}>
            🔄 REINTENTAR MISIÓN
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <div className="certificate-frame">
          <div style={{ fontSize: '11px', color: '#92400E', marginBottom: '4px' }}>
            MARS RANGERS · CRÁTER JEZERO
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#78350F', letterSpacing: '1px' }}>
            DIPLOMA DE EXPLORADOR
          </div>
          <div style={{ fontSize: '13px', margin: '8px 0' }}>Misión completada por:</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#B45309', borderBottom: '2px dashed #B45309', paddingBottom: '4px', margin: '8px 0' }}>
            {report.cadetName.toUpperCase()}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#78350F', margin: '6px 0' }}>
            {report.rank}
          </div>
          <div style={{ fontSize: '12px', color: '#B45309' }}>
            Puntuación de Supervivencia: {report.avgScore}%
          </div>

          <div style={{ fontSize: '12px', marginTop: '14px', fontWeight: 'bold' }}>
            INSIGNIAS DE MÉRITO ALCANZADAS:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', margin: '12px 0' }}>
            {report.badges.map((b, idx) => (
              <div key={idx} style={{ background: '#FEF3C7', border: '2px solid #D97706', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold' }}>
                ⭐ {b.name}
              </div>
            ))}
          </div>

          <div style={{ fontSize: '10px', color: '#78350F', marginTop: '8px' }}>
            Base Jezero · 7 soles explorados
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' }}>
          <button className="pixel-btn pixel-btn-gold" onClick={() => window.print()}>
            🖨️ IMPRIMIR / GUARDAR DIPLOMA
          </button>
          <button className="pixel-btn" onClick={onRestart}>
            🔄 JUGAR OTRA VEZ
          </button>
        </div>
      </div>
    </div>
  );
}
