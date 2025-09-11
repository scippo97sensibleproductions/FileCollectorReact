import { ActionIcon, Box,  NavLink, ScrollArea, Text, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { FileInfo } from "../models/FileInfo.ts";
import { FileIcon } from "./FileIcon.tsx";

interface SelectedFileListProps {
    files: FileInfo[];
    selectedFile: FileInfo | null;
    onFileSelect: (file: FileInfo | null) => void;
    onUncheckItem: (path: string) => void;
}

export const SelectedFileList = ({
                                     files,
                                     selectedFile,
                                     onFileSelect,
                                     onUncheckItem,
                                 }: SelectedFileListProps) => {
    return (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Text size="sm" fw={500}>Selected Files ({files.length})</Text>
            <ScrollArea style={{ flex: 1 }} mt="xs">
                {files.map((file) => (
                    <NavLink
                        key={file.path}
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
                ))}
            </ScrollArea>
        </Box>
    );
}