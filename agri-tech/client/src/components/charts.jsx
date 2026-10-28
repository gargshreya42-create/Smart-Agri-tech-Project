import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { CHART_COLORS, STATUS_CHART_COLORS } from '../utils/format';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);
ChartJS.defaults.font.family = "'Nunito Sans', system-ui, sans-serif";
ChartJS.defaults.color = '#5b6b61';

const baseOptions = { responsive: true, maintainAspectRatio: false };
const gridless = { grid: { display: false }, border: { display: false } };
const lightGrid = { grid: { color: '#e9eee5' }, border: { display: false }, beginAtZero: true, ticks: { precision: 0 } };

const colorsFor = (labels) => labels.map((label, i) => STATUS_CHART_COLORS[label] || CHART_COLORS[i % CHART_COLORS.length]);

function Box({ label, children, height }) {
  return <div className="chart-box" role="img" aria-label={label} style={height ? { height } : undefined}>{children}</div>;
}

export function DoughnutChart({ labels, values, label, height }) {
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <Box label={label} height={height}>
      {total === 0 ? <p className="text-muted text-center pt-5 mb-0">No data yet.</p> : (
        <Doughnut
          data={{ labels, datasets: [{ data: values, backgroundColor: colorsFor(labels), borderWidth: 2, borderColor: '#fff' }] }}
          options={{ ...baseOptions, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }}
        />
      )}
    </Box>
  );
}

export function BarChart({ labels, datasets, label, horizontal = false, stacked = false, height, legend = false, color }) {
  const sets = datasets.map((set, i) => ({
    borderRadius: 6,
    backgroundColor: set.color || color || (set.perBar ? colorsFor(labels) : CHART_COLORS[i % CHART_COLORS.length]),
    ...set,
  }));
  return (
    <Box label={label} height={height}>
      <Bar
        data={{ labels, datasets: sets }}
        options={{
          ...baseOptions,
          indexAxis: horizontal ? 'y' : 'x',
          plugins: { legend: { display: legend || sets.length > 1, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
          scales: horizontal ? { x: { ...lightGrid, stacked }, y: { ...gridless, stacked } } : { x: { ...gridless, stacked }, y: { ...lightGrid, stacked } },
        }}
      />
    </Box>
  );
}

export function LineChart({ labels, datasets, label, height, yMax, legend = false }) {
  const sets = datasets.map((set, i) => {
    const color = set.color || CHART_COLORS[i % CHART_COLORS.length];
    return { borderColor: color, backgroundColor: `${color}22`, pointBackgroundColor: color, tension: 0.35, fill: datasets.length === 1, borderWidth: 3, pointRadius: 3, ...set };
  });
  return (
    <Box label={label} height={height}>
      <Line
        data={{ labels, datasets: sets }}
        options={{
          ...baseOptions,
          plugins: { legend: { display: legend || sets.length > 1, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
          scales: { x: gridless, y: { ...lightGrid, max: yMax } },
        }}
      />
    </Box>
  );
}
