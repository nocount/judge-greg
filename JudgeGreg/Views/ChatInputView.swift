import SwiftUI

struct ChatInputView: View {
    @ObservedObject var viewModel: ChatViewModel
    @FocusState private var isInputFocused: Bool

    var body: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Ask the judge...", text: $viewModel.inputText, axis: .vertical)
                .lineLimit(1...5)
                .font(.body)
                .foregroundColor(MTGTheme.textPrimary)
                .tint(MTGTheme.accentBlue)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(MTGTheme.surfaceMid)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .strokeBorder(
                                    isInputFocused
                                        ? MTGTheme.accentBlue.opacity(0.6)
                                        : MTGTheme.surfaceLight,
                                    lineWidth: 1
                                )
                        )
                )
                .focused($isInputFocused)
                .submitLabel(.send)
                .onSubmit {
                    if viewModel.canSend {
                        viewModel.sendMessage()
                    }
                }

            Button {
                viewModel.sendMessage()
                isInputFocused = false
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 36))
                    .foregroundColor(viewModel.canSend ? MTGTheme.accentBlue : MTGTheme.surfaceLight)
                    .animation(.easeInOut(duration: 0.15), value: viewModel.canSend)
            }
            .disabled(!viewModel.canSend)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(MTGTheme.surfaceDark)
    }
}
