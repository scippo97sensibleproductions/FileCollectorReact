import {Box, Button, Group, LoadingOverlay, Stack, Text, TreeNodeData,} from "@mantine/core";
import {createFileRoute} from '@tanstack/react-router';
import {open} from '@tauri-apps/plugin-dialog';
import {useState} from "react";
import {BaseDirectory, DirEntry, readDir, readTextFile} from "@tauri-apps/plugin-fs";
import {join} from "@tauri-apps/api/path";
import {useDisclosure} from "@mantine/hooks";
import {checkIgnore, processPattern} from "../helpers/GitIgnoreParser.ts";
import FileManager from "../components/FileManager.tsx";

export const Route = createFileRoute('/')({
    component: Index,
})

export const getGitIgnoreItems = async (): Promise<GitIgnoreItem[]> => {
    const fileContents = await readTextFile(import.meta.env.VITE_GITIGNORE_PATH, {baseDir: (Number(import.meta.env.VITE_FILE_BASE_PATH) || 21) as BaseDirectory});
    return JSON.parse(fileContents);
}

export const getTreeNodeData = async (path:string, processedPatterns: ProcessedPattern[]): Promise<TreeNodeData[]> => {

    const entries: DirEntry[] = await readDir(path);

    const treeNodePromises = entries.filter(entry => {
        const ignore = checkIgnore(processedPatterns, entry.name!!);

        return !ignore;
    })
        .map(async (entry) => {
            const fullPath = await join(path, entry.name!!);

            const children = entry.isDirectory
                ? await getTreeNodeData(fullPath, processedPatterns)
                : undefined;
            return {
                label: entry.name,
                value: fullPath,
                children: children,
            };
        });
    return Promise.all(treeNodePromises);
};


function Index() {
    const [path, setPath] = useState<string | null>(null);
    const [treeNodeData, setTreeNodeData] = useState<TreeNodeData[]>([]);
    const [visible, handlers] = useDisclosure(false);
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    const onButtonClick = async () => {
        handlers.open();
        try {
            const selected = await open({
                multiple: false,
                directory: true,
            });

            if (typeof selected === 'string') {
                setPath(selected);
                setCheckedItems([]);
                setTreeNodeData([]);

                const gitignoreItems = await getGitIgnoreItems();

                const processedPatterns = gitignoreItems
                    .map(processPattern)
                    .filter(Boolean) as ProcessedPattern[];

                const nodes = await getTreeNodeData(selected, processedPatterns);

                setTreeNodeData(nodes);
            }
        } catch (e) {
            console.error("An error occurred:", e);
        } finally {
            handlers.close();
        }
    };

    return (
        <Stack h="calc(100vh - 40px)" p="md" gap="md">
            <Box pos="relative">
                <LoadingOverlay
                    visible={visible}
                    zIndex={1000}
                    overlayProps={{radius: 'sm', blur: 2}}
                    loaderProps={{color: 'pink', type: 'bars'}}
                />
                <Group>
                    <Button variant="filled" onClick={onButtonClick}>Select Folder</Button>
                    {path && <Text size="sm">Selected folder: <Text span c="dimmed">{path}</Text></Text>}
                </Group>
            </Box>

            <FileManager data={treeNodeData} checkedItems={checkedItems} setCheckedItems={setCheckedItems} />

        </Stack>
    );
}