import SwiftUI

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(MTGTheme.accentBlue.opacity(0.12))
                    .frame(width: 88, height: 88)
                Image(systemName: "scale.3d")
                    .font(.system(size: 40))
                    .foregroundColor(MTGTheme.accentBlue)
            }

            VStack(spacing: 8) {
                Text("Ask the Judge")
                    .font(.title2.bold())
                    .foregroundColor(MTGTheme.textPrimary)
                Text("Get precise answers on MTG rules,\ncard interactions, and format legality.")
                    .font(.subheadline)
                    .foregroundColor(MTGTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 10) {
                SuggestionChip(text: "What does deathtouch do?")
                SuggestionChip(text: "Can I respond to a sorcery?")
                SuggestionChip(text: "Is Ragavan legal in Modern?")
            }
        }
        .padding(24)
    }
}

struct SuggestionChip: View {
    let text: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "text.bubble")
                .font(.caption)
                .foregroundColor(MTGTheme.accentBlue)
            Text(text)
                .font(.caption)
                .foregroundColor(MTGTheme.textSecondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(MTGTheme.surfaceMid)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(MTGTheme.surfaceLight, lineWidth: 1)
                )
        )
    }
}

#Preview {
    ZStack {
        MTGTheme.background.ignoresSafeArea()
        EmptyStateView()
    }
}
