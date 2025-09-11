import { createFileRoute } from '@tanstack/react-router'
import { Container, Tabs } from "@mantine/core";
import { IconBrandGit, IconSettings, IconMessageChatbot } from "@tabler/icons-react";
import { GitIgnoreManager } from "../components/GitIgnoreManager.tsx";
import { SystemPromptManager } from "../components/SystemPromptManager.tsx";

export const Route = createFileRoute('/settings')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <Container p={0} fluid>
            <Tabs defaultValue="gitIgnore" orientation="vertical">
                <Tabs.List>
                    <Tabs.Tab value="gitIgnore" leftSection={<IconBrandGit size={20} />}>
                        Ignores
                    </Tabs.Tab>
                    <Tabs.Tab value="systemPrompts" leftSection={<IconMessageChatbot size={20} />}>
                        System Prompts
                    </Tabs.Tab>
                    <Tabs.Tab value="settings" leftSection={<IconSettings size={20} />}>
                        Settings
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="gitIgnore" p="md">
                    <GitIgnoreManager />
                </Tabs.Panel>

                <Tabs.Panel value="systemPrompts" p="md">
                    <SystemPromptManager />
                </Tabs.Panel>

                <Tabs.Panel value="settings" p="md">
                    Settings tab content
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}