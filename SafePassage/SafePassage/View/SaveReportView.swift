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
            Section("Status Update") {
                LocationView()
                Text("Please inform us of the progress of your evacuation. Include any medical conditions or other information that may be relevant. Report here if you are in distress or if you are unable to evacuate safely.")
                ZStack(alignment: .topLeading) {
                    if description.isEmpty {
                        Text("Type your update in this box.")
                            .foregroundColor(.gray)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 12)
                    }
                    
                    TextEditor(text: $description)
                        .frame(minHeight: 80)
                        .padding(4)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.3))
                        )
                        .cornerRadius(12)
                }
            }
            Section("Details") {
                TextField("Full Name", text: $name)
                Text("Confirm your full name as it appears in your Passport.")
            }
            Section("Evacuation Status") {
                Text("Confirm that you currently wish to be evacuated. If the situation changes send an update.")
                Picker("Do you wish to evacuate?", selection: $toEvacuate) {
                    Text("Yes")
                        .tag(true)
                    Text("No")
                        .tag(false)
                }
                .pickerStyle(.segmented)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(toEvacuate ? Color.green : Color.red)
                        .animation(.easeInOut(duration: 0.2), value: toEvacuate)
                )
            }

            Section("Picture") {
                Text("Please send a clear image from the photo page of your passport. Once verified you can also submit hazards or damage in the local area to aid in evacuation coordination.")
                PicturePicker(selectedData: $image)
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
