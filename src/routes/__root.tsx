import { AppShell, Box, Stack } from "@mantine/core"
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeToggle } from "../layout/ThemeToggle.tsx";
import { NavMenu } from "../layout/NavMenu.tsx";

const RootLayout = () => {
    return (
        <AppShell
            padding="md"
            navbar={{ width: 200, breakpoint: 'sm' }}
            layout="alt"
        >
            <AppShell.Navbar p="md">
                <Stack justify="space-between" h="100%">
                    <Box>
                        <NavMenu />
                    </Box>
                    <ThemeToggle />
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}

export const Route = createRootRoute({ component: RootLayout })