import {AppShell} from "@mantine/core"
import {createRootRoute, Outlet} from '@tanstack/react-router'
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools'
import NavMenu from "../layout/NavMenu.tsx";

const RootLayout = () => {


    return (<>
            <AppShell
                padding="md"
                navbar={{
                    width: '120px',
                    breakpoint: 'sm',
                }}
            >
                <AppShell.Navbar>
                    <NavMenu/>
                </AppShell.Navbar>

                <AppShell.Main>
                    <Outlet/>
                    <TanStackRouterDevtools/>
                </AppShell.Main>
            </AppShell>
        </>
    );
}

export const Route = createRootRoute({component: RootLayout})