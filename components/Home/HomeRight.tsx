import Image from "next/image";
import arrow from "@/public/icons/rightuparrow.svg"
import interests from "@/public/images/interests.png"
import ListItem from "./ListItem";
import Link from "next/link";

export default function HomeRight() {
    return (
        <section className="flex flex-col gap-6 w-[30%] flex-1">
            <div className="container flex flex-col gap-6 h-full">
                <Link href={"/interests"} className="flex flex-col group cursor-pointer gap-6">
                    <div className="w-full flex items-center gap-2  cursor-pointer justify-between">
                        <span className="font-medium text-2xl select-none">Interests</span>
                        <Image
                            src={arrow}
                            width={15}
                            height={15}
                            alt="arrow"
                            className="
                            transition-all duration-300
                            translate-x-0 group-hover:-translate-x-2
                            group-hover:rotate-45"
                        />
                    </div>
                    <Image src={interests} alt=" interests" width={2000} height={2000} priority className="w-full rounded-[20px] transition-all duration-300 group-hover:scale-[1.05]" />
                </Link>
                <ul className="flex flex-col gap-6">
                    {[1,2,3].map((item) => (
                        <ListItem key={item}> 
                            {item}
                        </ListItem>
                    ))}
                </ul>
            </div>
            <ul className="container flex gap-6 justify-center">
                {[{social: "instagram", link: "https://www.instagram.com/t4tuli/"}

                ,{social: "facebook", link: "https://www.facebook.com/taaatuch"},{social: "linkedin", link: "https://www.linkedin.com/in/tamar-chirgadze-44b82720a/"}].map((item) => (
                    <li key={item.social} className="text-lg font-light uppercase cursor-pointer hover:underline">
                        <Link href={item.link} target="_blank">
                            {item.social}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}