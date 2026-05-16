function Panel({ title, eyebrow, children, actions }) {
  return (
    <section className="panel">
      {(title || eyebrow || actions) ? (
        <div className="panel-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h3>{title}</h3> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export default Panel;
