import { Flex, Paper, Tabs } from "@mantine/core";
import { IconFiles, IconSearch, IconArchive } from "@tabler/icons-react";
import { useMemo } from "react";
import { FileTextRenderer } from "./FileTextRenderer.tsx";
import { FileSearch } from "./FileSearch.tsx";
import { VirtualizedFileTree } from "./VirtualizedFileTree.tsx";
import type { DefinedTreeNode } from "../routes";
import { ContextManager } from "./ContextManager.tsx";

interface FileManagerProps {
    data: DefinedTreeNode[];
    allFiles: { label: string; value: string }[];
    checkedItems: string[];
    setCheckedItems: React.Dispatch<React.SetStateAction<string[]>>;
    onNodeToggle: (node: DefinedTreeNode) => void;
    path: string | null;
}

export const FileManager = ({ data, allFiles, checkedItems, setCheckedItems, onNodeToggle, path }: FileManagerProps) => {

    const handleAddItem = (filePath: string) => {
        setCheckedItems(prevItems => Array.from(new Set(prevItems).add(filePath)));
    };

    const handleRemoveItem = (filePath: string) => {
        setCheckedItems(prevItems => prevItems.filter(p => p !== filePath));
    };

    const handleLoadContext = (pathsToLoad: string[]) => {
        setCheckedItems(pathsToLoad);
    };

    const checkedFiles = useMemo(() => {
        const allFilePaths = new Set(allFiles.map(file => file.value));
        return checkedItems.filter(item => allFilePaths.has(item));
    }, [checkedItems, allFiles]);

    return (
        <Flex gap="md" h="100%">
            <Paper withBorder shadow="sm" p="md" style={{ flex: '0 0 450px', minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
                <Tabs defaultValue="files" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Tabs.List>
                        <Tabs.Tab value="files" leftSection={<IconFiles size={16} />}>
                            Files
                        </Tabs.Tab>
                        <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
                            Search
                        </Tabs.Tab>
                        <Tabs.Tab value="contexts" leftSection={<IconArchive size={16} />}>
                            Contexts
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="files" pt="xs" style={{ flex: 1, minHeight: 0 }}>
                        <VirtualizedFileTree
                            data={data}
                            checkedItems={checkedItems}
                            onNodeToggle={onNodeToggle}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="search" pt="xs" style={{ flex: 1, minHeight: 0 }}>
                        <FileSearch
                            allFiles={allFiles}
                            checkedItems={checkedItems}
                            onCheckItem={handleAddItem}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="contexts" pt="xs" style={{ flex: 1, minHeight: 0 }}>
                        <ContextManager
                            currentPath={path}
                            selectedFilePaths={checkedItems}
                            onLoadContext={handleLoadContext}
                        />
                    </Tabs.Panel>
                </Tabs>
            </Paper>
            <Flex style={{ flex: 1, minWidth: 0 }}>
                <FileTextRenderer
                    data={checkedFiles}
                    uncheckItem={handleRemoveItem}
                    onClearAll={() => setCheckedItems([])}
                />
            </Flex>
        </Flex>
    );
};