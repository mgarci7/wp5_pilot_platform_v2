import type { Message } from "@/lib/types"
import { formatMessageTime } from "@/lib/dates"

interface NewsArticleCardProps {
  message: Message
  onClick?: () => void
}

export default function NewsArticleCard({ message, onClick }: NewsArticleCardProps) {
  return (
    <div className="flex justify-center my-2 px-4">
      <div
        className={`bg-bg-surface rounded-lg shadow-sm overflow-hidden border border-border max-w-[85%] w-full${onClick ? " cursor-pointer hover:border-accent hover:shadow-md transition-shadow" : ""}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick() } : undefined}
      >
        <div className="h-1 bg-accent" />
        <div className="p-3.5">
          {message.source && (
            <p className="text-[11px] text-secondary uppercase tracking-wider mb-1 font-medium">
              {message.source}
            </p>
          )}
          {message.headline && (
            <h3 className="text-[14px] font-semibold text-primary leading-snug mb-1.5">
              {message.headline}
            </h3>
          )}
          {message.body && (
            <p className="text-[13px] text-secondary leading-relaxed line-clamp-5">
              {message.body}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-secondary">
              {formatMessageTime(message.timestamp)}
            </p>
            {onClick && (
              <p className="text-[11px] text-accent font-medium">
                Leer artículo completo →
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
