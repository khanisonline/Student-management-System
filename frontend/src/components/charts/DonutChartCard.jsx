import Panel from '../common/Panel';

function DonutChartCard({ eyebrow, title, data = [] }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let offset = 0;
  const colors = ['#5f7668', '#c79372', '#b66b67', '#a28d5f'];

  return (
    <Panel eyebrow={eyebrow} title={title}>
      {!data.length || !total ? (
        <p className="muted">No chart data yet.</p>
      ) : (
        <div className="donut-layout">
          <svg viewBox="0 0 42 42" className="donut-chart" aria-hidden="true">
            <circle className="donut-ring" cx="21" cy="21" r="15.915" />
            {data.map((item, index) => {
              const value = Number(item.value || 0);
              const length = (value / total) * 100;
              const segment = (
                <circle
                  key={item.label}
                  className="donut-segment"
                  cx="21"
                  cy="21"
                  r="15.915"
                  stroke={colors[index % colors.length]}
                  strokeDasharray={`${length} ${100 - length}`}
                  strokeDashoffset={25 - offset}
                />
              );
              offset += length;
              return segment;
            })}
          </svg>
          <div className="legend-list">
            {data.map((item, index) => (
              <div key={item.label} className="legend-row">
                <span className="legend-dot" style={{ background: colors[index % colors.length] }} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

export default DonutChartCard;
