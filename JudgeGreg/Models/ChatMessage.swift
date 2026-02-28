import Foundation

struct ChatMessage: Identifiable, Equatable {
    let id: UUID
    let role: Role
    let content: String
    let timestamp: Date

    enum Role {
        case user
        case judge
    }

    init(role: Role, content: String) {
        self.id        = UUID()
        self.role      = role
        self.content   = content
        self.timestamp = Date()
    }
}
