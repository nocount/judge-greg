import SwiftUI

struct MTGTheme {
    // Backgrounds
    static let background      = Color(hex: "0D0D0D")
    static let surfaceDark     = Color(hex: "161616")
    static let surfaceMid      = Color(hex: "242424")
    static let surfaceLight    = Color(hex: "2E2E2E")

    // Message bubbles
    static let userBubble         = Color(hex: "1E7FC4")
    static let judgeBubble        = Color(hex: "1E1E1E")
    static let judgeBubbleBorder  = Color(hex: "333333")

    // Text
    static let textPrimary   = Color(hex: "E8E8E8")
    static let textSecondary = Color(hex: "8A8A8A")
    static let textUser      = Color.white

    // Accents
    static let accentBlue = Color(hex: "1E7FC4")
    static let accentGold = Color(hex: "C8A951")

    // MTG five mana colors — used for the decorative top bar
    static let manaWhite = Color(hex: "F0E6C8")
    static let manaBlue  = Color(hex: "1E7FC4")
    static let manaBlack = Color(hex: "8C4A9C")
    static let manaRed   = Color(hex: "D3202A")
    static let manaGreen = Color(hex: "00733E")

    static let manaColors: [Color] = [manaWhite, manaBlue, manaBlack, manaRed, manaGreen]
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 255, 255, 255)
        }
        self.init(
            .sRGB,
            red:     Double(r) / 255,
            green:   Double(g) / 255,
            blue:    Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
