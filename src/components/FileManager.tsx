import {Grid, TreeNodeData, useTree} from "@mantine/core";
import FileTree from "./FileTree.tsx";
import {FileTextRenderer} from "./FileTextRenderer.tsx";

interface FileManagerProps {
    data: TreeNodeData[];
    checkedItems: string[];
    setCheckedItems: (checkedItems: string[]) => void;
}

const FileManager = ({data, checkedItems, setCheckedItems}: FileManagerProps) => {

    const tree = useTree();


    return (
        <Grid>
            <Grid.Col span={4}>
                <FileTree tree={tree} checked={checkedItems} data={data} setChecked={setCheckedItems}/>
            </Grid.Col>
            <Grid.Col span={8}>
                <FileTextRenderer data={checkedItems} uncheckItem={tree.uncheckNode}/>
            </Grid.Col>
        </Grid>
    );
};

export default FileManager;