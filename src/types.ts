export interface TelegramCommand {
    command: string;
    description: string;
    response?: string;
}

export type BotCommand = TelegramCommand;

export interface BotAIConfig {
    enabled: boolean;
    systemInstruction: string;
    useReasoning: boolean;
    useSearch: boolean;
    knowledgeBase?: string;
    trainingUrls?: string[];
}

export interface MaintenanceConfig {
    enabled: boolean;
    message: string;
}

export interface BotIntegrationsConfig {
    [key: string]: any;
}

export interface ConnectedBot {
    id: string;
    token: string;
    name: string;
    username: string;
    description: string;
    shortDescription: string;
    commands: TelegramCommand[];
    photoUrl?: string | null;
    isPolling: boolean;
    userId: string;
    createdAt?: any;
    aiConfig: BotAIConfig;
    maintenanceConfig: MaintenanceConfig;
    integrations: BotIntegrationsConfig;
    script: string;
}

export interface LogEntry {
    id: string;
    botId: string;
    timestamp: Date;
    type: 'info' | 'error' | 'in' | 'out';
    message: string;
    details?: string | null;
}

export interface BillingTransaction {
    id: string;
    userId: string;
    amount: number;
    date: Date;
    status: 'Paid' | 'Processing' | 'Failed';
    plan: string;
    invoiceUrl?: string;
}

export interface TelegramUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export interface TelegramChat {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    first_name?: string;
    last_name?: string;
    username?: string;
    title?: string;
}

export interface TelegramMessage {
    message_id: number;
    from: TelegramUser;
    chat: TelegramChat;
    date: number;
    text?: string;
}

export interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    edited_message?: TelegramMessage;
    callback_query?: any;
}

export interface BotDescription {
    description: string;
}

export interface BotShortDescription {
    short_description: string;
}
