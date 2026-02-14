import { Users, CheckCircle, DollarSign, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { STAGES, getStage } from '../utils/stages';
import StatsCard from './StatsCard';

function formatCurrency(value) {
    return 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getDisplayName(lead) {
    if (lead.nome) return lead.nome;
    if (lead.telefone) return lead.telefone;
    if (lead.email) return lead.email;
    return `Lead #${lead.id}`;
}

export default function Dashboard({ leads, onLeadClick }) {
    const totalLeads = leads.length;

    const fechados = leads.filter(l => l.stage === 'fechado');
    const propostas = leads.filter(l => l.stage === 'proposta');
    const perdidos = leads.filter(l => l.stage === 'perdido');

    const faturamentoReal = fechados.reduce((sum, l) => sum + (l.valorProposta || 0), 0);
    const faturamentoProjetado = propostas.reduce((sum, l) => sum + (l.valorProposta || 0), 0);

    const funnelData = STAGES.filter(s => s.id !== 'perdido').map(stage => ({
        name: stage.label,
        leads: leads.filter(l => l.stage === stage.id).length,
        color: stage.color,
    }));

    const pieData = [
        { name: 'Faturamento Real', value: faturamentoReal, color: '#22c55e' },
        { name: 'Projeção (Propostas)', value: faturamentoProjetado, color: '#a855f7' },
    ].filter(d => d.value > 0);

    const taxaConversao = totalLeads > 0
        ? ((fechados.length / totalLeads) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="dashboard-view">
            <h2 className="dashboard-title"><BarChart3 size={24} /> Dashboard</h2>

            <div className="stats-grid">
                <StatsCard
                    icon={Users}
                    label="Total de Leads"
                    value={totalLeads}
                    color="#3b82f6"
                />
                <StatsCard
                    icon={CheckCircle}
                    label="Contratos Fechados"
                    value={fechados.length}
                    subValue={`Taxa de conversão: ${taxaConversao}%`}
                    color="#22c55e"
                />
                <StatsCard
                    icon={DollarSign}
                    label="Faturamento Real"
                    value={formatCurrency(faturamentoReal)}
                    subValue={`${fechados.length} contratos`}
                    color="#22c55e"
                />
                <StatsCard
                    icon={TrendingUp}
                    label="Faturamento Projetado"
                    value={formatCurrency(faturamentoProjetado)}
                    subValue={`${propostas.length} propostas abertas`}
                    color="#a855f7"
                />
            </div>

            <div className="dashboard-charts">
                <div className="chart-card">
                    <h3 className="chart-title">Funil de Leads</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                            />
                            <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">Faturamento</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="chart-empty">
                            <DollarSign size={48} />
                            <p>Nenhum valor registrado ainda</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-tables">
                {propostas.length > 0 && (
                    <div className="table-card">
                        <h3 className="chart-title"><FileText size={18} /> Propostas Abertas</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Contato</th>
                                        <th>Empresa</th>
                                        <th>Valor</th>
                                        <th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {propostas.map(lead => (
                                        <tr key={lead.id} onClick={() => onLeadClick(lead)} className="clickable-row">
                                            <td>{getDisplayName(lead)}</td>
                                            <td>{lead.empresa || '—'}</td>
                                            <td className="value-cell">{formatCurrency(lead.valorProposta || 0)}</td>
                                            <td>{new Date(lead.atualizadoEm).toLocaleDateString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {fechados.length > 0 && (
                    <div className="table-card">
                        <h3 className="chart-title"><CheckCircle size={18} /> Contratos Fechados</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Contato</th>
                                        <th>Empresa</th>
                                        <th>Valor</th>
                                        <th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fechados.map(lead => (
                                        <tr key={lead.id} onClick={() => onLeadClick(lead)} className="clickable-row">
                                            <td>{getDisplayName(lead)}</td>
                                            <td>{lead.empresa || '—'}</td>
                                            <td className="value-cell">{formatCurrency(lead.valorProposta || 0)}</td>
                                            <td>{new Date(lead.atualizadoEm).toLocaleDateString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {perdidos.length > 0 && (
                    <div className="table-card lost-table">
                        <h3 className="chart-title" style={{ color: '#ef4444' }}>Leads Perdidos: {perdidos.length}</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
