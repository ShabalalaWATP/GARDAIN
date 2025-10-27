//
//  ReportsService.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import Amplify
import AWSPluginsCore 
import SwiftUI
import Combine

@MainActor
class ReportsService: ObservableObject {
    @Published var reports: [Report] = []

    func fetchReports() async {
        do {
            let result = try await Amplify.API.query(request: .list(Report.self))
            switch result {
            case .success(let reportsList):
                print("Fetched \(reportsList.count) reports")
                reports = reportsList.elements
            case .failure(let error):
                print("Fetch Reports failed with error: \(error)")
            }
        } catch {
            print("Fetch Reports failed with error: \(error)")
        }
    }

    func save(_ report: Report) async {
        do {
            let result = try await Amplify.API.mutate(request: .create(report))
            switch result {
            case .success(let report):
                print("Save report completed")
                reports.append(report)
            case .failure(let error):
                print("Save Report failed with error: \(error)")
            }
        } catch {
            print("Save Report failed with error: \(error)")
        }
    }

    func delete(_ report: Report) async {
        do {
            let result = try await Amplify.API.mutate(request: .delete(report))
            switch result {
            case .success(let report):
                print("Delete report completed")
                reports.removeAll(where: { $0.id == report.id })
            case .failure(let error):
                print("Delete Report failed with error: \(error)")
            }
        } catch {
            print("Delete Report failed with error: \(error)")
        }
    }
}
