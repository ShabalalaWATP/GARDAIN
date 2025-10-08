//
//  ContentView.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            Tab("Update", systemImage: "person.fill.checkmark") {
                ReportsView()
                    .environmentObject(ReportsService())
            }
            Tab("Map", systemImage: "globe.europe.africa.fill") {
                MapView()
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
    }
}

#Preview {
    ContentView()
}
