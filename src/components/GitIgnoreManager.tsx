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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconGitBranch,
    IconFileImport,
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
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {createFileEnsuringPath} from "../helpers/FileSystemManager.ts";

// --- Constants from Environment Variables ---
const GITIGNORE_PATH = import.meta.env.VITE_GITIGNORE_PATH || 'FileCollector/gitignores.json';
const BASE_DIR = (Number(import.meta.env.VITE_FILE_BASE_PATH) || 21) as BaseDirectory; // 21 is Home

const GitIgnoreManager: FC = () => {
    // --- State Management ---
    const [items, setItems] = useState<GitIgnoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPattern, setNewPattern] = useState('');
    const [editingState, setEditingState] = useState<{ index: number; value: string } | null>(null);

    // --- File System Logic ---

    /**
     * Loads the gitignore items from the JSON file.
     * Creates the file with an empty array if it doesn't exist.
     */
    const loadGitIgnoreItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const fileExists = await exists(GITIGNORE_PATH, { baseDir: BASE_DIR });

            if (!fileExists) {
                console.log(`File "${GITIGNORE_PATH}" not found. Creating...`);
                await createFileEnsuringPath(GITIGNORE_PATH, { baseDir: BASE_DIR });
                await writeTextFile(GITIGNORE_PATH, '[]', { baseDir: BASE_DIR });
                setItems([]);
                notifications.show({
                    title: 'Setup Complete',
                    message: 'Created a new gitignore storage file.',
                    color: 'blue',
                });
            } else {
                const content = await readTextFile(GITIGNORE_PATH, { baseDir: BASE_DIR });
                const data = content ? JSON.parse(content) : [];
                if (Array.isArray(data)) {
                    setItems(data);
                } else {
                    throw new Error('Invalid data format in gitignores.json. Expected an array.');
                }
            }
        } catch (err: any) {
            console.error('Failed to load gitignore items:', err);
            setError(`Failed to load or parse gitignores.json: ${err.message}`);
            notifications.show({
                title: 'Loading Error',
                message: 'Could not load the gitignore file. Please check permissions or file content.',
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Saves the provided gitignore items to the JSON file, removing duplicates.
     * @param {GitIgnoreItem[]} updatedItems - The new list of items to save.
     */
    const saveGitIgnoreItems = async (updatedItems: GitIgnoreItem[]) => {
        // --- Duplicate Removal Logic ---
        const uniquePatterns = [...new Set(updatedItems.map((item) => item.pattern.trim()).filter(Boolean))];
        const finalItems = uniquePatterns.map((pattern) => ({ pattern }));

        try {
            const content = JSON.stringify(finalItems, null, 2);
            await writeTextFile(GITIGNORE_PATH, content, { baseDir: BASE_DIR });
            setItems(finalItems);
            return finalItems; // Return the cleaned list
        } catch (err: any) {
            console.error('Failed to save gitignore items:', err);
            setError(`Failed to save gitignores.json: ${err.message}`);
            notifications.show({
                title: 'Save Error',
                message: 'Could not save changes to the gitignore file.',
                color: 'red',
                icon: <IconAlertCircle />,
            });
            return items; // Return original items on failure
        }
    };

    // --- Initial Load Effect ---
    useEffect(() => {
        loadGitIgnoreItems();
    }, []);

    // --- CRUD & Import Handlers ---

    const handleAddItem = async () => {
        if (!newPattern.trim()) return;

        const updatedList = await saveGitIgnoreItems([...items, { pattern: newPattern }]);

        const addedCount = updatedList.length - items.length;
        if (addedCount > 0) {
            notifications.show({
                title: 'Pattern Added',
                message: `Successfully added "${newPattern.trim()}".`,
                color: 'green',
                icon: <IconCheck />,
            });
        } else {
            notifications.show({
                title: 'Pattern Exists',
                message: `The pattern "${newPattern.trim()}" is already in the list.`,
                color: 'yellow',
            });
        }

        setNewPattern('');
    };

    const handleDeleteItem = async (indexToDelete: number) => {
        const itemToDelete = items[indexToDelete];
        const updatedItems = items.filter((_, index) => index !== indexToDelete);
        await saveGitIgnoreItems(updatedItems);
        notifications.show({
            title: 'Pattern Removed',
            message: `Successfully removed "${itemToDelete.pattern}".`,
            color: 'red',
            icon: <IconTrash />,
        });
    };

    const handleUpdateItem = async () => {
        if (!editingState) return;

        const updatedItems = [...items];
        updatedItems[editingState.index] = { pattern: editingState.value.trim() };

        await saveGitIgnoreItems(updatedItems);

        notifications.show({
            title: 'Pattern Updated',
            message: 'Successfully updated the pattern.',
            color: 'teal',
            icon: <IconDeviceFloppy />,
        });
        setEditingState(null);
    };

    const handleImportFile = async () => {
        try {
            const selectedPath = await openDialog({
                multiple: false,
                filters: [{ name: 'Gitignore File', extensions: ['gitignore'] }],
                title: 'Import .gitignore file',
            });

            if (!selectedPath) return; // User cancelled

            const content = await readTextFile(selectedPath as string);
            const newPatterns = content
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('#')) // Filter out empty lines and comments
                .map((pattern) => ({ pattern }));

            if (newPatterns.length === 0) {
                notifications.show({
                    title: 'Import Empty',
                    message: 'The selected file contained no valid patterns.',
                    color: 'orange',
                });
                return;
            }

            const currentLength = items.length;
            const updatedList = await saveGitIgnoreItems([...items, ...newPatterns]);
            const addedCount = updatedList.length - currentLength;

            notifications.show({
                title: 'Import Successful',
                message: `Imported ${newPatterns.length} patterns. Added ${addedCount} new unique patterns.`,
                color: 'grape',
                icon: <IconFileImport />,
            });

        } catch (err: any) {
            console.error('Failed to import file:', err);
            notifications.show({
                title: 'Import Error',
                message: 'An error occurred while importing the file.',
                color: 'red',
            });
        }
    };

    // --- UI Rendering ---

    if (loading) {
        return (
            <Container p="md">
                <Group justify="center">
                    <Loader color="blue" />
                    <Text>Loading Gitignore Manager...</Text>
                </Group>
            </Container>
        );
    }

    if (error) {
        return (
            <Container p="md">
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" variant="light">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container p="md" fluid>
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between">
                    <Group>
                        <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                            <IconGitBranch style={{ width: rem(32), height: rem(32) }} />
                        </ThemeIcon>
                        <div>
                            <Title order={2}>Gitignore Manager</Title>
                            <Text c="dimmed">Manage your global gitignore patterns</Text>
                        </div>
                    </Group>
                    <Button
                        leftSection={<IconFileImport size={18} />}
                        onClick={handleImportFile}
                        variant="gradient"
                        gradient={{ from: 'grape', to: 'violet' }}
                    >
                        Import .gitignore
                    </Button>
                </Group>

                {/* Add New Item Form */}
                <Paper shadow="sm" p="md" withBorder>
                    <Group>
                        <TextInput
                            placeholder="e.g., node_modules/"
                            value={newPattern}
                            onChange={(e) => setNewPattern(e.currentTarget.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            style={{ flex: 1 }}
                            aria-label="New gitignore pattern"
                        />
                        <Button
                            leftSection={<IconPlus size={18} />}
                            onClick={handleAddItem}
                            disabled={!newPattern.trim()}
                        >
                            Add Pattern
                        </Button>
                    </Group>
                </Paper>

                {/* Items List */}
                <Paper shadow="sm" withBorder>
                    <ScrollArea.Autosize mah={500}>
                        <Stack gap={0}>
                            {items.length > 0 ? (
                                items.map((item, index) => (
                                    <Paper key={index} p="xs" m="xs" radius="sm" withBorder>
                                        {editingState?.index === index ? (
                                            // --- Edit Mode UI ---
                                            <Group justify="space-between">
                                                <TextInput
                                                    value={editingState.value}
                                                    onChange={(e) => setEditingState({ ...editingState, value: e.currentTarget.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateItem();
                                                        if (e.key === 'Escape') setEditingState(null);
                                                    }}
                                                    autoFocus
                                                    style={{ flex: 1 }}
                                                />
                                                <Group gap="xs">
                                                    <ActionIcon variant="light" color="green" onClick={handleUpdateItem} title="Save">
                                                        <IconCheck size={18} />
                                                    </ActionIcon>
                                                    <ActionIcon variant="light" color="gray" onClick={() => setEditingState(null)} title="Cancel">
                                                        <IconX size={18} />
                                                    </ActionIcon>
                                                </Group>
                                            </Group>
                                        ) : (
                                            // --- Display Mode UI ---
                                            <Group justify="space-between">
                                                <Text ff="monospace">{item.pattern}</Text>
                                                <Group gap="xs">
                                                    <ActionIcon variant="light" color="blue" onClick={() => setEditingState({ index, value: item.pattern })} title="Edit">
                                                        <IconPencil size={18} />
                                                    </ActionIcon>
                                                    <ActionIcon variant="light" color="red" onClick={() => handleDeleteItem(index)} title="Delete">
                                                        <IconTrash size={18} />
                                                    </ActionIcon>
                                                </Group>
                                            </Group>
                                        )}
                                    </Paper>
                                ))
                            ) : (
                                <Text c="dimmed" ta="center" p="xl">
                                    No gitignore patterns found. Add one above or import a file.
                                </Text>
                            )}
                        </Stack>
                    </ScrollArea.Autosize>
                </Paper>
                <Text c="dimmed" size="sm" ta="center">
                    Total Patterns: {items.length}
                </Text>
            </Stack>
        </Container>
    );
};

export default GitIgnoreManager;