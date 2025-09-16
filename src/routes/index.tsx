import { ActionIcon, Box, Button, Group, LoadingOverlay, Stack, Text, Tooltip } from "@mantine/core";
import { createFileRoute } from '@tanstack/react-router';
import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useState } from "react";
import { BaseDirectory, DirEntry, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { useDisclosure } from "@mantine/hooks";
import { checkIgnore, processPattern } from "../helpers/GitIgnoreParser.ts";
import { FileManager } from "../components/FileManager.tsx";
import { IconFolderOpen, IconRefresh } from "@tabler/icons-react";

export const Route = createFileRoute('/')({
    component: Index,
})

export type DefinedTreeNode = {
    label: string;
    value: string;
    children?: DefinedTreeNode[];
};

type FlatFileNode = {
    label: string;
    value: string;
}

export const getGitIgnoreItems = async (): Promise<GitIgnoreItem[]> => {
    try {
        const path = import.meta.env.VITE_GITIGNORE_PATH;
        const baseDir = (Number(import.meta.env.VITE_FILE_BASE_PATH) || 21) as BaseDirectory;
        const fileContents = await readTextFile(path, { baseDir });
        return JSON.parse(fileContents);
    } catch (error) {
        return [];
    }
}

const getTreeNodesRecursive = async (path: string, relativePath: string, processedPatterns: ProcessedPattern[]): Promise<DefinedTreeNode[]> => {
    const entries: DirEntry[] = await readDir(path);

    const nodePromises = entries.map(async (entry): Promise<DefinedTreeNode | null> => {
        if (!entry.name) return null;

        const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        if (checkIgnore(processedPatterns, entryRelativePath)) return null;

        const fullPath = await join(path, entry.name);

        if (entry.isDirectory) {
            const children = await getTreeNodesRecursive(fullPath, entryRelativePath, processedPatterns);
            if (children.length === 0) return null;
            return { label: entry.name, value: fullPath, children };
        }

        return { label: entry.name, value: fullPath };
    });

    const resolvedNodes = (await Promise.all(nodePromises)).filter((node): node is DefinedTreeNode => node !== null);

    resolvedNodes.sort((a, b) => {
        const aIsFolder = Array.isArray(a.children);
        const bIsFolder = Array.isArray(b.children);
        if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
        return a.label.localeCompare(b.label);
    });

    return resolvedNodes;
};

const collectFilePaths = (node: DefinedTreeNode): string[] => {
    if (!node.children) {
        return [node.value];
    }
    return node.children.flatMap(collectFilePaths);
};

function Index() {
    const [path, setPath] = useState<string | null>(null);
    const [treeNodeData, setTreeNodeData] = useState<DefinedTreeNode[]>([]);
    const [allFiles, setAllFiles] = useState<FlatFileNode[]>([]);
    const [visible, handlers] = useDisclosure(false);
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    const getFlatFiles = (nodes: DefinedTreeNode[]): FlatFileNode[] => {
        let files: FlatFileNode[] = [];
        for (const node of nodes) {
            if (node.children) {
                files = files.concat(getFlatFiles(node.children));
            } else {
                files.push({ label: node.label, value: node.value });
            }
        }
        return files;
    };

    const loadDirectoryTree = async (directoryPath: string) => {
        handlers.open();
        try {
            setPath(directoryPath);
            setCheckedItems([]);
            setTreeNodeData([]);
            setAllFiles([]);

            const gitignoreItems = await getGitIgnoreItems();
            const patterns = gitignoreItems
                .map(processPattern)
                .filter((p): p is ProcessedPattern => p !== null);

            const nodes = await getTreeNodesRecursive(directoryPath, '', patterns);
            const flatFiles = getFlatFiles(nodes);
            flatFiles.sort((a, b) => a.label.localeCompare(b.label));

            setTreeNodeData(nodes);
            setAllFiles(flatFiles);
        } finally {
            handlers.close();
        }
    };

    const handleSelectFolder = async () => {
        const selected = await open({ multiple: false, directory: true });
        if (typeof selected === 'string') {
            await loadDirectoryTree(selected);
        }
    };

    const handleReloadTree = async () => {
        if (path) {
            await loadDirectoryTree(path);
        }
    };

    const handleNodeToggle = useCallback((node: DefinedTreeNode) => {
        const pathsToToggle = collectFilePaths(node);
        if (pathsToToggle.length === 0) return;

        const checkedItemsSet = new Set(checkedItems);
        const checkedDescendantCount = pathsToToggle.filter(path => checkedItemsSet.has(path)).length;

        const shouldCheckAll = checkedDescendantCount < pathsToToggle.length;

        setCheckedItems(currentCheckedItems => {
            const newCheckedItemsSet = new Set(currentCheckedItems);
            if (shouldCheckAll) {
                pathsToToggle.forEach(path => newCheckedItemsSet.add(path));
            } else {
                pathsToToggle.forEach(path => newCheckedItemsSet.delete(path));
            }
            return Array.from(newCheckedItemsSet);
        });
    }, [checkedItems]);

    return (
        <Stack h="calc(100vh - var(--app-shell-padding, 1rem) * 2)" gap="md">
            <Box pos="relative">
                <LoadingOverlay
                    visible={visible}
                    zIndex={1000}
                    overlayProps={{ radius: 'sm', blur: 2 }}
                    loaderProps={{ children: <Text>Scanning directory...</Text> }}
                />
                <Group>
                    <Tooltip label="Select a project folder to analyze">
                        <Button
                            variant="light"
                            onClick={handleSelectFolder}
                            leftSection={<IconFolderOpen size={18} />}
                        >
                            Select Folder
                        </Button>
                    </Tooltip>
                    <Tooltip label="Reload file list from disk">
                        <ActionIcon variant="light" onClick={handleReloadTree} disabled={!path}>
                            <IconRefresh size={18} />
                        </ActionIcon>
                    </Tooltip>
                    {path && <Text size="sm" truncate="end">Selected: <Text span c="dimmed">{path}</Text></Text>}
                </Group>
            </Box>

            <Box style={{ flex: 1, minHeight: 0 }}>
                <FileManager
                    data={treeNodeData}
                    allFiles={allFiles}
                    checkedItems={checkedItems}
                    setCheckedItems={setCheckedItems}
                    onNodeToggle={handleNodeToggle}
                    path={path}
                />
            </Box>
        </Stack>
    );
}