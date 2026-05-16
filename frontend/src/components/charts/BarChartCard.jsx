import Panel from '../common/Panel';

function BarChartCard({ eyebrow, title, data = [], valueSuffix = '' }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);

  return (
    <Panel eyebrow={eyebrow} title={title}>
      {!data.length ? (
        <p className="muted">No chart data yet.</p>
      ) : (
        <div className="chart-stack">
          {data.map((item) => (
            <div key={item.label} className="bar-row">
              <div className="bar-copy">
                <span>{item.label}</span>
                <strong>
                  {item.value}
                  {valueSuffix}
                </strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(Number(item.value) / maxValue) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default BarChartCard;
