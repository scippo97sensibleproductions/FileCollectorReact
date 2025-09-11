import { useState, useEffect, FC } from 'react';
import {
    Container,
    Title,
    Text,
    Stack,
    Group,
    Button,
    ActionIcon,
    TextInput,
    Paper,
    Loader,
    Alert,
    ScrollArea,
    rem,
    ThemeIcon,
    Textarea, Accordion,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconMessageChatbot,
    IconPlus,
    IconTrash,
    IconPencil,
    IconCheck,
    IconX,
    IconAlertCircle,
    IconDeviceFloppy,
} from '@tabler/icons-react';

import {
    exists,
    readTextFile,
    writeTextFile,
    BaseDirectory,
} from '@tauri-apps/plugin-fs';
import {createFileEnsuringPath} from "../helpers/FileSystemManager.ts";

// --- Constants from Environment Variables ---
const PROMPTS_PATH = import.meta.env.VITE_SYSTEM_PROMPTS_PATH || 'FileCollector/system_prompts.json';
const BASE_DIR = (Number(import.meta.env.VITE_FILE_BASE_PATH) || 21) as BaseDirectory; // 21 is Home

const SystemPromptManager: FC = () => {
    // --- State Management ---
    const [prompts, setPrompts] = useState<SystemPromptItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPromptName, setNewPromptName] = useState('');
    const [newPromptContent, setNewPromptContent] = useState('');
    const [editingPrompt, setEditingPrompt] = useState<SystemPromptItem | null>(null);

    // --- File System Logic ---
    const loadPrompts = async () => {
        setLoading(true);
        setError(null);
        try {
            const fileExists = await exists(PROMPTS_PATH, { baseDir: BASE_DIR });

            if (!fileExists) {
                await createFileEnsuringPath(PROMPTS_PATH, { baseDir: BASE_DIR });
                await writeTextFile(PROMPTS_PATH, '[]', { baseDir: BASE_DIR });
                setPrompts([]);
            } else {
                const content = await readTextFile(PROMPTS_PATH, { baseDir: BASE_DIR });
                const data = content ? JSON.parse(content) : [];
                if (Array.isArray(data)) {
                    setPrompts(data);
                } else {
                    throw new Error('Invalid data format in system_prompts.json. Expected an array.');
                }
            }
        } catch (err: any) {
            setError(`Failed to load or parse system_prompts.json: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const savePrompts = async (updatedPrompts: SystemPromptItem[]) => {
        try {
            const content = JSON.stringify(updatedPrompts, null, 2);
            await writeTextFile(PROMPTS_PATH, content, { baseDir: BASE_DIR });
            setPrompts(updatedPrompts);
        } catch (err: any) {
            setError(`Failed to save system_prompts.json: ${err.message}`);
        }
    };

    useEffect(() => {
        loadPrompts();
    }, []);

    // --- CRUD Handlers ---
    const handleAddPrompt = async () => {
        if (!newPromptName.trim() || !newPromptContent.trim()) return;

        const newPrompt: SystemPromptItem = {
            id: crypto.randomUUID(),
            name: newPromptName.trim(),
            content: newPromptContent.trim(),
        };

        await savePrompts([...prompts, newPrompt]);
        notifications.show({
            title: 'Prompt Added',
            message: `Successfully added prompt "${newPrompt.name}".`,
            color: 'green',
            icon: <IconCheck />,
        });
        setNewPromptName('');
        setNewPromptContent('');
    };

    const handleDeletePrompt = async (idToDelete: string) => {
        const promptToDelete = prompts.find(p => p.id === idToDelete);
        const updatedPrompts = prompts.filter((p) => p.id !== idToDelete);
        await savePrompts(updatedPrompts);
        notifications.show({
            title: 'Prompt Removed',
            message: `Successfully removed "${promptToDelete?.name}".`,
            color: 'red',
            icon: <IconTrash />,
        });
    };

    const handleUpdatePrompt = async () => {
        if (!editingPrompt) return;
        const updatedPrompts = prompts.map(p => p.id === editingPrompt.id ? editingPrompt : p);
        await savePrompts(updatedPrompts);
        notifications.show({
            title: 'Prompt Updated',
            message: `Successfully updated "${editingPrompt.name}".`,
            color: 'teal',
            icon: <IconDeviceFloppy />,
        });
        setEditingPrompt(null);
    };

    // --- UI Rendering ---
    if (loading) return <Container p="md"><Group justify="center"><Loader /></Group></Container>;
    if (error) return <Container p="md"><Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red">{error}</Alert></Container>;

    return (
        <Container p="md" fluid>
            <Stack gap="xl">
                {/* Header */}
                <Group>
                    <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 105 }}>
                        <IconMessageChatbot style={{ width: rem(32), height: rem(32) }} />
                    </ThemeIcon>
                    <div>
                        <Title order={2}>System Prompt Manager</Title>
                        <Text c="dimmed">Create and manage reusable prompts for your tasks</Text>
                    </div>
                </Group>

                {/* Add New Prompt Form */}
                <Paper shadow="sm" p="md" withBorder>
                    <Stack>
                        <TextInput
                            label="Prompt Name"
                            placeholder="e.g., C# Code Reviewer"
                            value={newPromptName}
                            onChange={(e) => setNewPromptName(e.currentTarget.value)}
                        />
                        <Textarea
                            label="Prompt Content"
                            placeholder="You are a senior C# developer..."
                            value={newPromptContent}
                            onChange={(e) => setNewPromptContent(e.currentTarget.value)}
                            autosize
                            minRows={4}
                        />
                        <Button
                            leftSection={<IconPlus size={18} />}
                            onClick={handleAddPrompt}
                            disabled={!newPromptName.trim() || !newPromptContent.trim()}
                            fullWidth
                            mt="md"
                        >
                            Add New Prompt
                        </Button>
                    </Stack>
                </Paper>

                {/* Prompts List */}
                <Paper shadow="sm" withBorder>
                    <ScrollArea.Autosize mah={500}>
                        {prompts.length > 0 ? (
                            <Accordion variant="separated">
                                {prompts.map((prompt) => (
                                    <Accordion.Item key={prompt.id} value={prompt.id}>
                                        {editingPrompt?.id === prompt.id ? (
                                            // Edit View
                                            <Stack p="md" gap="sm">
                                                <TextInput
                                                    label="Prompt Name"
                                                    value={editingPrompt.name}
                                                    onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.currentTarget.value })}
                                                    autoFocus
                                                />
                                                <Textarea
                                                    label="Prompt Content"
                                                    value={editingPrompt.content}
                                                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.currentTarget.value })}
                                                    autosize minRows={5}
                                                />
                                                <Group justify="flex-end">
                                                    <Button variant="default" onClick={() => setEditingPrompt(null)} leftSection={<IconX size={16}/>}>Cancel</Button>
                                                    <Button color="green" onClick={handleUpdatePrompt} leftSection={<IconCheck size={16}/>}>Save</Button>
                                                </Group>
                                            </Stack>
                                        ) : (
                                            // Display View
                                            <>
                                                <Accordion.Control>
                                                    <Group justify="space-between">
                                                        <Text fw={500}>{prompt.name}</Text>
                                                        <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                                                            <ActionIcon variant="light" color="blue" onClick={() => setEditingPrompt(prompt)} title="Edit">
                                                                <IconPencil size={18} />
                                                            </ActionIcon>
                                                            <ActionIcon variant="light" color="red" onClick={() => handleDeletePrompt(prompt.id)} title="Delete">
                                                                <IconTrash size={18} />
                                                            </ActionIcon>
                                                        </Group>
                                                    </Group>
                                                </Accordion.Control>
                                                <Accordion.Panel>
                                                    <Text style={{ whiteSpace: 'pre-wrap' }} c="dimmed" fz="sm">{prompt.content}</Text>
                                                </Accordion.Panel>
                                            </>
                                        )}
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        ) : (
                            <Text c="dimmed" ta="center" p="xl">
                                No system prompts found. Add one above to get started.
                            </Text>
                        )}
                    </ScrollArea.Autosize>
                </Paper>
            </Stack>
        </Container>
    );
};

export default SystemPromptManager;