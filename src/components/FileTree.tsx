import {
    Checkbox,
    Group,
    RenderTreeNodePayload,
    Tree,
    TreeNodeData,
    ScrollArea,
    Paper,
    Title,
    Center,
    Text,
    Stack,
    UseTreeReturnType,
    TextInput,
    ActionIcon,
    Box
} from "@mantine/core";
import {FileIcon} from "./FileIcon.tsx";
import {IconFolderOff, IconSearch, IconX} from "@tabler/icons-react";
import {useEffect, useMemo, useState} from "react";

interface FileTreeProps {
    tree: UseTreeReturnType;
    data: TreeNodeData[];
    setChecked: (checkedNodes: string[]) => void;
}

const filterTree = (nodes: TreeNodeData[], query: string): TreeNodeData[] => {
    if (!query) {
        return nodes;
    }
    const lowerCaseQuery = query.toLowerCase();

    const filterNodes = (nodes: TreeNodeData[]): TreeNodeData[] => {
        return nodes.reduce<TreeNodeData[]>((acc, node) => {
            const nodeLabel = node.label?.toString().toLowerCase() ?? '';
            const matchesLabel = nodeLabel.includes(lowerCaseQuery);

            if (node.children) {
                const filteredChildren = filterNodes(node.children);
                if (filteredChildren.length > 0 || matchesLabel) {
                    acc.push({ ...node, children: filteredChildren });
                }
            } else if (matchesLabel) {
                acc.push(node);
            }
            return acc;
        }, []);
    }

    return filterNodes(nodes);
};

const renderTreeNode = ({ node, elementProps, tree }: RenderTreeNodePayload) => {
    const checked = tree.isNodeChecked(node.value);
    const indeterminate = tree.isNodeIndeterminate(node.value);

    return (
        <Group gap="xs" {...elementProps}>
            <Checkbox.Indicator
                checked={checked}
                indeterminate={indeterminate}
                onClick={(e) => {
                    e.stopPropagation();
                    !checked ? tree.checkNode(node.value) : tree.uncheckNode(node.value);
                }}
            />

            <FileIcon name={node.label!.toString()} isFolder={!!node.children} expanded={!!tree.expandedState[node.value]}/>

            <Text
                size="sm"
                style={{flex: 1, userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={node.label!.toString()}
            >
                {node.label}
            </Text>
        </Group>
    );
};

export const FileTree = ({tree, data, setChecked}: FileTreeProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { expandAllNodes, collapseAllNodes } = tree;

    const filteredData = useMemo(() => filterTree(data, searchQuery), [data, searchQuery]);

    useEffect(() => {
        if (searchQuery) {
            expandAllNodes();
        } else {
            collapseAllNodes();
        }
    }, [searchQuery, expandAllNodes, collapseAllNodes]);

    useEffect(() => {
        setChecked(tree.checkedState);
    }, [tree.checkedState, setChecked]);

    return (
        <Paper withBorder shadow="sm" p="md" h="100%">
            <Stack h="100%" gap="sm">
                <Title order={5}>Project Files</Title>
                <TextInput
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
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
                <Box style={{ flex: 1, overflow: 'hidden' }}>
                    {data.length > 0 ? (
                        <ScrollArea h="100%">
                            <Tree
                                data={filteredData}
                                tree={tree}
                                renderNode={renderTreeNode}
                                levelOffset={20}
                                expandOnClick
                            />
                        </ScrollArea>
                    ) : (
                        <Center h="100%">
                            <Stack align="center">
                                <IconFolderOff size={48} stroke={1.5} color="var(--mantine-color-gray-5)"/>
                                <Text c="dimmed" ta="center">Select a folder to<br/>view the file tree.</Text>
                            </Stack>
                        </Center>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
};