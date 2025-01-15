export interface ILinkedInPluginActionService {
    execute: ((...params: unknown[]) => void) | (() => void);
}
