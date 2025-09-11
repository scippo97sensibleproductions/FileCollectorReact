import { NavLink } from "@mantine/core";
import { Link, useLocation } from "@tanstack/react-router";
import { IconHome2, IconSettings2 } from "@tabler/icons-react";

export const NavMenu = () => {
    const location = useLocation();

    return (
        <>
            <NavLink
                component={Link}
                to="/"
                label="Home"
                leftSection={<IconHome2 size={16} stroke={1.5} />}
                active={location.pathname === '/'}
            />
            <NavLink
                component={Link}
                to="/settings"
                label="Settings"
                leftSection={<IconSettings2 size={16} stroke={1.5} />}
                active={location.pathname === '/settings'}
            />
        </>
    );
};