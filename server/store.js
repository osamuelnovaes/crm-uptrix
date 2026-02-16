
export function makeInMemoryStore() {
    const chats = new Map();
    const messages = {};
    const contacts = {};

    function bind(ev) {
        ev.on('connection.update', (update) => {
            Object.assign(connection, update);
        });

        ev.on('chats.set', (item) => {
            const { chats: newChats, isLatest } = item;
            if (isLatest) chats.clear();
            for (const chat of newChats) {
                const id = chat.id;
                const existing = chats.get(id) || {};
                chats.set(id, Object.assign(existing, chat));
            }
        });

        ev.on('chats.upsert', (newChats) => {
            for (const chat of newChats) {
                const id = chat.id;
                const existing = chats.get(id) || {};
                chats.set(id, Object.assign(existing, chat));
            }
        });

        ev.on('chats.update', (updates) => {
            for (const update of updates) {
                const id = update.id;
                const existing = chats.get(id);
                if (existing) {
                    Object.assign(existing, update);
                }
            }
        });

        ev.on('contacts.set', (item) => {
            const { contacts: newContacts } = item;
            for (const contact of newContacts) {
                contacts[contact.id] = Object.assign(contacts[contact.id] || {}, contact);
            }
        });

        ev.on('contacts.upsert', (newContacts) => {
            for (const contact of newContacts) {
                contacts[contact.id] = Object.assign(contacts[contact.id] || {}, contact);
            }
        });

        ev.on('messages.upsert', (item) => {
            const { messages: newMessages, type } = item;
            if (type === 'append' || type === 'notify') {
                for (const msg of newMessages) {
                    const jid = msg.key.remoteJid;
                    if (!messages[jid]) messages[jid] = { array: [] };

                    const list = messages[jid].array;
                    // Check duplicate
                    if (!list.find(m => m.key.id === msg.key.id)) {
                        list.push(msg);
                        // Sort by timestamp
                        // Limit to 50
                        if (list.length > 100) list.shift();
                    }

                    // Update chat last message
                    const chat = chats.get(jid);
                    if (chat) {
                        chat.lastMessage = msg;
                        chat.conversationTimestamp = msg.messageTimestamp;
                        if (!msg.key.fromMe) {
                            chat.unreadCount = (chat.unreadCount || 0) + 1;
                        }
                    } else {
                        chats.set(jid, {
                            id: jid,
                            lastMessage: msg,
                            conversationTimestamp: msg.messageTimestamp,
                            unreadCount: msg.key.fromMe ? 0 : 1
                        });
                    }
                }
            }
        });
    }

    return {
        chats: {
            all: () => Array.from(chats.values()),
            get: (id) => chats.get(id),
            set: (id, c) => chats.set(id, c),
            upsert: (c) => chats.set(c.id, c),
            toJSON: () => Array.from(chats.values())
        },
        messages,
        contacts,
        bind,
        // Helper to mimic deprecated API
        loadMessage: async (jid, id) => {
            const list = messages[jid]?.array || [];
            return list.find(m => m.key.id === id);
        }
    };
}

const connection = {};
