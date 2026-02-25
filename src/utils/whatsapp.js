// ─── WhatsApp Integration ─────────────────────────────────

// Mensagem padrão para envio via WhatsApp
export const DEFAULT_WA_MESSAGE = `Oi, tudo bem?
Me chamo Samuel Novaes, fundador da UptrixBr, agência de performance focada em crescimento real para negócios no digital. Trabalhamos do Brasil para outros países com processos claros, comunicação ágil e foco em resultado.

Já ajudamos players do marketing digital a bater múltiplos milhões e, recentemente, pegamos um negócio local sem nenhuma presença online e fizemos o faturamento mensal dobrar e, no terceiro mês, triplicar.

Hoje oferecemos:
\t•\tTráfego pago
\t•\tEstratégia de marketing
\t•\tDesign e identidade visual/digital
\t•\tEdição de vídeo e foto
\t•\tLanding pages
\t•\tAutomações com IA e sistemas para empresas

Busco empresas e pessoas que queiram alguém de confiança para cuidar da performance e facilitar o dia a dia da sua empresa.

Faz sentido uma conversa rápida ? Podemos seguir por aqui ou marcar uma call.`;

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
 * Formata o telefone para o padrão WhatsApp.
 * Apenas remove caracteres não-numéricos, mantendo o número exatamente como cadastrado.
 */
export function formatPhoneForWhatsApp(phone) {
    const digits = cleanPhone(phone);
    if (!digits) return '';
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
 * Abre o WhatsApp Web em uma nova aba com o número pré-preenchido.
 * Usa web.whatsapp.com/send para abrir direto no WhatsApp Web.
 * O usuário pode escanear o QR code do WhatsApp Web e enviar a mensagem.
 * @param {string} phone - Número de telefone (com código do país)
 * @param {string} [message] - Mensagem pré-definida (opcional)
 */
export function openWhatsAppWeb(phone, message = DEFAULT_WA_MESSAGE) {
    const formatted = formatPhoneForWhatsApp(phone);
    if (!formatted) return;

    let url = `https://web.whatsapp.com/send?phone=${formatted}`;
    if (message) {
        url += `&text=${encodeURIComponent(message)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Abre o WhatsApp via wa.me (mobile/desktop app).
 */
export function openWhatsApp(phone, message = '') {
    const link = getWhatsAppLink(phone, message);
    if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
    }
}
