import React, { useState } from 'react';

interface ChartPoint {
  label: string; // Ex: "10/05"
  value: number; // Ex: 75.5
  secondaryValue?: number; // Ex: 18.2 (Percentual de Gordura)
}

interface CustomChartProps {
  data: ChartPoint[];
  title?: string;
  yUnit?: string;
}

const CustomChart: React.FC<CustomChartProps> = ({ data, title = "Evolução Corporal", yUnit = "kg" }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', height: '220px', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', fontStyle: 'italic' }}>
        Sem dados suficientes para gerar o gráfico de evolução.
      </div>
    );
  }

  // Se houver apenas 1 ponto, vamos duplicá-lo ou tratá-lo para que o gráfico desenhe uma linha reta
  const points = data.length === 1 ? [
    { ...data[0], label: "Início" },
    { ...data[0], label: "Atual" }
  ] : data;

  // Dimensões do SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  // Valores limite para escala Y
  const values = points.map(p => p.value);
  const maxValue = Math.max(...values) * 1.05; // 5% de margem no topo
  const minValue = Math.min(...values) * 0.95; // 5% de margem embaixo
  const valueRange = maxValue - minValue === 0 ? 10 : maxValue - minValue;

  // Coordenadas dos pontos
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const svgPoints = points.map((p, index) => {
    const x = paddingLeft + (index / (points.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((p.value - minValue) / valueRange) * chartHeight;
    return { x, y, label: p.label, value: p.value, secondaryValue: p.secondaryValue };
  });

  // Gerar o caminho (Path) da linha
  let linePath = '';
  svgPoints.forEach((pt, idx) => {
    if (idx === 0) {
      linePath += `M ${pt.x} ${pt.y}`;
    } else {
      linePath += ` L ${pt.x} ${pt.y}`;
    }
  });

  // Gerar o caminho (Path) da área preenchida (com gradiente)
  const areaPath = svgPoints.length > 0 
    ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${height - paddingBottom} L ${svgPoints[0].x} ${height - paddingBottom} Z` 
    : '';

  // Gerar valores de referência para o eixo Y
  const yTicksCount = 4;
  const yTicks = Array.from({ length: yTicksCount }).map((_, idx) => {
    const val = minValue + (idx / (yTicksCount - 1)) * valueRange;
    const y = paddingTop + chartHeight - (idx / (yTicksCount - 1)) * chartHeight;
    return { val: val.toFixed(1), y };
  });

  return (
    <div className="chart-card-wrapper">
      <h3 className="info-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title}</span>
        <span style={{ fontSize: '12px', color: 'var(--primary-green)', fontWeight: 'normal' }}>
          Evolução em {yUnit}
        </span>
      </h3>

      <div className="chart-container-inner">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
          <defs>
            {/* Gradiente sob a linha do peso */}
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-green)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary-green)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid Lines Horizontais */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={tick.y} 
                x2={width - paddingRight} 
                y2={tick.y} 
                className="chart-grid-line" 
              />
              <text 
                x={paddingLeft - 8} 
                y={tick.y + 4} 
                textAnchor="end" 
                className="chart-text-y"
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* Eixo X - Rótulos (Labels das datas) */}
          {svgPoints.map((pt, idx) => (
            // Apenas exibir alguns para não amontoar em listas grandes
            (points.length < 8 || idx % Math.ceil(points.length / 5) === 0 || idx === points.length - 1) && (
              <text 
                key={idx} 
                x={pt.x} 
                y={height - paddingBottom + 18} 
                textAnchor="middle" 
                className="chart-text-x"
              >
                {pt.label}
              </text>
            )
          ))}

          {/* Área Preenchida com Gradiente */}
          {areaPath && <path d={areaPath} className="chart-area" />}

          {/* Linha do Gráfico */}
          {linePath && <path d={linePath} className="chart-line" />}

          {/* Pontos Clicáveis/Hoveráveis */}
          {svgPoints.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.index === idx ? 7 : 5}
              className="chart-point"
              onMouseEnter={() => setHoveredPoint({ index: idx, x: pt.x, y: pt.y })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Tooltip flutuante em HTML */}
        {hoveredPoint !== null && (
          <div 
            className="chart-tooltip-bubble"
            style={{ 
              left: `${(hoveredPoint.x / width) * 100}%`, 
              top: `${(hoveredPoint.y / height) * 100}%` 
            }}
          >
            <div><b>Data:</b> {svgPoints[hoveredPoint.index].label}</div>
            <div><b>Peso:</b> {svgPoints[hoveredPoint.index].value} {yUnit}</div>
            {svgPoints[hoveredPoint.index].secondaryValue !== undefined && (
              <div><b>Gordura:</b> {svgPoints[hoveredPoint.index].secondaryValue}%</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomChart;
