//
//  SaveReportView.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI
internal import _LocationEssentials

struct SaveReportView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var reportsService: ReportsService
    @EnvironmentObject private var storageService: StorageService
    @ObservedObject var locationViewModel = LocationViewModel()
    
    @State private var name = ""
    @State private var description = ""
    @State private var image: Data? = nil
    @State private var lat = 51.0
    @State private var lon = -0.1
    @State private var toEvacuate = false

    var body: some View {
        Form {
            Section("Details") {
                TextField("Full Name", text: $name)
                TextField("Description", text: $description)
            }
            Section("Picture") {
                PicturePicker(selectedData: $image)
            }
            Section("Location") {
                LocationView()
            }
            Button("Save Report") {
                let imageName = image != nil ? UUID().uuidString : nil
                if let location = locationViewModel.userLocation {
                    lat = location.latitude
                    lon = location.longitude
                } else {
                    print("Location not available.")
                }
                let report = Report(
                    id: UUID().uuidString,
                    name: name,
                    description: description.isEmpty ? nil: description,
                    image: imageName,
                    lat: lat,
                    lon: lon,
                    toEvacuate: toEvacuate
                )
                
                Task {
                    if let image, let imageName {
                        await storageService.upload(image, name: imageName)
                    }
                    await reportsService.save(report)
                    
                    dismiss()
                }
            }
        }
    }
}

#Preview {
    SaveReportView()
}
