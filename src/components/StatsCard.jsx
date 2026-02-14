export default function StatsCard({ icon: Icon, label, value, subValue, color }) {
    return (
        <div className="stats-card" style={{ borderTop: `3px solid ${color}` }}>
            <div className="stats-card-header">
                <Icon size={22} style={{ color }} />
                <span className="stats-card-label">{label}</span>
            </div>
            <div className="stats-card-value">{value}</div>
            {subValue && <div className="stats-card-sub">{subValue}</div>}
        </div>
    );
}
