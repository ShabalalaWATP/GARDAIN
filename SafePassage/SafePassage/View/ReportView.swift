//
//  ReportView.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI

struct ReportView: View {
    @State var report: Report

    var body: some View {
        HStack(alignment: .center, spacing: 5.0) {
            VStack(alignment: .leading, spacing: 5.0) {
                Text(report.name)
                    .bold()
                if let description = report.description {
                    Text(description)
                }
            }

            if let image = report.image {
                Spacer()
                RemoteImage(name: image)
                    .frame(width: 30, height: 30)

            }
        }
    }
}
