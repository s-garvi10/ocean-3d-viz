import React from 'react';
import { BookOpen, ChevronRight, X } from 'lucide-react';

interface LearnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    number: '01',
    title: 'Subsurface Intelligence',
    accent: 'cyan',
    copy: 'Traditional satellites observe the ocean surface. OCEAN-X combines those observations with ARGO profiling floats and physics-informed reconstruction to estimate subsurface temperature and salinity down to 1000m.',
  },
  {
    number: '02',
    title: 'Thermocline Dynamics',
    accent: 'amber',
    copy: 'The thermocline is the layer where temperature changes rapidly with depth. Its boundary helps researchers understand cyclone forecasting, internal wave propagation, and marine ecosystem health.',
  },
  {
    number: '03',
    title: 'ARGO Validation',
    accent: 'teal',
    copy: 'Autonomous ARGO floats profile the ocean and transmit CTD observations. OCEAN-X compares those observations with the model using RMSE, Pearson correlation, and mean bias.',
  },
  {
    number: '04',
    title: 'Interactive Exploration',
    accent: 'blue',
    copy: 'Rotate and zoom the globe, inspect ARGO markers, move through time, and adjust the depth slice from the exploration dock. Select a float to open its scientific inspector.',
  },
];

export const LearnModal: React.FC<LearnModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="guide-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <header className="guide-header">
          <div>
            <span className="eyebrow"><BookOpen size={14} /> OCEAN INTELLIGENCE</span>
            <h2 id="guide-title">A field guide to the subsurface</h2>
            <p>Explore the observations, models, and validation signals behind the globe.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close guide" title="Close guide"><X size={17} /></button>
        </header>
        <div className="guide-grid">
          {sections.map((section) => (
            <article className={`guide-card ${section.accent}`} key={section.number}>
              <span className="guide-number">{section.number}</span>
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
              <ChevronRight size={16} aria-hidden="true" />
            </article>
          ))}
        </div>
        <footer className="guide-footer">
          <span>OCEAN-X · INCOIS</span>
          <button type="button" className="guide-close" onClick={onClose}>Return to exploration</button>
        </footer>
      </section>
    </div>
  );
};
