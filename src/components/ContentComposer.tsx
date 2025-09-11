import { FC } from 'react';
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
} from '@mantine/core';
import { IconCopy, IconX } from '@tabler/icons-react';
import { SelectedFileList } from './SelectedFileList';
import {FileInfo} from "../models/FileInfo.ts";

interface ContentComposerProps {
    files: FileInfo[];
    systemPrompts: SystemPromptItem[];
    selectedFile: FileInfo | null;
    userPrompt: string;
    selectedSystemPromptId: string | null;
    onFileSelect: (file: FileInfo | null) => void;
    onUncheckItem: (path: string) => void;
    onCopyAll: () => void;
    setUserPrompt: (prompt: string) => void;
    setSelectedSystemPromptId: (id: string | null) => void;
    totalTokens: number;
}

export const ContentComposer: FC<ContentComposerProps> = ({
                                                              files,
                                                              systemPrompts,
                                                              selectedFile,
                                                              userPrompt,
                                                              selectedSystemPromptId,
                                                              onFileSelect,
                                                              onUncheckItem,
                                                              onCopyAll,
                                                              setUserPrompt,
                                                              setSelectedSystemPromptId,
                                                              totalTokens
                                                          }) => {
    return (
        <Paper withBorder shadow="sm" p="md" h="100%">
            <Stack h="calc(100vh - 200px)">
                <Group justify="space-between" align="center">
                    <Title order={5}>Content Composer</Title>
                    <Group gap="xs" align="center">
                        <Text size="xs" c="dimmed">
                            ~{totalTokens.toLocaleString()} tokens
                        </Text>
                        <Button
                            size="compact-sm"
                            variant="light"
                            onClick={onCopyAll}
                            leftSection={<IconCopy size={14} />}
                        >
                            Copy All
                        </Button>
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
                    minRows={2}
                    rightSection={
                        <ActionIcon
                            onClick={() => setUserPrompt('')}
                            variant="transparent"
                            c="dimmed"
                            title="Clear prompt"
                            aria-label="Clear prompt"
                        >
                            <IconX size={16} />
                        </ActionIcon>
                    }
                />
            </Stack>
        </Paper>
    );
};