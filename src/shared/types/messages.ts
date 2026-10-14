import { ExtractedDocument } from './contract';
import { AnalysisReport } from './analysis';
import { UserSettings } from './settings';

export type MessageAction =
  | 'EXTRACT_DOCUMENT'
  | 'GET_CURRENT_DOCUMENT'
  | 'START_ANALYSIS'
  | 'TEST_CONNECTION'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'CLEAR_API_KEY';

export interface BaseMessage {
  action: MessageAction;
}

export interface ExtractDocumentMessage extends BaseMessage {
  action: 'EXTRACT_DOCUMENT';
}

export interface GetCurrentDocumentMessage extends BaseMessage {
  action: 'GET_CURRENT_DOCUMENT';
}

export interface StartAnalysisMessage extends BaseMessage {
  action: 'START_ANALYSIS';
  document: ExtractedDocument;
  overrideSettings?: Partial<UserSettings>;
}

export interface TestConnectionMessage extends BaseMessage {
  action: 'TEST_CONNECTION';
  settings: UserSettings;
}

export interface GetSettingsMessage extends BaseMessage {
  action: 'GET_SETTINGS';
}

export interface SaveSettingsMessage extends BaseMessage {
  action: 'SAVE_SETTINGS';
  settings: UserSettings;
}

export interface ClearApiKeyMessage extends BaseMessage {
  action: 'CLEAR_API_KEY';
}

export type ExtensionMessage =
  | ExtractDocumentMessage
  | GetCurrentDocumentMessage
  | StartAnalysisMessage
  | TestConnectionMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | ClearApiKeyMessage;

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
