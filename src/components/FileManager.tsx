import { Flex, Paper, Tabs } from "@mantine/core";
import { IconFiles, IconSearch } from "@tabler/icons-react";
import { useMemo } from "react";
import { FileTextRenderer } from "./FileTextRenderer.tsx";
import { FileSearch } from "./FileSearch.tsx";
import { VirtualizedFileTree } from "./VirtualizedFileTree.tsx";
import type { DefinedTreeNode } from "../routes";

interface FileManagerProps {
    data: DefinedTreeNode[];
    allFiles: { label: string; value: string }[];
    checkedItems: string[];
    setCheckedItems: (checkedItems: string[]) => void;
    onNodeToggle: (node: { value: string, children?: DefinedTreeNode[] }, isChecked: boolean) => void;
}

export const FileManager = ({ data, allFiles, checkedItems, setCheckedItems, onNodeToggle }: FileManagerProps) => {

    const handleCheckItem = (path: string) => {
        const isChecked = checkedItems.includes(path);
        onNodeToggle({ value: path }, isChecked);
    };

    const checkedFiles = useMemo(() => {
        const allFilePaths = new Set(allFiles.map(file => file.value));
        return checkedItems.filter(item => allFilePaths.has(item));
    }, [checkedItems, allFiles]);

    return (
        <Flex gap="md" h="100%">
            <Flex style={{ flex: '0 0 380px', minWidth: '300px' }}>
                <Paper withBorder shadow="sm" p="md" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Tabs defaultValue="files" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Tabs.List>
                            <Tabs.Tab value="files" leftSection={<IconFiles size={16} />}>
                                Files
                            </Tabs.Tab>
                            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
                                Search
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
                                onCheckItem={handleCheckItem}
                            />
                        </Tabs.Panel>
                    </Tabs>
                </Paper>
            </Flex>
            <Flex style={{ flex: 1, minWidth: 0 }}>
                <FileTextRenderer
                    data={checkedFiles}
                    uncheckItem={handleCheckItem}
                    onClearAll={() => setCheckedItems([])}
                />
            </Flex>
        </Flex>
    );
};