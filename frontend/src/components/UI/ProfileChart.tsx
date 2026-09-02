import React from 'react';
import Plot from 'react-plotly.js';

interface ProfileChartProps {
  profile: {
    depths: number[];
    temperatures: number[];
    salinities: number[];
  };
  variable: string;
}

const ProfileChart: React.FC<ProfileChartProps> = ({ profile, variable }) => {
  const data: any[] = [
    {
      type: 'scatter',
      mode: 'lines+markers',
      x: variable === 'temperature' ? profile.temperatures : profile.salinities,
      y: profile.depths,
      line: { color: '#00ddff', width: 2 },
      marker: { color: '#00ddff', size: 4 },
      name: variable === 'temperature' ? 'Temperature' : 'Salinity',
    },
  ];

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 8 }}>
      <div style={{ color: '#88ccff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        DEPTH SLICE VIEW
      </div>
      <Plot
        data={data}
        layout={{
          height: 160,
          margin: { l: 30, r: 10, t: 10, b: 30 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#8899bb', family: 'monospace', size: 9 },
          xaxis: {
            title: variable === 'temperature' ? 'Temp (°C)' : 'Sal (PSU)',
            gridcolor: '#1a2a3a',
            zeroline: false,
            color: '#8899bb'
          },
          yaxis: {
            title: 'Depth (m)',
            autorange: 'reversed',
            gridcolor: '#1a2a3a',
            zeroline: false,
            color: '#8899bb'
          },
        } as any}
        config={{ displayModeBar: false }}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default ProfileChart;
