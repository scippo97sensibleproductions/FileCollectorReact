import { NavLink } from "@mantine/core";
import { Link, useLocation } from "@tanstack/react-router";
import { IconHome2, IconSettings2 } from "@tabler/icons-react";

interface NavMenuProps {
    onNavigate?: () => void;
}

export const NavMenu = ({ onNavigate }: NavMenuProps) => {
    const location = useLocation();

    return (
        <>
            <NavLink
                component={Link}
                to="/"
                label="Home"
                leftSection={<IconHome2 size={16} stroke={1.5} />}
                active={location.pathname === '/'}
                onClick={onNavigate}
            />
            <NavLink
                component={Link}
                to="/settings"
                label="Settings"
                leftSection={<IconSettings2 size={16} stroke={1.5} />}
                active={location.pathname === '/settings'}
                onClick={onNavigate}
            />
        </>
    );
};