import Foundation

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText: String = ""
    @Published var isLoading: Bool = false

    var canSend: Bool {
        !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isLoading
    }

    func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        messages.append(ChatMessage(role: .user, content: text))
        inputText = ""
        isLoading = true

        // Phase 1 stub — replaced by Claude API in Phase 2
        Task {
            try? await Task.sleep(for: .seconds(1))
            messages.append(ChatMessage(
                role: .judge,
                content: "Judge Greg is warming up. Claude API integration arrives in Phase 2."
            ))
            isLoading = false
        }
    }

    func clearSession() {
        messages = []
        inputText = ""
        isLoading = false
    }
}
