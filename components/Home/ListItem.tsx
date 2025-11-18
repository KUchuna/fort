"use client";

import {motion} from "motion/react";


export default function ListItem({children}: {children: React.ReactNode}) {
    return (
        <motion.li
            whileHover={{
                scale: 1.04,
            }}
            whileTap={{ scale: 1.02 }}
            className="p-4 cursor-pointer border-t-2 border-accent text-xl font-medium bg-main"
            >
                {children}
        </motion.li>
    )
}