function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      {hint ? <p className="muted">{hint}</p> : null}
    </article>
  );
}

export default StatCard;
