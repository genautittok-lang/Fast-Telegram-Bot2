import { useEffect, useCallback, RefObject } from "react";

interface KeyboardShortcutsOptions {
  inputRef: RefObject<HTMLInputElement | null>;
  bulkTextareaRef?: RefObject<HTMLTextAreaElement | null>;
  bulkMode?: boolean;
  onSubmit: () => void;
  onBulkSubmit?: () => void;
  onSelectType: (index: number) => void;
  onClearResults: () => void;
  onShowHelp: () => void;
  checkTypesCount: number;
  disabled?: boolean;
}

export function useKeyboardShortcuts({
  inputRef,
  bulkTextareaRef,
  bulkMode = false,
  onSubmit,
  onBulkSubmit,
  onSelectType,
  onClearResults,
  onShowHelp,
  checkTypesCount,
  disabled = false,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      const isModifierKey = event.ctrlKey || event.metaKey;

      if ((isModifierKey && event.key === "k") || (isModifierKey && event.key === "K")) {
        event.preventDefault();
        if (bulkMode && bulkTextareaRef?.current) {
          bulkTextareaRef.current.focus();
        } else {
          inputRef.current?.focus();
        }
        return;
      }

      if (isModifierKey && event.key === "Enter") {
        event.preventDefault();
        if (bulkMode && onBulkSubmit) {
          onBulkSubmit();
        } else {
          onSubmit();
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        onClearResults();
        return;
      }

      if (event.key === "?") {
        if (!isInputFocused) {
          event.preventDefault();
          onShowHelp();
        }
        return;
      }

      if (!isInputFocused && !isModifierKey) {
        const num = parseInt(event.key, 10);
        if (num >= 1 && num <= 9 && num <= checkTypesCount) {
          event.preventDefault();
          onSelectType(num - 1);
        }
      }
    },
    [disabled, inputRef, bulkTextareaRef, bulkMode, onSubmit, onBulkSubmit, onSelectType, onClearResults, onShowHelp, checkTypesCount]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

export const shortcuts = [
  { keys: ["Ctrl", "K"], description: "Фокус на пошук" },
  { keys: ["Ctrl", "Enter"], description: "Виконати перевірку" },
  { keys: ["1", "-", "9"], description: "Обрати тип перевірки" },
  { keys: ["Esc"], description: "Очистити результати" },
  { keys: ["?"], description: "Показати підказки" },
];
