// Pill-style tab bar. tabs: [{ id, label, icon }]
export default function Tabs({ tabs, active, onChange }) {
  return (
    <ul className="nav nav-pills nav-pills-agri mb-3" role="tablist">
      {tabs.map((tab) => (
        <li key={tab.id} className="nav-item" role="presentation">
          <button type="button" role="tab" aria-selected={active === tab.id} className={`nav-link ${active === tab.id ? 'active' : ''}`} onClick={() => onChange(tab.id)}>
            {tab.icon && <i className={`bi ${tab.icon} me-1`} aria-hidden="true" />}{tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
