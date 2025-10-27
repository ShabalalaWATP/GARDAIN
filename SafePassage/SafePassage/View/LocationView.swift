//
//  LocationView.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI
internal import _LocationEssentials

struct LocationView: View {
    @ObservedObject var locationViewModel = LocationViewModel()
        
    var body: some View {
        VStack {
            if let location = locationViewModel.userLocation {
                Text("Latitude: \(location.latitude)")
                Text("Longitude: \(location.longitude)")
            } else {
                Text("Location not available.")
            }
        }
    }
}


#Preview {
    LocationView()
}
