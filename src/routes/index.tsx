import { ActionIcon, Box, Button, Group, LoadingOverlay, Stack, Text, TreeNodeData, Tooltip } from "@mantine/core";
import { createFileRoute } from '@tanstack/react-router';
import { open } from '@tauri-apps/plugin-dialog';
import { useState } from "react";
import { BaseDirectory, DirEntry, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { useDisclosure } from "@mantine/hooks";
import { checkIgnore, processPattern } from "../helpers/GitIgnoreParser.ts";
import { FileManager } from "../components/FileManager.tsx";
import { IconFolderOpen, IconRefresh } from "@tabler/icons-react";

export const Route = createFileRoute('/')({
    component: Index,
})

type DefinedTreeNode = {
    label: string;
    value: string;
    children?: DefinedTreeNode[];
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

    const nodePromises = entries
        .map(async (entry): Promise<DefinedTreeNode | null> => {
            if (!entry.name) return null;

            const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            const isIgnored = checkIgnore(processedPatterns, entryRelativePath);
            if(isIgnored) return null;

            const fullPath = await join(path, entry.name);

            if (entry.isDirectory) {
                const children = await getTreeNodesRecursive(fullPath, entryRelativePath, processedPatterns);
                if (children.length === 0) return null;
                return { label: entry.name, value: fullPath, children };
            }

            return { label: entry.name, value: fullPath };
        });

    const resolvedNodes = await Promise.all(nodePromises);
    const nodes = resolvedNodes.filter((node): node is DefinedTreeNode => node !== null);

    nodes.sort((a, b) => {
        const aIsFolder = !!a.children;
        const bIsFolder = !!b.children;
        if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
        return a.label.localeCompare(b.label);
    });

    return nodes;
};

function Index() {
    const [path, setPath] = useState<string | null>(null);
    const [treeNodeData, setTreeNodeData] = useState<TreeNodeData[]>([]);
    const [visible, handlers] = useDisclosure(false);
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    const loadDirectoryTree = async (directoryPath: string) => {
        handlers.open();
        try {
            setPath(directoryPath);
            setCheckedItems([]);
            setTreeNodeData([]);

            const gitignoreItems = await getGitIgnoreItems();
            const processedPatterns = gitignoreItems
                .map(processPattern)
                .filter((p): p is ProcessedPattern => p !== null);

            const nodes = await getTreeNodesRecursive(directoryPath, '', processedPatterns);
            setTreeNodeData(nodes);
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
                            leftSection={<IconFolderOpen size={18}/>}
                        >
                            Select Folder
                        </Button>
                    </Tooltip>
                    <Tooltip label="Reload file list from disk">
                        <ActionIcon variant="light" onClick={handleReloadTree} disabled={!path}>
                            <IconRefresh size={18}/>
                        </ActionIcon>
                    </Tooltip>
                    {path && <Text size="sm" truncate="end">Selected: <Text span c="dimmed">{path}</Text></Text>}
                </Group>
            </Box>

            <Box style={{ flex: 1, minHeight: 0 }}>
                <FileManager data={treeNodeData} checkedItems={checkedItems} setCheckedItems={setCheckedItems} />
            </Box>
        </Stack>
    );
}