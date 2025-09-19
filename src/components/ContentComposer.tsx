import {
    ActionIcon,
    Button,
    Group,
    Paper,
    Select,
    Stack,
    Text,
    Textarea,
    Title,
    Tooltip,
} from '@mantine/core';
import { IconCopy, IconRefresh, IconTrash, IconX } from '@tabler/icons-react';
import { memo, useEffect, useState } from 'react';
import { SelectedFileList } from './SelectedFileList';
import type { FileInfo } from "../models/FileInfo.ts";

interface ContentComposerProps {
    files: FileInfo[];
    systemPrompts: SystemPromptItem[];
    selectedFile: FileInfo | null;
    userPrompt: string;
    selectedSystemPromptId: string | null;
    onFileSelect: (file: FileInfo | null) => void;
    onUncheckItem: (path: string) => void;
    onCopyAll: () => void;
    onReloadContent: () => void;
    onClearAll: () => void;
    setUserPrompt: (prompt: string) => void;
    setSelectedSystemPromptId: (id: string | null) => void;
    totalTokens: number;
}

export const ContentComposer = memo(({
                                         files,
                                         systemPrompts,
                                         selectedFile,
                                         userPrompt,
                                         selectedSystemPromptId,
                                         onFileSelect,
                                         onUncheckItem,
                                         onCopyAll,
                                         onReloadContent,
                                         onClearAll,
                                         setUserPrompt,
                                         setSelectedSystemPromptId,
                                         totalTokens
                                     }: ContentComposerProps) => {
    const hasFiles = files.length > 0;
    // Local state to manage the textarea's value instantly.
    const [inputValue, setInputValue] = useState(userPrompt);

    // Debounce the update to the parent component's state.
    useEffect(() => {
        const handler = setTimeout(() => {
            if (userPrompt !== inputValue) {
                setUserPrompt(inputValue);
            }
        }, 1000); // 1-second delay after user stops typing.

        return () => {
            clearTimeout(handler);
        };
    }, [inputValue, userPrompt, setUserPrompt]);

    // Sync local state if the parent's prop changes (e.g., from a "clear" button).
    useEffect(() => {
        setInputValue(userPrompt);
    }, [userPrompt]);


    return (
        <Paper withBorder shadow="sm" p="md" h="100%">
            <Stack h="100%" gap="md">
                <Group justify="space-between" align="center">
                    <Title order={5}>Content Composer</Title>
                    <Group gap="xs" align="center">
                        <Text size="xs" c="dimmed" fw={500}>
                            ~{totalTokens.toLocaleString()} tokens
                        </Text>
                        <Tooltip label="Reload content of selected files">
                            <ActionIcon variant="light" size="sm" onClick={onReloadContent} disabled={!hasFiles}>
                                <IconRefresh size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Clear all selected files">
                            <ActionIcon variant="light" color="red" size="sm" onClick={onClearAll} disabled={!hasFiles}>
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Copy composed prompt to clipboard">
                            <Button
                                size="compact-sm"
                                variant="light"
                                onClick={onCopyAll}
                                leftSection={<IconCopy size={14} />}
                                disabled={!hasFiles && !userPrompt && !selectedSystemPromptId}
                            >
                                Copy All
                            </Button>
                        </Tooltip>
                    </Group>
                </Group>

                <Select
                    label="System Prompt"
                    placeholder="Prepend a system prompt..."
                    data={systemPrompts.map(p => ({ value: p.id, label: p.name }))}
                    value={selectedSystemPromptId}
                    onChange={setSelectedSystemPromptId}
                    clearable
                />

                <SelectedFileList
                    files={files}
                    selectedFile={selectedFile}
                    onFileSelect={onFileSelect}
                    onUncheckItem={onUncheckItem}
                />

                <Textarea
                    label="User Prompt"
                    placeholder="Append a user prompt..."
                    value={inputValue} // Bind to local state for responsiveness.
                    onChange={(e) => setInputValue(e.currentTarget.value)} // Update local state on every keystroke.
                    autosize
                    minRows={3}
                    maxRows={8}
                    rightSection={
                        inputValue ? (
                            <ActionIcon
                                onClick={() => setInputValue('')}
                                variant="transparent"
                                c="dimmed"
                                title="Clear prompt"
                                aria-label="Clear prompt"
                            >
                                <IconX size={16} />
                            </ActionIcon>
                        ) : null
                    }
                />
            </Stack>
        </Paper>
    );
});