import React from "react";
import GithubLogo from "@/public/github.svg";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full mt-3 text-center text-gray-400 font-light text-sm font-mono pb-3 sm:pb-6 mx-auto">
      <div className="w-full flex items-center justify-center gap-1">
        <p className="text-xs">
          © 2024 By{" "}
          <span className="text-orange-400 font-bold text-xs">
            <a href="https://x.com/Ali_AitRahou">Ali</a>
          </span>
          , source code
        </p>
        <Link href={"https://github.com/aliaitrhou/AceOS"}>
          <div className="bg-gray-400 flex items-center gap-1 rounded-lg w-fit p-[.3px]">
            <p className="font-semibold text-xs text-black">Github</p>
            <Image src={GithubLogo} alt="github" className="w-3 h-3" />
          </div>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
