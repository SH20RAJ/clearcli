export { TrashManager } from './TrashManager';
export { QuarantineManager } from './QuarantineManager';
export { SafetyManager } from './SafetyManager';
export { MacOSTrash } from './MacOSTrash';
export { WindowsTrash } from './WindowsTrash';
export { LinuxTrash } from './LinuxTrash';
export type {
    TrashProvider,
    TrashResult,
    Platform,
    QuarantineEntry,
    QuarantineIndex,
    SafetyValidationResult,
    DeletionOptions,
    DeletionResult,
    ConfirmationPrompt,
    ConfirmationResult
} from './types';