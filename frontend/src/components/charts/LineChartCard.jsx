import Panel from '../common/Panel';

function LineChartCard({ eyebrow, title, data = [], valueSuffix = '' }) {
  const numeric = data.map((item) => Number(item.value || 0));
  const max = Math.max(...numeric, 1);
  const min = Math.min(...numeric, 0);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
      const y = 100 - (((Number(item.value || 0) - min) / Math.max(max - min, 1)) * 80 + 10);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Panel eyebrow={eyebrow} title={title}>
      {!data.length ? (
        <p className="muted">No chart data yet.</p>
      ) : (
        <div className="line-chart-wrap">
          <svg viewBox="0 0 100 100" className="line-chart" preserveAspectRatio="none" aria-hidden="true">
            <polyline fill="none" stroke="url(#lineGradient)" strokeWidth="3" points={points} />
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5b6c63" />
                <stop offset="100%" stopColor="#c79372" />
              </linearGradient>
            </defs>
          </svg>
          <div className="chart-footer-grid">
            {data.map((item) => (
              <div key={item.label} className="chart-footer-item">
                <span>{item.label}</span>
                <strong>
                  {item.value}
                  {valueSuffix}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

export default LineChartCard;
