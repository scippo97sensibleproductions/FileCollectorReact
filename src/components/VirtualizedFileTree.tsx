import { useState, useMemo, memo, useCallback } from 'react';
import { Box, Checkbox, Group, Stack, Text, Title, Center } from '@mantine/core';
import { List, type RowComponentProps } from 'react-window';
import { IconCaretDownFilled, IconCaretRightFilled, IconFolderOff } from '@tabler/icons-react';
import { FileIcon } from './FileIcon';
import type { DefinedTreeNode } from '../routes';

interface FlatNode {
    id: string;
    label: string;
    depth: number;
    isFolder: boolean;
    node: DefinedTreeNode;
}

interface VirtualizedFileTreeProps {
    data: DefinedTreeNode[];
    checkedItems: string[];
    onNodeToggle: (node: DefinedTreeNode, isChecked: boolean) => void;
}

type TreeRowProps = {
    flatNodes: FlatNode[];
    checkedItemsSet: Set<string>;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    toggleCheck: (node: DefinedTreeNode, isChecked: boolean) => void;
};

const flattenTree = (nodes: DefinedTreeNode[], expandedIds: Set<string>, depth = 0): FlatNode[] => {
    let flatList: FlatNode[] = [];
    for (const node of nodes) {
        const isFolder = Array.isArray(node.children);
        flatList.push({ id: node.value, label: node.label, depth, isFolder, node });
        if (isFolder && expandedIds.has(node.value) && node.children) {
            flatList = flatList.concat(flattenTree(node.children, expandedIds, depth + 1));
        }
    }
    return flatList;
};

const NodeRow = memo(({ index, style, ariaAttributes, ...props }: RowComponentProps<TreeRowProps>) => {
    const { flatNodes, checkedItemsSet, expandedIds, toggleExpand, toggleCheck } = props;
    const { id, label, depth, isFolder, node } = flatNodes[index];

    const isChecked = checkedItemsSet.has(id);

    return (
        <Box style={style} {...ariaAttributes}>
            <Group gap={0} wrap="nowrap" style={{ height: '100%' }}>
                <Box
                    style={{ paddingLeft: depth * 20, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => isFolder && toggleExpand(id)}
                >
                    {isFolder ? (
                        expandedIds.has(id) ? <IconCaretDownFilled size={14} /> : <IconCaretRightFilled size={14} />
                    ) : (
                        <Box w={14} />
                    )}
                </Box>
                <Group
                    gap="xs"
                    wrap="nowrap"
                    style={{ flex: 1, cursor: 'pointer', height: '100%' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleCheck(node, isChecked);
                    }}
                >
                    <Checkbox.Indicator
                        checked={isChecked}
                        style={{ cursor: 'pointer' }}
                    />
                    <FileIcon name={label} isFolder={isFolder} expanded={expandedIds.has(id)} />
                    <Text size="sm" truncate="end" style={{ userSelect: 'none' }} title={label}>
                        {label}
                    </Text>
                </Group>
            </Group>
        </Box>
    );
});

export const VirtualizedFileTree = ({ data, checkedItems, onNodeToggle }: VirtualizedFileTreeProps) => {
    const [expandedIds, setExpandedIds] = useState(new Set<string>());

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds(currentIds => {
            const newIds = new Set(currentIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    }, []);

    const flatNodes = useMemo(() => flattenTree(data, expandedIds), [data, expandedIds]);
    const checkedItemsSet = useMemo(() => new Set(checkedItems), [checkedItems]);

    const rowProps = useMemo(() => ({
        flatNodes,
        checkedItemsSet,
        expandedIds,
        toggleExpand,
        toggleCheck: onNodeToggle,
    }), [flatNodes, checkedItemsSet, expandedIds, toggleExpand, onNodeToggle]);

    return (
        <Stack h="100%" gap="sm">
            <Title order={5}>Project Files</Title>
            <Box style={{ flex: 1 }}>
                {data.length > 0 ? (
                    <List
                        rowCount={flatNodes.length}
                        rowHeight={28}
                        rowComponent={NodeRow}
                        rowProps={rowProps}
                    />
                ) : (
                    <Center h="100%">
                        <Stack align="center">
                            <IconFolderOff size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
                            <Text c="dimmed" ta="center">Select a folder to<br />view the file tree.</Text>
                        </Stack>
                    </Center>
                )}
            </Box>
        </Stack>
    );
};