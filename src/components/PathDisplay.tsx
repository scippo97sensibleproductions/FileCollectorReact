import { Breadcrumbs, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

interface PathDisplayProps {
    path: string | null;
}

export function PathDisplay({ path }: PathDisplayProps) {
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    if (!path) {
        return null;
    }

    const separator = path.includes('/') ? '/' : '\\';
    const parts = path.split(separator).filter(Boolean);

    let itemsToRender;

    if (isMobile && parts.length > 3) {
        const first = parts[0];
        const last = parts[parts.length - 1];
        const secondToLast = parts[parts.length - 2];
        itemsToRender = [
            <Text key={0} size="sm" c="dimmed">{first}</Text>,
            <Text key="ellipsis" size="sm" c="dimmed">...</Text>,
            <Text key={parts.length - 2} size="sm" c="dimmed">{secondToLast}</Text>,
            <Text key={parts.length - 1} size="sm" fw={500}>{last}</Text>
        ];
    } else {
        itemsToRender = parts.map((part, index) => (
            <Text
                key={index}
                size="sm"
                c={index === parts.length - 1 ? 'default' : 'dimmed'}
                fw={index === parts.length - 1 ? 500 : 400}
            >
                {part}
            </Text>
        ));
    }

    return (
        <Breadcrumbs
            separator="›"
            styles={{ root: { alignItems: 'center', overflow: 'hidden', flexWrap: 'nowrap' } }}
        >
            {itemsToRender}
        </Breadcrumbs>
    );
}