// endpoint to be used to retrieve messages from a chat based on a provided chatId.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: {
    chatId: string;
  };
}

export async function GET(request: Request, { params }: Context) {
  const { chatId } = await params;

  // check if the chat exists
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat)
    return NextResponse.json({ error: "Invalid chat ID" }, { status: 404 });
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    select: { role: true, text: true },
  });

  return NextResponse.json(messages);
}
