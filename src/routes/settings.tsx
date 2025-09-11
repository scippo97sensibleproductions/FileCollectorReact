import { createFileRoute } from '@tanstack/react-router'
import {Tabs} from "@mantine/core";
import {IconBrandGit, IconSettings, IconMessageChatbot} from "@tabler/icons-react";
import GitIgnoreManager from "../components/GitIgnoreManager.tsx";
import SystemPromptManager from "../components/SystemPromptManager.tsx";

export const Route = createFileRoute('/settings')({
    component: RouteComponent,
})

function RouteComponent() {

    return (
        <Tabs defaultValue="gitIgnore">
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

            <Tabs.Panel value="gitIgnore" pt="md">
                <GitIgnoreManager/>
            </Tabs.Panel>

            <Tabs.Panel value="systemPrompts" pt="md">
                <SystemPromptManager />
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="md">
                Settings tab content
            </Tabs.Panel>
        </Tabs>
    );

}