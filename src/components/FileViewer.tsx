import { FC } from 'react';
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
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {FileInfo} from "../models/FileInfo.ts";

interface FileViewerProps {
    selectedFile: FileInfo | null;
}

export const FileViewer: FC<FileViewerProps> = ({ selectedFile }) => {
    if (!selectedFile) {
        return (
            <Paper withBorder h="100%">
                <Center h="100%">
                    <Stack align="center" gap="xs">
                        <IconMessagePlus size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
                        <Text c="dimmed">Select a file from the list to view its content.</Text>
                    </Stack>
                </Center>
            </Paper>
        );
    }

    return (
        <Stack h="calc(100vh - 150px)" gap="xs">
            <Code block>{selectedFile.path}</Code>
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
                        style={dark}
                        showLineNumbers
                        wrapLines={true}
                        wrapLongLines={true}
                    >
                        {selectedFile.content || ''}
                    </SyntaxHighlighter>
                )}
            </ScrollArea>
        </Stack>
    );
};