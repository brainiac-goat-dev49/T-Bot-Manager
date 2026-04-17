import { BotCommand, TelegramUpdate, TelegramUser, BotDescription, BotShortDescription } from '../types';

/**
 * Internal helper to handle the bridge to the Vercel Serverless Function.
 * This replaces the direct calls and CORS proxy for better reliability.
 */
async function executeApiCall<T>(token: string, method: string, body?: any): Promise<T> {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        method,
        payload: body,
      }),
    });

    const data = await response.json();

    // Specific handling for Rate Limiting (429)
    if (response.status === 429 || (data.error_code === 429)) {
      const retryAfter = data.parameters?.retry_after || 5;
      throw new Error(`Too Many Requests: retry after ${retryAfter} seconds`);
    }

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API Error');
    }

    return data.result as T;
  } catch (error: any) {
    console.error(`[TelegramService] Error in ${method}:`, error.message);
    throw new Error(error.message || 'Connection to API failed');
  }
}

export const telegramService = {
  async callApi<T>(token: string, method: string, body?: any): Promise<T> {
    return executeApiCall<T>(token, method, body);
  },

  async getMe(token: string): Promise<TelegramUser> {
    return executeApiCall<TelegramUser>(token, 'getMe');
  },

  async getMyDescription(token: string): Promise<BotDescription> {
    return executeApiCall<BotDescription>(token, 'getMyDescription');
  },

  async getMyShortDescription(token: string): Promise<BotShortDescription> {
    return executeApiCall<BotShortDescription>(token, 'getMyShortDescription');
  },

  async getMyCommands(token: string): Promise<BotCommand[]> {
    return executeApiCall<BotCommand[]>(token, 'getMyCommands');
  },

  async setMyDescription(token: string, description: string): Promise<boolean> {
    return executeApiCall<boolean>(token, 'setMyDescription', { description });
  },

  async setMyShortDescription(token: string, shortDescription: string): Promise<boolean> {
    return executeApiCall<boolean>(token, 'setMyShortDescription', { short_description: shortDescription });
  },

  async setMyCommands(token: string, commands: BotCommand[]): Promise<boolean> {
    const apiCommands = commands.map(({ command, description }) => ({ command, description }));
    return executeApiCall<boolean>(token, 'setMyCommands', { commands: apiCommands });
  },

  async sendMessage(token: string, chatId: number, text: string): Promise<any> {
    return executeApiCall(token, 'sendMessage', { chat_id: chatId, text });
  },

  async getUpdates(token: string, offset: number): Promise<TelegramUpdate[]> {
    return executeApiCall<TelegramUpdate[]>(token, 'getUpdates', { offset, timeout: 0 });
  },

  async getWebhookInfo(token: string): Promise<any> {
    return executeApiCall<any>(token, 'getWebhookInfo');
  },

  async deleteWebhook(token: string, dropPendingUpdates: boolean = false): Promise<boolean> {
    return executeApiCall<boolean>(token, 'deleteWebhook', { drop_pending_updates: dropPendingUpdates });
  },
  
  async setMyName(token: string, name: string): Promise<boolean> {
      return executeApiCall<boolean>(token, 'setMyName', { name });
  },

  async getBotProfilePhotoUrl(token: string, userId: number): Promise<string | null> {
    try {
      const photos = await executeApiCall<any>(token, 'getUserProfilePhotos', { user_id: userId, limit: 1 });
      
      if (photos.total_count > 0 && photos.photos.length > 0) {
        const photoArray = photos.photos[0];
        const bestPhoto = photoArray[photoArray.length - 1];
        const file = await executeApiCall<any>(token, 'getFile', { file_id: bestPhoto.file_id });
        
        if (file.file_path) {
          // Construct URL (Direct Telegram File URL still works if browser has access, 
          // but usually requires the bot token in the URL)
          return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        }
      }
      return null;
    } catch (e) {
      console.warn('Failed to fetch bot profile photo', e);
      return null;
    }
  }
};
