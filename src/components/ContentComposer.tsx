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

export const ContentComposer = ({
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
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.currentTarget.value)}
                    autosize
                    minRows={3}
                    maxRows={8}
                    rightSection={
                        userPrompt ? (
                            <ActionIcon
                                onClick={() => setUserPrompt('')}
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
};