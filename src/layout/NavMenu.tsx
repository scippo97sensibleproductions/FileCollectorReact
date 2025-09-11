import {NavLink} from "@mantine/core";
import {Link} from "@tanstack/react-router";
import {IconHome2, IconSettings2} from "@tabler/icons-react";

const NavMenu = () => {
    return (
        <>
            <NavLink component={Link}
                     href="/"
                     to="/"
                     label="Home"
                     leftSection={<IconHome2 size={16} stroke={1.5}/>}
            />
            <NavLink component={Link}
                     href="/settings"
                     to="/settings"
                     label="Settings"
                     leftSection={<IconSettings2 size={16} stroke={1.5}/>}
            />
        </>
    );
};

export default NavMenu;