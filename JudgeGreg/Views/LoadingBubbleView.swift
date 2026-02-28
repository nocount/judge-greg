import SwiftUI

struct LoadingBubbleView: View {
    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            JudgeIconView()

            HStack(spacing: 5) {
                BouncingDot(delay: 0.0)
                BouncingDot(delay: 0.2)
                BouncingDot(delay: 0.4)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(MTGTheme.judgeBubble)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .strokeBorder(MTGTheme.judgeBubbleBorder, lineWidth: 1)
                    )
            )

            Spacer(minLength: 60)
        }
    }
}

private struct BouncingDot: View {
    let delay: Double
    @State private var isUp = false

    var body: some View {
        Circle()
            .fill(MTGTheme.textSecondary)
            .frame(width: 7, height: 7)
            .offset(y: isUp ? -4 : 4)
            .animation(
                .easeInOut(duration: 0.5)
                    .repeatForever(autoreverses: true)
                    .delay(delay),
                value: isUp
            )
            .onAppear { isUp = true }
    }
}

// Shared judge avatar — used in both LoadingBubbleView and MessageBubbleView
struct JudgeIconView: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(MTGTheme.accentBlue.opacity(0.18))
                .frame(width: 28, height: 28)
            Image(systemName: "scale.3d")
                .font(.system(size: 14))
                .foregroundColor(MTGTheme.accentBlue)
        }
    }
}

#Preview {
    ZStack {
        MTGTheme.background.ignoresSafeArea()
        LoadingBubbleView().padding()
    }
}
