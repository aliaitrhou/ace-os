"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PlaceholdersAndVanishInput } from "./placeholders-and-vanish-input";
import { useClerk, useUser } from "@clerk/nextjs";
import TerminalToolBar from "./terminal-topbar";
import { message } from "@/types";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { ChatCompletionStream } from "together-ai/lib/ChatCompletionStream.mjs";
import MarkdownRenderer from "./MarkdownRenderer";
import AimationLayout from "./animation-layout";
import Image from "next/image";
import Footer from "./footer";

interface Props {
  setRenderChat: (bar: boolean) => void;
}

const Chat: React.FC<Props> = ({ setRenderChat }) => {
  const [msg, setMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]); // State to manage chat history
  const [messages, setMessages] = useState<message[]>([
    {
      role: "user",
      m: "",
    },
    {
      role: "assistent",
      m: "",
    },
  ]);
  const refContainer = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { openSignIn } = useClerk();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target as HTMLInputElement;
    setMsg(el.value);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      openSignIn();
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        m: msg,
      },
    ]);
    setChatHistory((prevHistory) => [...prevHistory, `user: ${msg}`]);
    await getModelAnswer();
  };

  const getModelAnswer = async () => {
    try {
      const res = await fetch("/api/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: msg,
          chatHistory: chatHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch model response: ${res.status} ${res.statusText}`,
        );
      }

      if (!res.body) {
        // Handle case where body is missing
        throw new Error("Response body is undefined.");
      }

      const runner = ChatCompletionStream.fromReadableStream(res.body!);
      let currentMessage = "";

      // in order to steam the response
      runner.on("content", (delta) => {
        currentMessage += delta;
        setChatHistory((prevHistory) => {
          const updatedHistory = [...prevHistory];
          if (
            updatedHistory.length > 0 &&
            updatedHistory[updatedHistory.length - 1].startsWith("assistent:")
          ) {
            updatedHistory[updatedHistory.length - 1] =
              `assistent: ${currentMessage}`;
          } else {
            updatedHistory.push(`assistent: ${currentMessage}`);
          }

          return updatedHistory;
        });
        setMessages((prev) => {
          const updatedMessages = [...prev];
          if (
            updatedMessages.length > 0 &&
            updatedMessages[updatedMessages.length - 1].role === "assistent"
          ) {
            updatedMessages[updatedMessages.length - 1].m = currentMessage; // Update the last message
          } else {
            updatedMessages.push({ role: "assistent", m: currentMessage }); // If no assistant message exists, create a new one
          }

          return updatedMessages;
        });
      });
      runner.on("error", (err) => {
        console.error("Streaming error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistent",
            m: "Something went wrong while processing your request.",
          },
        ]);
      });
    } catch (error) {
      console.error("Error fetching model response:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistent", m: "An error occurred. Please try again later." },
      ]);
    }
  };

  const scroll = () => {
    if (refContainer.current) {
      const { offsetHeight, scrollHeight, scrollTop } =
        refContainer.current as HTMLDivElement;

      if (scrollHeight >= scrollTop + offsetHeight) {
        refContainer.current.scrollTo(0, scrollHeight + 150);
      }
    }
  };

  useEffect(() => {
    const hasMessages = messages.some((message) => message.m.trim() !== "");
    setRenderChat(hasMessages);
    scroll();
  }, [messages, setRenderChat]); // Run effect whenever messages change

  const hasMessages = messages.some((message) => message.m.trim() !== "");

  const MemoizedMarkdownRenderer = React.memo(MarkdownRenderer);

  return (
    <div
      className={`w-full sm:min-w-full ${hasMessages ? "px-4 sm:px-6 xl:px-40 space-y-3" : "space-y-6"} flex flex-col  items-center`}
    >
      {hasMessages && user ? (
        <AimationLayout>
          <section
            ref={refContainer}
            className="relative flex-1 max-h-[720px] sm:max-h-[700px]  mt-0 xl:mt-6 overflow-y-auto  w-full space-y-2 bg-gray-600/30 rounded-xl shadow-custom border-[1px] border-gray-600/30 pb-4"
          >
            <TerminalToolBar setMessages={setMessages} />
            {messages
              .filter((message) => message.m.trim() !== "")
              .map((msg, index) => (
                <div
                  key={index}
                  className={`w-full flex gap-0 sm:gap-2 items-center font-mono px-2 sm:px-4`}
                >
                  {msg.role == "user" && (
                    <div className=" flex flex-row justify-center items-center self-start">
                      <Image
                        src={user.imageUrl}
                        alt={"user image"}
                        width={20}
                        height={20}
                        className="rounded-full w-5 h-5 border border-slate-400 mr-2"
                      />

                      <p className="text-sm sm:text-md text-light text-slate-400">
                        {user?.username}/~$
                      </p>
                      <ChevronRightIcon className="w-4 h-4  font-bold text-xl text-slate-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-full text-sm sm:text-md font-light leading-7 ${msg.role == "assistent" ? "text-green-600" : "text-white"}`}
                  >
                    {msg.role == "user" ? (
                      <p>{msg.m}</p>
                    ) : (
                      <MemoizedMarkdownRenderer>
                        {msg.m}
                      </MemoizedMarkdownRenderer>
                    )}
                  </div>
                </div>
              ))}
          </section>
        </AimationLayout>
      ) : (
        <p className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-center">
          What is the mession today?
        </p>
      )}
      <div className={`w-full mx-auto px-4 ${!hasMessages && "sm:px-8"}`}>
        <PlaceholdersAndVanishInput
          placeholders={[
            "How does the ls command works",
            "What is the available flags of wc command ?",
            "How to switch between users ?",
          ]}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
        <Footer />
      </div>
    </div>
  );
};

export default Chat;
