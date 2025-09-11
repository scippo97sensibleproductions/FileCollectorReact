import { Flex, TreeNodeData, useTree } from "@mantine/core";
import { FileTextRenderer } from "./FileTextRenderer.tsx";
import {FileTree} from "./FileTree.tsx";

interface FileManagerProps {
    data: TreeNodeData[];
    checkedItems: string[];
    setCheckedItems: (checkedItems: string[]) => void;
}

export const FileManager = ({ data, checkedItems, setCheckedItems }: FileManagerProps) => {
    const tree = useTree({
        initialCheckedState: checkedItems,
    });

    return (
        <Flex gap="md" h="100%">
            <Flex style={{ flex: '0 0 380px', minWidth: '300px' }}>
                <FileTree tree={tree} data={data} setChecked={setCheckedItems} />
            </Flex>
            <Flex style={{ flex: 1, minWidth: 0 }}>
                <FileTextRenderer data={checkedItems} uncheckItem={tree.uncheckNode} />
            </Flex>
        </Flex>
    );
};