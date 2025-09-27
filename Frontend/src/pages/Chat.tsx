import React from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";

export default function Chat() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}