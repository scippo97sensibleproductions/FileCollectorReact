import { useState, useMemo, useEffect } from 'react';
import {
    ActionIcon,
    Box,
    Center,
    Loader,
    NavLink,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { FileIcon } from "./FileIcon.tsx";

interface FileNode {
    label: string;
    value: string;
}

interface FileSearchProps {
    allFiles: FileNode[];
    checkedItems: string[];
    onCheckItem: (path: string) => void;
}

const getTruncatedPath = (fullPath: string): string => {
    const separator = fullPath.includes('/') ? '/' : '\\';
    const parts = fullPath.split(separator);
    if (parts.length <= 1) return '';

    const pathParts = parts.slice(0, -1);
    if (pathParts.length <= 4) {
        return pathParts.join(separator);
    }

    const relevantParts = pathParts.slice(-4);
    return `...${separator}${relevantParts.join(separator)}`;
};


export function FileSearch({ allFiles, checkedItems, onCheckItem }: FileSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 200);
    const [filteredFiles, setFilteredFiles] = useState<FileNode[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            setFilteredFiles([]);
            setIsSearching(false);
            return;
        }

        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        const results = allFiles.filter(file =>
            file.value.toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredFiles(results);
        setIsSearching(false);
    }, [debouncedSearchQuery, allFiles]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.currentTarget.value;
        setSearchQuery(query);
        setIsSearching(query.trim().length > 0);
    };

    const checkedSet = useMemo(() => new Set(checkedItems), [checkedItems]);

    return (
        <Stack h="100%" gap="sm">
            <TextInput
                placeholder="Search all project files..."
                value={searchQuery}
                onChange={handleSearchChange}
                leftSection={<IconSearch size={16} stroke={1.5} />}
                rightSection={
                    searchQuery ? (
                        <ActionIcon
                            variant="transparent"
                            c="dimmed"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                        >
                            <IconX size={16} />
                        </ActionIcon>
                    ) : null
                }
            />
            <Box style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {isSearching && (
                    <Center pos="absolute" inset={0}>
                        <Loader size="sm" />
                    </Center>
                )}
                <ScrollArea h="100%">
                    {!isSearching && debouncedSearchQuery.trim() && filteredFiles.length === 0 && (
                        <Text c="dimmed" ta="center" pt="md" size="sm">No files found.</Text>
                    )}
                    {!isSearching && filteredFiles.map((file) => (
                        <NavLink
                            key={file.value}
                            label={
                                <Tooltip label={file.value} position="bottom-start" withArrow>
                                    <Text truncate="end" size="sm">{file.label}</Text>
                                </Tooltip>
                            }
                            description={
                                <Text truncate="end" size="xs" c="dimmed">
                                    {getTruncatedPath(file.value)}
                                </Text>
                            }
                            leftSection={<FileIcon name={file.label} isFolder={false} expanded={false} />}
                            rightSection={
                                <Tooltip label="Add file to selection">
                                    <ActionIcon
                                        variant="subtle"
                                        size="sm"
                                        onClick={() => onCheckItem(file.value)}
                                        disabled={checkedSet.has(file.value)}
                                        aria-label="Add file"
                                    >
                                        <IconPlus size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            }
                        />
                    ))}
                </ScrollArea>
            </Box>
        </Stack>
    );
}