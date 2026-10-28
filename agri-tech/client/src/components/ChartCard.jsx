// Card wrapper that pairs every chart with the question it answers.
export default function ChartCard({ title, question, children, className = '' }) {
  return (
    <section className={`card section-card h-100 ${className}`}>
      <h2 className="h6 mb-0">{title}</h2>
      {question && <p className="small text-muted mb-3">{question}</p>}
      {children}
    </section>
  );
}
