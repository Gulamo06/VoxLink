import api from './api';

export const agoraService = {
  getToken: async (channel: string, uid: string) => {
    const response = await api.get<{ token: string }>(`/agora/token?channel=${encodeURIComponent(channel)}&uid=${encodeURIComponent(uid)}`);
    return response.data.token;
  }
};
