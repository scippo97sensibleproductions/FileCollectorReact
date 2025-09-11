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
    ActionIcon
} from "@mantine/core";
import {FileIcon} from "./FileIcon.tsx";
import {IconChevronDown, IconSearch, IconX} from "@tabler/icons-react";
import {useEffect, useMemo, useState} from "react";

interface FileTreeProps {
    tree: UseTreeReturnType;
    data: TreeNodeData[];
    checked: string[];
    setChecked: (checkedNodes: string[]) => void;
}

const filterTree = (nodes: TreeNodeData[], query: string): TreeNodeData[] => {
    if (!query) {
        return nodes;
    }
    const lowerCaseQuery = query.toLowerCase();

    function filterNodes(nodes: TreeNodeData[]): TreeNodeData[] {
        return nodes.reduce<TreeNodeData[]>((acc, node) => {
            const matchesLabel = node.label!.toString().toLowerCase().includes(lowerCaseQuery);

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

const renderTreeNode = ({
                            node,
                            expanded,
                            hasChildren,
                            elementProps,
                            tree,
                        }: RenderTreeNodePayload) => {
    const checked = tree.isNodeChecked(node.value);
    const indeterminate = tree.isNodeIndeterminate(node.value);

    return (
        <Group gap="xs" {...elementProps}>
            <Checkbox.Indicator
                checked={checked}
                indeterminate={indeterminate}
                onClick={() => (!checked ? tree.checkNode(node.value) : tree.uncheckNode(node.value))}
            />

            <FileIcon name={node.label!.toString()} isFolder={hasChildren} expanded={expanded}/>

            <Group gap={5} onClick={() => tree.toggleExpanded(node.value)} style={{cursor: 'pointer', flex: 1}}>
                <span>{node.label}</span>

                {hasChildren && (
                    <IconChevronDown
                        size={14}
                        style={{transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: 'auto'}}
                    />
                )}
            </Group>
        </Group>
    );
};

const FileTree = ({tree, data, checked, setChecked}: FileTreeProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { expandAllNodes, setExpandedState } = tree;

    const filteredData = useMemo(() => filterTree(data, searchQuery), [data, searchQuery]);

    useEffect(() => {
        if (searchQuery) {
            expandAllNodes();
        } else if (data.length > 0) {
            setExpandedState({});
        }
    }, [searchQuery, data.length, expandAllNodes, setExpandedState]);

    useEffect(() => {
        const nodes = tree.checkedState;
        if (JSON.stringify(nodes) !== JSON.stringify(checked)) {
            setChecked(nodes);
        }

    }, [tree.checkedState, checked, setChecked]);

    return (
        <Paper withBorder shadow="sm" p="md" h="100%">
            <Stack h="100%" gap="xs">
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
                {data.length > 0 ? (
                    <ScrollArea h='calc(100vh - 255px)'>
                        <Tree
                            data={filteredData}
                            tree={tree}
                            renderNode={renderTreeNode}
                            levelOffset={23}
                            expandOnClick={false}
                        />
                    </ScrollArea>
                ) : (
                    <Center style={{flex: 1}}>
                        <Text c="dimmed">Select a folder to see the file tree.</Text>
                    </Center>
                )}
            </Stack>
        </Paper>
    );
};

export default FileTree;