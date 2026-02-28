import SwiftUI

struct MessageBubbleView: View {
    let message: ChatMessage

    private var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            // Left side: judge avatar (judge messages only)
            if !isUser {
                JudgeIconView()
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.body)
                    .foregroundColor(isUser ? MTGTheme.textUser : MTGTheme.textPrimary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(isUser ? MTGTheme.userBubble : MTGTheme.judgeBubble)
                            .overlay(
                                RoundedRectangle(cornerRadius: 18)
                                    .strokeBorder(
                                        isUser ? Color.clear : MTGTheme.judgeBubbleBorder,
                                        lineWidth: 1
                                    )
                            )
                    )

                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundColor(MTGTheme.textSecondary)
                    .padding(.horizontal, 4)
            }

            // Right side: user avatar (user messages only)
            if isUser {
                ZStack {
                    Circle()
                        .fill(MTGTheme.userBubble.opacity(0.25))
                        .frame(width: 28, height: 28)
                    Image(systemName: "person.fill")
                        .font(.system(size: 13))
                        .foregroundColor(MTGTheme.userBubble)
                }
            }

            // Push user bubbles right, judge bubbles left
            if isUser  { EmptyView() } else { Spacer(minLength: 60) }
            if !isUser { EmptyView() } else { EmptyView() }
        }
        // Align the whole row
        .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)
    }
}

#Preview {
    ZStack {
        MTGTheme.background.ignoresSafeArea()
        VStack(spacing: 12) {
            MessageBubbleView(message: ChatMessage(role: .user, content: "What does lifelink do?"))
            MessageBubbleView(message: ChatMessage(
                role: .judge,
                content: "Lifelink (CR 702.15) means that damage dealt by the creature also causes its controller to gain that much life. This happens simultaneously with the damage."
            ))
        }
        .padding()
    }
}
