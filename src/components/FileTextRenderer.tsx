import {
    Grid,
    Center,
    Loader,
    Text,
} from "@mantine/core";
import {useEffect, useMemo, useState} from "react";
import {BaseDirectory, readTextFile} from "@tauri-apps/plugin-fs";
import {IconCheck} from '@tabler/icons-react';
import {getLanguage} from "../helpers/fileTypeManager.ts";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import {notifications} from "@mantine/notifications";
import type { FileInfo } from "../models/FileInfo.ts";
import {ContentComposer} from "./ContentComposer.tsx";
import {FileViewer} from "./FileViewer.tsx";
import {estimateTokens} from "../helpers/TokenCounter.ts";

const PROMPTS_PATH = import.meta.env.VITE_SYSTEM_PROMPTS_PATH || 'FileCollector/system_prompts.json';
const BASE_DIR = (Number(import.meta.env.VITE_FILE_BASE_PATH) || 21) as BaseDirectory;
const MAX_FILE_SIZE = 200_000;

interface FileTextRendererProps {
    data: string[];
    uncheckItem: (item: string) => void;
}

export const FileTextRenderer = ({data, uncheckItem}: FileTextRendererProps) => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

    const [systemPrompts, setSystemPrompts] = useState<SystemPromptItem[]>([]);
    const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string | null>(null);
    const [userPrompt, setUserPrompt] = useState('');

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
        }
        getSystemPrompts();
    }, []);

    useEffect(() => {
        const syncFiles = async () => {
            const dataPathSet = new Set(data);

            const keptFiles = files.filter(f => dataPathSet.has(f.path));
            const currentPathSet = new Set(keptFiles.map(f => f.path));
            const pathsToFetch = data.filter(path => !currentPathSet.has(path));

            let newFiles: FileInfo[] = [];
            if (pathsToFetch.length > 0) {
                const filePromises = pathsToFetch.map(async (path): Promise<FileInfo> => {
                    try {
                        const content = await readTextFile(path);
                        if (content.length > MAX_FILE_SIZE) {
                            return {
                                path,
                                error: `File is too large to display (over ${MAX_FILE_SIZE / 1000}k characters).`,
                            };
                        }
                        return {
                            path,
                            content,
                            language: getLanguage(path),
                            tokenCount: estimateTokens(content)
                        };
                    } catch (e) {
                        return {
                            path,
                            error: `Failed to read file: ${e instanceof Error ? e.message : String(e)}`,
                        };
                    }
                });
                newFiles = await Promise.all(filePromises);
            }

            const updatedFiles = [...keptFiles, ...newFiles];
            updatedFiles.sort((a, b) => (b.content?.length ?? -1) - (a.content?.length ?? -1));
            setFiles(updatedFiles);

            const selectedFileExists = selectedFile && dataPathSet.has(selectedFile.path);
            if (!selectedFileExists) {
                setSelectedFile(updatedFiles[0] || null);
            }
        };

        syncFiles();
    }, [data]);

    const getFormattedContentAndParts = () => {
        const filesToCopy = files.filter(file => file.content && !file.error);

        const selectedPrompt = systemPrompts.find(p => p.id === selectedSystemPromptId);
        const systemPromptContent = selectedPrompt ? selectedPrompt.content : '';

        const fileContent = filesToCopy.map(file => {
            return `FILE PATH: ${file.path}\n\nCONTENT:\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\``;
        }).join('\n\n---\n\n');

        const contentParts = [];
        if (systemPromptContent.trim()) contentParts.push(`SYSTEM PROMPT:\n\n${systemPromptContent.trim()}`);
        if (fileContent.trim()) contentParts.push(fileContent);
        if (userPrompt.trim()) contentParts.push(`USER PROMPT:\n\n${userPrompt.trim()}`);

        return {
            parts: contentParts,
            combinedText: contentParts.join('\n\n---\n\n')
        };
    };

    const totalTokens = useMemo(() => estimateTokens(getFormattedContentAndParts().combinedText), [files, systemPrompts, selectedSystemPromptId, userPrompt]);


    const handleCopyAll = async () => {
        const { parts, combinedText } = getFormattedContentAndParts();

        if (parts.length === 0) {
            notifications.show({
                title: 'No Content to Copy',
                message: 'Select some files or write a prompt to copy.',
                color: 'yellow',
            });
            return;
        }

        try {
            await writeText(combinedText);
            notifications.show({
                title: 'Content Copied',
                message: `Successfully copied content to the clipboard.`,
                color: 'green',
                icon: <IconCheck size={18} />,
                autoClose: 5000,
            });
        } catch (e) {
            notifications.show({
                title: 'Copy Failed',
                message: 'Could not write content to the clipboard.',
                color: 'red',
            });
        }
    };


    if (data.length > 0 && files.length === 0) {
        return <Center h="100%"><Loader/></Center>;
    }

    if (files.length === 0) {
        return <Center h="100%"><Text c="dimmed">Select one or more files to view their content.</Text></Center>;
    }

    return (
        <Grid gutter="md">
            <Grid.Col span={{base: 12, md: 4, lg: 3}}>
                <ContentComposer
                    files={files}
                    systemPrompts={systemPrompts}
                    selectedFile={selectedFile}
                    userPrompt={userPrompt}
                    selectedSystemPromptId={selectedSystemPromptId}
                    onFileSelect={setSelectedFile}
                    onUncheckItem={uncheckItem}
                    onCopyAll={handleCopyAll}
                    setUserPrompt={setUserPrompt}
                    setSelectedSystemPromptId={setSelectedSystemPromptId}
                    totalTokens={totalTokens}
                />
            </Grid.Col>

            <Grid.Col span={{base: 12, md: 8, lg: 9}}>
                <FileViewer selectedFile={selectedFile} />
            </Grid.Col>
        </Grid>
    );
};