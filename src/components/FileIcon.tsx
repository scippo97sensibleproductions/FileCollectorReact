import {
    IconBrandCSharp, IconBrandVisualStudio, IconBrandWindows,
    IconCode, IconFile,
    IconFileText,
    IconFileTypeDoc, IconFileTypePdf,
    IconFileTypeSvg,
    IconFileTypeXls, IconFileTypeXml, IconFileTypeZip,
    IconFolder,
    IconFolderOpen, IconJson, IconMovie, IconMusic,
    IconPhoto
} from "@tabler/icons-react";

interface FileIconProps {
    name: string;
    isFolder: boolean;
    expanded: boolean;
}

export function FileIcon({ name, isFolder, expanded }: FileIconProps) {
    if (isFolder) {
        return expanded ? <IconFolderOpen size={18} color="#f7d794" /> : <IconFolder size={18} color="#f7d794" />;
    }

    // Image files
    if (/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(name)) {
        return <IconPhoto size={18} color="#a5d6a7" />;
    }
    if (name.endsWith('.svg')) {
        return <IconFileTypeSvg size={18} color="#ffab91" />;
    }

    // Document files
    if (name.endsWith('.doc') || name.endsWith('.docx')) {
        return <IconFileTypeDoc size={18} color="#90caf9" />;
    }
    if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
        return <IconFileTypeXls size={18} color="#a5d6a7" />;
    }
    if (name.endsWith('.pdf')) {
        return <IconFileTypePdf size={18} color="#ef9a9a" />;
    }
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) {
        return <IconFileTypeZip size={18} color="#b39ddb" />;
    }

    // Audio and Video files
    if (/\.(mp3|wav|ogg|flac)$/i.test(name)) {
        return <IconMusic size={18} color="#ce93d8" />;
    }
    if (/\.(mp4|avi|mov|mkv|wmv)$/i.test(name)) {
        return <IconMovie size={18} color="#f48fb1" />;
    }

    // Original file types
    if (name.endsWith('.json')) {
        return <IconJson size={18} color="#fdd835" />;
    }
    if (name.endsWith('.xml')) {
        return <IconFileTypeXml size={18} color="#bcaaa4" />;
    }
    if (name.endsWith('.txt')) {
        return <IconFileText size={18} color="#eeeeee" />;
    }
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.jsx')) {
        return <IconCode size={18} color="#80cbc4" />;
    }
    if (name.endsWith('.cs')) {
        return <IconBrandCSharp size={18} color="#9ccc65" />;
    }
    if (name.endsWith('.exe')) {
        return <IconBrandWindows size={18} color="#81d4fa" />;
    }
    if (name.endsWith('.sln') || name.endsWith('.slnx') || name.endsWith('.csproj') || name.endsWith('.tsproj')) {
        return <IconBrandVisualStudio size={18} color="#ba68c8" />;
    }

    // Generic file icon as a fallback
    return <IconFile size={18} color="#bdbdbd" />;
}
