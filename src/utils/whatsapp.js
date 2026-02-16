// ─── WhatsApp Integration ─────────────────────────────────

export const WA_STATUS = {
    NAO_ENVIADO: 'nao_enviado',
    ENVIADO: 'enviado',
    RESPONDIDO: 'respondido',
};

export const WA_STATUS_LABELS = {
    [WA_STATUS.NAO_ENVIADO]: 'Não Enviado',
    [WA_STATUS.ENVIADO]: 'Enviado',
    [WA_STATUS.RESPONDIDO]: 'Respondido',
};

export const WA_STATUS_COLORS = {
    [WA_STATUS.NAO_ENVIADO]: '#ef4444',  // red
    [WA_STATUS.ENVIADO]: '#eab308',       // yellow
    [WA_STATUS.RESPONDIDO]: '#22c55e',    // green
};

/**
 * Limpa o telefone e retorna apenas dígitos.
 */
export function cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

/**
 * Formata o telefone para o padrão WhatsApp (com código do país 55 para Brasil).
 * Aceita formatos: (11) 99999-9999, 11999999999, +5511999999999, etc.
 */
export function formatPhoneForWhatsApp(phone) {
    const digits = cleanPhone(phone);
    if (!digits) return '';

    // Se já começa com 55 e tem 12-13 dígitos, usar como está
    if (digits.startsWith('55') && digits.length >= 12) {
        return digits;
    }

    // Se tem 10-11 dígitos (DDD + número), adicionar 55
    if (digits.length >= 10 && digits.length <= 11) {
        return '55' + digits;
    }

    // Caso contrário, retornar como está (pode ser número internacional)
    return digits;
}

/**
 * Gera o link wa.me para abrir conversa no WhatsApp.
 * @param {string} phone - Número de telefone
 * @param {string} [message] - Mensagem pré-definida (opcional)
 * @returns {string} URL do WhatsApp
 */
export function getWhatsAppLink(phone, message = '') {
    const formatted = formatPhoneForWhatsApp(phone);
    if (!formatted) return '';

    let url = `https://wa.me/${formatted}`;
    if (message) {
        url += `?text=${encodeURIComponent(message)}`;
    }
    return url;
}

/**
 * Abre o WhatsApp em uma nova aba.
 */
export function openWhatsApp(phone, message = '') {
    const link = getWhatsAppLink(phone, message);
    if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
    }
}
