import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import useToken from "@features/auth/api/hooks/useToken.ts"
import { BASE_URL } from "@api/Util.ts"
import Chat from "@features/chat/components/Chat.tsx"
import useUser from "@features/auth/api/hooks/useUser.ts"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import type { ChatMember, ChatMessage } from "@features/chat/api/chat.types.ts"

/**
 * {@link ChatBox}
 */
type ChatBoxProps = {
    meeting: GroupMeetingResponse
}

/**
 * The chatbox for a meeting.
 *
 * @param meeting The meeting the ChatBox is for.
 * @constructor
 */
export default function ChatBox({ meeting }: ChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [text, setText] = useState("")
    const [status, setStatus] = useState<
        "connecting" | "open" | "closed" | "error"
    >("connecting")
    const [names, setNames] = useState<Record<string, string>>({})

    const listRef = useRef<HTMLDivElement | null>(null)
    const socketRef = useRef<WebSocket | null>(null)

    const auth = useToken()

    const user = useUser()

    const meetingId = meeting.meeting.id

    const moderator = useMemo(() => {
        return (
            meeting.membership?.role === "MODERATOR" ||
            meeting.membership?.role === "HOST"
        )
    }, [meeting.membership?.role])

    useEffect(() => {
        if (auth === null || auth === "") return

        const base = BASE_URL.replaceAll("https://", "wss://").replaceAll(
            "http://",
            "ws://"
        )
        const ws = new WebSocket(`${base}/groups/${meetingId}/chat`)

        socketRef.current = ws

        setStatus("connecting")

        ws.onopen = () => {
            setStatus("open")

            ws.send(
                JSON.stringify({
                    action: "AUTHORIZE",
                    token: auth
                })
            )
        }

        ws.onmessage = (ev) => {
            try {
                const payload = JSON.parse(ev.data)

                switch (payload.action) {
                    // receive message history
                    case "HISTORY": {
                        const messageHistory = payload.payload
                            .messages as ChatMessage[]

                        setMessages(
                            messageHistory.sort((a, b) => a.date - b.date)
                        )
                        break
                    }

                    // receive member names
                    case "MEMBERS": {
                        const members: ChatMember[] = payload.payload

                        for (let i = 0; members.length > i; i++) {
                            const member = members[i]

                            setNames((prev) => ({
                                ...prev,
                                [member.userId]: member.name
                            }))
                        }

                        break
                    }

                    // incoming message
                    case "NEW_MESSAGE":
                        setMessages((prev) => [
                            ...prev,
                            payload.payload as ChatMessage
                        ])
                        break

                    // deleted message
                    case "MESSAGE_DELETED":
                        setMessages((prev) =>
                            prev.filter(
                                (message) =>
                                    message.messageId !==
                                    payload.payload.messageId
                            )
                        )
                        break

                    // updated message
                    case "MESSAGE_UPDATED":
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.messageId === payload.payload.messageId
                                    ? {
                                          ...msg,
                                          message: payload.payload.newMessage
                                      }
                                    : msg
                            )
                        )
                        break
                }
            } catch {}
        }

        ws.onerror = () => setStatus("error")
        ws.onclose = () => setStatus("closed")

        return () => {
            ws.close()
            socketRef.current = null
        }
    }, [auth, meetingId])

    useLayoutEffect(() => {
        const el = listRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }, [messages.length])

    function deleteMessage(id: string) {
        const ws = socketRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return

        ws.send(JSON.stringify({ action: "DELETE_MESSAGE", id }))
        setText("")
    }

    function send() {
        const trimmed = text.trim()
        if (!trimmed) return
        const ws = socketRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return

        ws.send(JSON.stringify({ action: "CREATE_MESSAGE", message: trimmed }))
        setText("")
    }

    return (
        <section className="rounded-2xl h-[512px] border border-gray-200 bg-white shadow-sm flex flex-col">
            <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Chat</h3>
                <span className="text-xs text-gray-500">
                    {status === "connecting" && "Connecting…"}
                    {status === "open" && "Live"}
                    {status === "closed" && "Disconnected"}
                    {status === "error" && "Error"}
                </span>
            </header>

            <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-gray-50"
            >
                {messages.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No messages yet. Start the conversation.
                    </p>
                ) : (
                    messages.map((message) => (
                        <Chat
                            message={message}
                            editable={
                                message.userId === user?.googleID || moderator
                            }
                            names={names}
                            deleteButton={() =>
                                deleteMessage(message.messageId)
                            }
                            editButton={() => {}}
                        />
                    ))
                )}
            </div>

            <div className="p-2 border-t border-gray-200">
                <div className="flex items-center gap-2 p-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder="Write a message…"
                        className="input input-bordered w-full text-sm"
                        disabled={status !== "open"}
                    />

                    <button
                        onClick={send}
                        className="cursor-pointer text-sm"
                        disabled={status !== "open" || !text.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </section>
    )
}
