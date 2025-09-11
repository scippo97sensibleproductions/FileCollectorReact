import { FC } from 'react';
import {
    ActionIcon,
    NavLink,
    ScrollArea,
    Text,
} from '@mantine/core';
import { IconFile, IconX } from '@tabler/icons-react';
import {FileInfo} from "../models/FileInfo.ts";

interface SelectedFileListProps {
    files: FileInfo[];
    selectedFile: FileInfo | null;
    onFileSelect: (file: FileInfo | null) => void;
    onUncheckItem: (path: string) => void;
}

export const SelectedFileList: FC<SelectedFileListProps> = ({
                                                                files,
                                                                selectedFile,
                                                                onFileSelect,
                                                                onUncheckItem,
                                                            }) => {
    return (
        <>
            <Text size="sm" fw={500} mt="xs">Selected Files ({files.length})</Text>
            <ScrollArea style={{ flex: 1 }}>
                {files.map((file) => (
                    <NavLink
                        styles={{ description: { whiteSpace: 'normal', height: 'auto', wordBreak: 'break-all' } }}
                        key={file.path}
                        active={selectedFile?.path === file.path}
                        label={file.path.split(/[\\/]/).pop()}
                        description={`${file.content?.length ?? 'Error'} Chars`}
                        color={file.error ? 'red' : 'blue'}
                        onClick={() => onFileSelect(selectedFile?.path === file.path ? null : file)}
                        leftSection={<IconFile size="1rem" />}
                        rightSection={
                            <ActionIcon
                                variant="transparent"
                                aria-label="uncheckFile"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUncheckItem(file.path);
                                }}
                            >
                                <IconX />
                            </ActionIcon>
                        }
                    />
                ))}
            </ScrollArea>
        </>
    );
};