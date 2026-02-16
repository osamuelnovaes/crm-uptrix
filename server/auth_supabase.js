
import { createClient } from '@supabase/supabase-js';
import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';

export const useSupabaseAuthState = async (supabaseUrl, supabaseKey) => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const writeData = async (data, id) => {
        try {
            await supabase
                .from('whatsapp_sessions')
                .upsert({ id, data: JSON.stringify(data, BufferJSON.replacer) });
        } catch (error) {
            console.error('Error writing auth data', error);
        }
    };

    const readData = async (id) => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .select('data')
                .eq('id', id)
                .single();

            if (error || !data) return null;
            return JSON.parse(data.data, BufferJSON.reviver);
        } catch (error) {
            return null;
        }
    };

    const removeData = async (id) => {
        try {
            await supabase
                .from('whatsapp_sessions')
                .delete()
                .eq('id', id);
        } catch (error) {
            console.error('Error removing auth data', error);
        }
    };

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        },
    };
};
