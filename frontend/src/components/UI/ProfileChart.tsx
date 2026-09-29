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
  const isTemp = variable === 'temperature';
  const data: any[] = [
    {
      type: 'scatter',
      mode: 'lines+markers',
      x: isTemp ? profile.temperatures : profile.salinities,
      y: profile.depths,
      line: { color: isTemp ? '#00ddff' : '#00ffaa', width: 2 },
      marker: { color: isTemp ? '#00ddff' : '#00ffaa', size: 4 },
      name: isTemp ? 'Temperature' : 'Salinity',
    },
  ];

  return (
    <div style={{ background: 'rgba(5,10,18,0.45)', border: '1px solid rgba(120,190,220,0.1)', borderRadius: 8, padding: 6 }}>
      <div style={{ color: '#9bb0be', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
        DEPTH PROFILE
      </div>
      <Plot
        data={data}
        layout={{
          height: 160,
          margin: { l: 35, r: 10, t: 10, b: 35 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#9bb0be', family: 'Lato, sans-serif', size: 9 },
          xaxis: {
            title: isTemp ? 'Temp (°C)' : 'Sal (PSU)',
            gridcolor: 'rgba(120,190,220,0.1)',
            zeroline: false,
            color: '#8899bb',
          },
          yaxis: {
            title: 'Depth (m)',
            autorange: 'reversed',
            gridcolor: 'rgba(120,190,220,0.1)',
            zeroline: false,
            color: '#8899bb',
          },
        } as any}
        config={{ displayModeBar: false }}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default ProfileChart;
