//
//  MapView.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI
import MapKit
import CoreLocation
import Combine

struct MapView: View {
    @StateObject private var locationViewModel = LocationViewModel()
    @State private var position: MapCameraPosition = {
        let center = CLLocationCoordinate2D(latitude: 51.507222, longitude: -0.1275)
        let span = MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
        let region = MKCoordinateRegion(center: center, span: span)
        return .region(region)
    }()

    var body: some View {
        ZStack(alignment: .top) {
            Map(position: $position) {
                UserAnnotation()
            }
            .ignoresSafeArea()
            .onReceive(locationViewModel.$userLocation) { location in
                guard let location = location else { return }
                withAnimation {
                    position = .region(MKCoordinateRegion(
                        center: location,
                        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                    ))
                }
            }
            LocationView()
                .padding()
                .background(Color.black.opacity(0.65))
                .cornerRadius(20)
                .foregroundColor(Color.white)
        }
        
    }
}

#Preview {
    MapView()
}
