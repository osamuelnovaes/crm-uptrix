export const STAGES = [
  { id: 'novo', label: 'Novo Lead', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', icon: 'UserPlus' },
  { id: 'contatado', label: 'Contatado', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', icon: 'Send' },
  { id: 'respondeu', label: 'Respondeu', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', icon: 'MessageCircle' },
  { id: 'ligacao', label: 'Ligação', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)', icon: 'Phone' },
  { id: 'reuniao', label: 'Reunião', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', icon: 'Video' },
  { id: 'proposta', label: 'Proposta', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', icon: 'FileText' },
  { id: 'fechado', label: 'Fechado', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', icon: 'CheckCircle' },
  { id: 'perdido', label: 'Perdido', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', icon: 'XCircle' },
];

export const getStage = (id) => STAGES.find(s => s.id === id) || STAGES[0];

export const getStageIndex = (id) => STAGES.findIndex(s => s.id === id);
