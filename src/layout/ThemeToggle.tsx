import { ActionIcon, useMantineColorScheme, Tooltip, Group } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    return (
        <Group justify="center">
            <Tooltip
                label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}
                position="right"
                transitionProps={{ transition: 'fade', duration: 200 }}
            >
                <ActionIcon
                    onClick={toggleColorScheme}
                    variant="default"
                    size="lg"
                    aria-label="Toggle color scheme"
                >
                    {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
                </ActionIcon>
            </Tooltip>
        </Group>
    );
}