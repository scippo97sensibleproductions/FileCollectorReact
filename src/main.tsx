import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { routeTree } from './routeTree.gen';
import { MantineProvider, createTheme, localStorageColorSchemeManager } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({
    fontFamily: 'Inter, sans-serif',
    headings: { fontFamily: 'Inter, sans-serif' },
    primaryColor: 'blue',
});

const router = createRouter({ routeTree });

const colorSchemeManager = localStorageColorSchemeManager({
    key: 'mantine-color-scheme',
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <MantineProvider
                theme={theme}
                defaultColorScheme="dark"
                colorSchemeManager={colorSchemeManager}
            >
                <Notifications />
                <RouterProvider router={router}/>
            </MantineProvider>
        </StrictMode>,
    );
}