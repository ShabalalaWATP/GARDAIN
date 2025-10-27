//
//  RemoteImage.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI

struct RemoteImage: View {
    @EnvironmentObject private var storageService: StorageService
    @State private var image: UIImage? = nil
    @State private var isLoading = true
    var name: String
    
    var body: some View {
        content
            .task {
                if let data = await storageService.download(withName: name) {
                    image = UIImage(data: data)
                }
                isLoading = false
            }
    }
    
    @ViewBuilder
    private var content: some View {
        if isLoading {
            ProgressView()
        } else if let image {
            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fill)
        } else {
            EmptyView()
        }
    }
}
