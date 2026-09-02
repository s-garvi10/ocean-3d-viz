import React from 'react';

interface LearnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LearnModal: React.FC<LearnModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      fontFamily: "'Courier New', monospace",
      color: '#c0d0e0',
    }}>
      <div style={{
        background: 'rgba(12, 20, 38, 0.95)',
        border: '1px solid #00aaff',
        boxShadow: '0 0 30px rgba(0, 170, 255, 0.3)',
        borderRadius: 12,
        maxWidth: 700,
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: 28,
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#00ddff', margin: 0, fontSize: 20, letterSpacing: 1 }}>
            ?? OCEAN-X : Outreach & Educational Guide
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #445566',
              color: '#8899bb',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ?
          </button>
        </div>

        {/* Content */}
        <div style={{ fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section>
            <h3 style={{ color: '#ffaa44', fontSize: 14, marginBottom: 6 }}>1. Subsurface Intelligence</h3>
            <p>
              Traditional satellites only monitor the surface layer of the ocean (SST, Sea Surface Height, and ocean color). 
              OCEAN-X couples surface satellite observations with in-situ ARGO profiling floats and physics-informed AI reconstruction 
              to accurately estimate 3D subsurface temperature and salinity profiles down to 1000m.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#00ffaa', fontSize: 14, marginBottom: 6 }}>2. Thermocline Dynamics</h3>
            <p>
              The <strong>thermocline</strong> is the oceanic water layer where temperature decreases rapidly with depth. 
              Understanding its gradient and boundary depth is crucial for cyclone forecasting, internal wave propagation, 
              and marine ecosystem health.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#ff66aa', fontSize: 14, marginBottom: 6 }}>3. ARGO Float Network Validation</h3>
            <p>
              Autonomous profiling floats drift throughout the global oceans, diving to 2000m and surfacing every 10 days to transmit CTD data. 
              OCEAN-X performs real-time validation by calculating RMSE (Root Mean Square Error), Pearson Correlation, 
              and Mean Bias against live ARGO observations.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#88ccff', fontSize: 14, marginBottom: 6 }}>4. Interactive Exploration</h3>
            <ul style={{ paddingLeft: 20 }}>
              <li><strong>Orbit & Zoom:</strong> Drag to rotate the 3D globe, scroll to zoom into regional basins.</li>
              <li><strong>Argo Markers:</strong> Click any glowing marker on the globe to inspect real-time vertical profiles.</li>
              <li><strong>Time & Depth Slider:</strong> Use the bottom toolbar to navigate depth slices and temporal forecast steps.</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 170, 255, 0.2)',
              border: '1px solid #00aaff',
              color: 'white',
              padding: '8px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
