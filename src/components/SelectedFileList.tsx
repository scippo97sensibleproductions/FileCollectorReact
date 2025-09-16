import { ActionIcon, Box, NavLink, Text, Tooltip, useMantineTheme, useMantineColorScheme, rgba } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { memo, useMemo } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { useElementSize } from '@mantine/hooks';
import { FileInfo } from "../models/FileInfo.ts";
import { FileIcon } from "./FileIcon.tsx";

interface SelectedFileListProps {
    files: FileInfo[];
    selectedFile: FileInfo | null;
    onFileSelect: (file: FileInfo | null) => void;
    onUncheckItem: (path: string) => void;
}

// Define props passed to each row via `rowProps`
interface FileRowProps {
    files: FileInfo[];
    selectedFile: FileInfo | null;
    onFileSelect: (file: FileInfo | null) => void;
    onUncheckItem: (path: string) => void;
}

// Memoized row component for performance.
const FileRow = memo(({ index, style, ...props }: RowComponentProps<FileRowProps>) => {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const { files, selectedFile, onFileSelect, onUncheckItem } = props;
    const file = files[index];

    if (!file) {
        return null;
    }

    return (
        <Box style={{
            ...style,
            backgroundColor: file.error
                ? (colorScheme === 'dark' ? rgba(theme.colors.red[9], 0.2) : theme.colors.red[0])
                : undefined,
        }}>
            <NavLink
                active={selectedFile?.path === file.path}
                label={
                    <Tooltip label={file.path} position="bottom-start">
                        <Text truncate="end">{file.path.split(/[\\/]/).pop()}</Text>
                    </Tooltip>
                }
                description={file.error ? 'Error reading file' : `~${(file.tokenCount ?? 0).toLocaleString()} tokens`}
                color={file.error ? 'red' : 'blue'}
                onClick={() => onFileSelect(selectedFile?.path === file.path ? null : file)}
                leftSection={<FileIcon name={file.path} isFolder={false} expanded={false} />}
                rightSection={
                    <ActionIcon
                        variant="transparent"
                        c="dimmed"
                        aria-label="uncheckFile"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUncheckItem(file.path);
                        }}
                    >
                        <IconX size={16} />
                    </ActionIcon>
                }
            />
        </Box>
    );
});

export const SelectedFileList = ({
                                     files,
                                     selectedFile,
                                     onFileSelect,
                                     onUncheckItem,
                                 }: SelectedFileListProps) => {
    const { ref, width, height } = useElementSize();

    // Memoize rowProps to prevent the List from re-rendering unnecessarily.
    const rowProps = useMemo(() => ({
        files,
        selectedFile,
        onFileSelect,
        onUncheckItem,
    }), [files, selectedFile, onFileSelect, onUncheckItem]);

    return (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Text size="sm" fw={500}>Selected Files ({files.length})</Text>
            <Box ref={ref} style={{ flex: 1, minHeight: 0 }} mt="xs">
                {height > 0 && width > 0 && files.length > 0 && (
                    <List
                        rowCount={files.length}
                        rowHeight={52} // Height for each NavLink item
                        rowComponent={FileRow}
                        rowProps={rowProps}
                    />
                )}
            </Box>
        </Box>
    );
};