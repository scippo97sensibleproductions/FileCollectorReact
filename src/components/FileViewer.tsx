import {
    Alert,
    Center,
    Code,
    Paper,
    ScrollArea,
    Stack,
    Text,
} from '@mantine/core';
import { IconAlertCircle, IconMessagePlus } from '@tabler/icons-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { FileInfo } from "../models/FileInfo.ts";

interface FileViewerProps {
    selectedFile: FileInfo | null;
}

export const FileViewer = ({ selectedFile }: FileViewerProps) => {
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
                <ScrollArea style={{ flex: 1 }}>
                    {selectedFile.error ? (
                        <Alert
                            variant="light"
                            color="red"
                            title="Could Not Display File"
                            icon={<IconAlertCircle />}
                        >
                            {selectedFile.error}
                        </Alert>
                    ) : (
                        <SyntaxHighlighter
                            language={selectedFile.language}
                            style={oneDark}
                            showLineNumbers
                            wrapLines={true}
                            wrapLongLines={true}
                            customStyle={{
                                background: 'var(--mantine-color-dark-7)',
                                border: 'none',
                                padding: '0.5rem',
                                height: '100%',
                                margin: 0,
                                fontSize: '0.8rem',
                            }}
                            codeTagProps={{
                                style: {
                                    fontFamily: '"JetBrains Mono", monospace',
                                }
                            }}
                        >
                            {selectedFile.content || ''}
                        </SyntaxHighlighter>
                    )}
                </ScrollArea>
            </Stack>
        </Paper>
    );
};