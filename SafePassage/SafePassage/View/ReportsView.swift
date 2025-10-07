//
//  ReportsView.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import SwiftUI

struct ReportsView: View {

    @EnvironmentObject private var authenticationService: AuthenticationService
    @EnvironmentObject private var reportsService: ReportsService
    @EnvironmentObject private var storageService: StorageService
    @State private var isSavingReport: Bool = false

    var body: some View {
        NavigationStack{
            List {
                if reportsService.reports.isEmpty {
                    Text("No reports")
                }
                ForEach(reportsService.reports, id: \.id) { report in
                    ReportView(report: report)
                }
                .onDelete { indicies in
                    for index in indicies {
                        let report = reportsService.reports[index]
                        Task {
                            await reportsService.delete(report)
                            if let image = report.image {
                                await storageService.remove(withName: image)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Reports")
            .toolbar {
                Button("Sign Out") {
                    Task {
                        await authenticationService.signOut()
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .bottomBar) {
                    Button ("⨁ New Report") {
                        isSavingReport = true
                    }
                    .bold()
                }
            }
            .sheet(isPresented: $isSavingReport) {
                SaveReportView()
            }
        }
        .task {
            await reportsService.fetchReports()
        }
    }
}

#Preview {
    ReportsView()
}
