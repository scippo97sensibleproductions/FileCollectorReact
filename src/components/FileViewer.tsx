import {
    Alert,
    Center,
    Code,
    Paper,
    ScrollArea,
    Stack,
    Text,
    Loader, Box,
} from '@mantine/core';
import { IconAlertCircle, IconMessagePlus } from '@tabler/icons-react';
import { useEffect, useState, useRef } from "react";
import type { FileInfo } from "../models/FileInfo.ts";
import { readTextFile } from "@tauri-apps/plugin-fs";
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import './FileViewer.css';
import SyntaxHighlighterWorker from '../workers/syntaxHighlighter.worker.ts?worker';

interface FileViewerProps {
    selectedFile: FileInfo | null;
}

export const FileViewer = ({ selectedFile }: FileViewerProps) => {
    const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const jobCounterRef = useRef(0);

    useEffect(() => {
        const worker = new SyntaxHighlighterWorker();
        workerRef.current = worker;

        const messageHandler = (event: MessageEvent) => {
            if (event.data.ready) {
                setIsWorkerReady(true);
                return;
            }

            if (event.data.jobId !== `job-${jobCounterRef.current}`) {
                return;
            }

            if (event.data.error) {
                setHighlightedHtml(null);
            } else {
                setHighlightedHtml(event.data.html);
            }
            setIsLoading(false);
        };

        worker.addEventListener('message', messageHandler);

        return () => {
            worker.terminate();
        };
    }, []);

    useEffect(() => {
        if (!selectedFile || !isWorkerReady || !workerRef.current) {
            if (selectedFile) setIsLoading(true);
            return;
        }

        setIsLoading(true);
        setHighlightedHtml(null);
        jobCounterRef.current += 1;
        const currentJobId = `job-${jobCounterRef.current}`;

        const loadAndHighlight = async () => {
            try {
                const content = await readTextFile(selectedFile.path);
                if (currentJobId !== `job-${jobCounterRef.current}`) {
                    return;
                }
                workerRef.current?.postMessage({
                    code: content,
                    language: selectedFile.language,
                    jobId: currentJobId
                });
            } catch (e) {
                if (currentJobId === `job-${jobCounterRef.current}`) {
                    setIsLoading(false);
                }
            }
        };

        loadAndHighlight();

    }, [selectedFile, isWorkerReady]);

    if (!selectedFile) {
        return (
            <Paper withBorder h="100%" style={{ flex: 3 }}>
                <Center h="100%">
                    <Stack align="center" gap="xs">
                        <IconMessagePlus size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
                        <Text c="dimmed">Select a file to view its content.</Text>
                    </Stack>
                </Center>
            </Paper>
        );
    }

    return (
        <Paper withBorder h="100%" p="md" style={{ flex: 3 }}>
            <Stack h="100%" gap="xs">
                <Code block fz="xs" c="dimmed">{selectedFile.path}</Code>
                <ScrollArea style={{ flex: 1, position: 'relative' }}>
                    {isLoading && <Center pos="absolute" inset={0}><Loader /></Center>}

                    {!isLoading && selectedFile.error && (
                        <Alert variant="light" color="red" title="Could Not Display File" icon={<IconAlertCircle />}>
                            {selectedFile.error}
                        </Alert>
                    )}

                    {!isLoading && !selectedFile.error && highlightedHtml && (
                        <Box
                            className="line-numbers"
                            dangerouslySetInnerHTML={{ __html: `<pre><code>${highlightedHtml}</code></pre>` }}
                        />
                    )}
                </ScrollArea>
            </Stack>
        </Paper>
    );
};