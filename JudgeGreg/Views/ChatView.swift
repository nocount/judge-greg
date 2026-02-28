import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()
    @State private var showClearConfirmation = false

    var body: some View {
        NavigationStack {
            ZStack {
                MTGTheme.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    ManaColorBar()

                    ScrollViewReader { proxy in
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                if viewModel.messages.isEmpty {
                                    EmptyStateView()
                                        .padding(.top, 48)
                                }

                                ForEach(viewModel.messages) { message in
                                    MessageBubbleView(message: message)
                                        .id(message.id)
                                }

                                if viewModel.isLoading {
                                    LoadingBubbleView()
                                        .id("loading")
                                }

                                // Invisible anchor for scrolling to the very bottom
                                Color.clear
                                    .frame(height: 1)
                                    .id("bottom")
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                        }
                        .onChange(of: viewModel.messages.count) {
                            withAnimation(.easeOut(duration: 0.25)) {
                                proxy.scrollTo("bottom", anchor: .bottom)
                            }
                        }
                        .onChange(of: viewModel.isLoading) {
                            if viewModel.isLoading {
                                withAnimation(.easeOut(duration: 0.25)) {
                                    proxy.scrollTo("loading", anchor: .bottom)
                                }
                            }
                        }
                    }

                    Divider()
                        .background(MTGTheme.surfaceMid)

                    ChatInputView(viewModel: viewModel)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Judge Greg")
                        .font(.headline)
                        .foregroundColor(MTGTheme.textPrimary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        if !viewModel.messages.isEmpty {
                            showClearConfirmation = true
                        }
                    } label: {
                        Image(systemName: "arrow.counterclockwise")
                            .foregroundColor(
                                viewModel.messages.isEmpty
                                    ? MTGTheme.textSecondary
                                    : MTGTheme.accentBlue
                            )
                    }
                    .disabled(viewModel.messages.isEmpty)
                }
            }
            .toolbarBackground(MTGTheme.surfaceDark, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .alert("New Session", isPresented: $showClearConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Clear", role: .destructive) {
                    viewModel.clearSession()
                }
            } message: {
                Text("This will clear the current conversation.")
            }
        }
        .preferredColorScheme(.dark)
    }
}

// Five mana color segments shown as a thin decorative strip
private struct ManaColorBar: View {
    var body: some View {
        HStack(spacing: 0) {
            ForEach(MTGTheme.manaColors.indices, id: \.self) { i in
                MTGTheme.manaColors[i]
            }
        }
        .frame(height: 3)
    }
}

#Preview {
    ChatView()
}
