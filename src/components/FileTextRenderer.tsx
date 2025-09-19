import { Flex, LoadingOverlay } from "@mantine/core";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { BaseDirectory, readTextFile } from "@tauri-apps/plugin-fs";
import { IconCheck } from '@tabler/icons-react';
import { getLanguage } from "../helpers/fileTypeManager.ts";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { notifications } from "@mantine/notifications";
import type { FileInfo } from "../models/FileInfo.ts";
import { ContentComposer } from "./ContentComposer.tsx";
import { FileViewer } from "./FileViewer.tsx";
import { estimateTokens } from "../helpers/TokenCounter.ts";
import { readTextFileWithDetectedEncoding } from "../helpers/EncodingManager.ts";
import { useDebouncedValue } from "@mantine/hooks";

const PROMPTS_PATH = import.meta.env.VITE_SYSTEM_PROMPTS_PATH || 'FileCollector/system_prompts.json';
const BASE_DIR = (Number(import.meta.env.VITE_FILE_BASE_PATH) || 21) as BaseDirectory;
const MAX_FILE_SIZE = 200_000;
const LOADER_DELAY_MS = 300;

interface FileTextRendererProps {
    data: string[];
    uncheckItem: (item: string) => void;
    onClearAll: () => void;
}

export const FileTextRenderer = ({ data, uncheckItem, onClearAll }: FileTextRendererProps) => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [systemPrompts, setSystemPrompts] = useState<SystemPromptItem[]>([]);
    const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string | null>(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [reloadNonce, setReloadNonce] = useState(0);

    const [debouncedUserPrompt] = useDebouncedValue(userPrompt, 1000);
    const [composedTotalTokens, setComposedTotalTokens] = useState(0);

    const loadingTimerRef = useRef<number | null>(null);

    const handleReloadContent = useCallback(() => setReloadNonce(n => n + 1), []);

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
        if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current);
        }

        const syncFiles = async () => {
            if (data.length === 0) {
                if (files.length > 0) {
                    setFiles([]);
                    setSelectedFilePath(null);
                }
                setIsLoading(false);
                return;
            }

            loadingTimerRef.current = window.setTimeout(() => {
                setIsLoading(true);
            }, LOADER_DELAY_MS);

            try {
                const filePromises = data.map(async (path): Promise<FileInfo> => {
                    try {
                        const content = await readTextFileWithDetectedEncoding(path);
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
                newFiles.sort((a, b) => {
                    const aHasError = !!a.error;
                    const bHasError = !!b.error;
                    if (aHasError !== bHasError) {
                        return aHasError ? -1 : 1;
                    }
                    return (b.tokenCount ?? 0) - (a.tokenCount ?? 0);
                });
                setFiles(newFiles);

                const dataPathSet = new Set(data);
                if (!selectedFilePath || !dataPathSet.has(selectedFilePath)) {
                    setSelectedFilePath(newFiles.find(f => !f.error)?.path || null);
                }
            } finally {
                if (loadingTimerRef.current) {
                    clearTimeout(loadingTimerRef.current);
                }
                setIsLoading(false);
            }
        };

        syncFiles();

        return () => {
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
            }
        };
    }, [data, reloadNonce]);

    const selectedFile = files.find(f => f.path === selectedFilePath) || null;

    const handleFileSelect = useCallback((file: FileInfo | null) => {
        setSelectedFilePath(file?.path ?? null);
    }, []);

    const fileTokens = useMemo(() =>
        files.reduce((acc, file) => acc + (file.tokenCount || 0), 0), [files]);

    const selectedPrompt = useMemo(() =>
        systemPrompts.find(p => p.id === selectedSystemPromptId), [systemPrompts, selectedSystemPromptId]);

    const systemPromptTokens = useMemo(() =>
        selectedPrompt ? estimateTokens(selectedPrompt.content) : 0, [selectedPrompt]);

    useEffect(() => {
        const userPromptTokens = estimateTokens(debouncedUserPrompt);
        setComposedTotalTokens(systemPromptTokens + userPromptTokens + fileTokens);
    }, [debouncedUserPrompt, fileTokens, systemPromptTokens]);

    const handleCopyAll = useCallback(async () => {
        const filesToCopy = files.filter(file => !file.error);
        const systemPromptContent = selectedPrompt ? selectedPrompt.content : '';

        if (filesToCopy.length === 0 && !userPrompt && !selectedPrompt) {
            notifications.show({
                title: 'No Content to Copy',
                message: 'Select files or write a prompt to generate content.',
                color: 'yellow',
            });
            return;
        }

        try {
            const fileContents = await Promise.all(
                filesToCopy.map(async (file) => {
                    try {
                        const content = await readTextFileWithDetectedEncoding(file.path);
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

            const currentTokens = systemPromptTokens + estimateTokens(userPrompt) + fileTokens;
            notifications.show({
                title: 'Content Copied',
                message: `Successfully copied ~${currentTokens.toLocaleString()} tokens to clipboard.`,
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
    }, [files, selectedPrompt, userPrompt, systemPromptTokens, fileTokens]);

    return (
        <Flex gap="md" h="100%" pos="relative">
            <LoadingOverlay visible={isLoading} overlayProps={{ radius: 'sm', blur: 2 }} />
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
                totalTokens={composedTotalTokens}
            />
            <FileViewer selectedFile={selectedFile} isEmpty={data.length === 0} />
        </Flex>
    );
};