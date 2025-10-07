//
//  SaveReportView.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI

struct SaveReportView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var reportsService: ReportsService
    @EnvironmentObject private var storageService: StorageService
    
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
                            
            Button("Save Report") {
                let imageName = image != nil ? UUID().uuidString : nil
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
