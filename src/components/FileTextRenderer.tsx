import { Flex, Center, Loader, Text, Stack } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { BaseDirectory, readTextFile } from "@tauri-apps/plugin-fs";
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { getLanguage } from "../helpers/fileTypeManager.ts";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { notifications } from "@mantine/notifications";
import type { FileInfo } from "../models/FileInfo.ts";
import { ContentComposer } from "./ContentComposer.tsx";
import { FileViewer } from "./FileViewer.tsx";
import { estimateTokens } from "../helpers/TokenCounter.ts";

const PROMPTS_PATH = import.meta.env.VITE_SYSTEM_PROMPTS_PATH || 'FileCollector/system_prompts.json';
const BASE_DIR = (Number(import.meta.env.VITE_FILE_BASE_PATH) || 21) as BaseDirectory;
const MAX_FILE_SIZE = 200_000;

interface FileTextRendererProps {
    data: string[];
    uncheckItem: (item: string) => void;
    onClearAll: () => void;
}

export const FileTextRenderer = ({ data, uncheckItem, onClearAll }: FileTextRendererProps) => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [systemPrompts, setSystemPrompts] = useState<SystemPromptItem[]>([]);
    const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string | null>(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [reloadNonce, setReloadNonce] = useState(0);

    const handleReloadContent = () => setReloadNonce(n => n + 1);

    useEffect(() => {
        const getSystemPrompts = async () => {
            try {
                const content = await readTextFile(PROMPTS_PATH, { baseDir: BASE_DIR });
                const prompts = content ? JSON.parse(content) : [];
                if (Array.isArray(prompts)) {
                    setSystemPrompts(prompts);
                }
            } catch (e) {
                setSystemPrompts([]);
            }
        };
        getSystemPrompts();
    }, []);

    useEffect(() => {
        const syncFiles = async () => {
            if (data.length === 0) {
                setFiles([]);
                setSelectedFilePath(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            const filePromises = data.map(async (path): Promise<FileInfo> => {
                try {
                    const content = await readTextFile(path);
                    if (content.length > MAX_FILE_SIZE) {
                        return {
                            path,
                            error: `File is too large (over ${MAX_FILE_SIZE / 1000}k characters).`,
                        };
                    }
                    return {
                        path,
                        language: getLanguage(path),
                        tokenCount: estimateTokens(content),
                    };
                } catch (e) {
                    return {
                        path,
                        error: `Failed to read file: ${e instanceof Error ? e.message : String(e)}`,
                    };
                }
            });

            const newFiles = await Promise.all(filePromises);
            newFiles.sort((a, b) => (b.tokenCount ?? 0) - (a.tokenCount ?? 0));
            setFiles(newFiles);

            const dataPathSet = new Set(data);
            if (!selectedFilePath || !dataPathSet.has(selectedFilePath)) {
                setSelectedFilePath(newFiles.find(f => !f.error)?.path || null);
            }

            setIsLoading(false);
        };

        syncFiles();
    }, [data, reloadNonce]);

    const selectedFile = useMemo(() => files.find(f => f.path === selectedFilePath) || null, [files, selectedFilePath]);

    const handleFileSelect = (file: FileInfo | null) => {
        setSelectedFilePath(file?.path ?? null);
    };

    const totalTokens = useMemo(() => {
        const selectedPrompt = systemPrompts.find(p => p.id === selectedSystemPromptId);
        const systemPromptTokens = selectedPrompt ? estimateTokens(selectedPrompt.content) : 0;
        const userPromptTokens = estimateTokens(userPrompt);
        const fileTokens = files.reduce((acc, file) => acc + (file.tokenCount || 0), 0);
        return systemPromptTokens + userPromptTokens + fileTokens;
    }, [files, systemPrompts, selectedSystemPromptId, userPrompt]);

    const handleCopyAll = async () => {
        const filesToCopy = files.filter(file => !file.error);
        const selectedPrompt = systemPrompts.find(p => p.id === selectedSystemPromptId);

        if (filesToCopy.length === 0 && !userPrompt && !selectedPrompt) {
            notifications.show({
                title: 'No Content to Copy',
                message: 'Select files or write a prompt to generate content.',
                color: 'yellow',
            });
            return;
        }

        try {
            const systemPromptContent = selectedPrompt ? selectedPrompt.content : '';

            const fileContents = await Promise.all(
                filesToCopy.map(async (file) => {
                    try {
                        const content = await readTextFile(file.path);
                        return `FILE PATH: ${file.path}\n\nCONTENT:\n\`\`\`${file.language || ''}\n${content}\n\`\`\``;
                    } catch {
                        return `FILE PATH: ${file.path}\n\nCONTENT:\n\`\`\`\n--- ERROR READING FILE ---\n\`\`\``;
                    }
                })
            );

            const contentParts = [];
            if (systemPromptContent.trim()) contentParts.push(`SYSTEM PROMPT:\n\n${systemPromptContent.trim()}`);
            if (fileContents.length > 0) contentParts.push(fileContents.join('\n\n---\n\n'));
            if (userPrompt.trim()) contentParts.push(`USER PROMPT:\n\n${userPrompt.trim()}`);
            const formattedContent = contentParts.join('\n\n---\n\n');

            await writeText(formattedContent);
            notifications.show({
                title: 'Content Copied',
                message: `Successfully copied ~${totalTokens.toLocaleString()} tokens to clipboard.`,
                color: 'green',
                icon: <IconCheck size={18} />,
            });
        } catch (e) {
            notifications.show({
                title: 'Copy Failed',
                message: 'Could not write content to the clipboard.',
                color: 'red',
            });
        }
    };

    if (data.length === 0 && !isLoading) {
        return <Center h="100%"><Stack align="center"><IconInfoCircle size={48} stroke={1.5} color="var(--mantine-color-gray-5)" /><Text c="dimmed">Select files from the tree to begin.</Text></Stack></Center>;
    }

    if (isLoading) {
        return <Center h="100%"><Loader /></Center>;
    }

    return (
        <Flex gap="md" h="100%">
            <ContentComposer
                files={files}
                systemPrompts={systemPrompts}
                selectedFile={selectedFile}
                userPrompt={userPrompt}
                selectedSystemPromptId={selectedSystemPromptId}
                onFileSelect={handleFileSelect}
                onUncheckItem={uncheckItem}
                onCopyAll={handleCopyAll}
                onReloadContent={handleReloadContent}
                onClearAll={onClearAll}
                setUserPrompt={setUserPrompt}
                setSelectedSystemPromptId={setSelectedSystemPromptId}
                totalTokens={totalTokens}
            />
            <FileViewer selectedFile={selectedFile} />
        </Flex>
    );
};