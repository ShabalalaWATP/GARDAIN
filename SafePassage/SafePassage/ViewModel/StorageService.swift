//
//  StorageService.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import Amplify
import Foundation
import Combine

class StorageService: ObservableObject {
    func upload(_ data: Data, name: String) async {
        let task = Amplify.Storage.uploadData(
            key: name,
            data: data,
            options: .init(accessLevel: .private)
        )
        do {
            let result = try await task.value
            print("Upload data completed with result: \(result)")
        } catch {
            print("Upload data failed with error: \(error)")
        }
    }

    func download(withName name: String) async -> Data? {
        let task = Amplify.Storage.downloadData(
            key: name,
            options: .init(accessLevel: .private)
        )
        do {
            let result = try await task.value
            print("Download data completed")
            return result
        } catch {
            print("Download data failed with error: \(error)")
            return nil
        }
    }

    func remove(withName name: String) async {
        do {
            let result = try await Amplify.Storage.remove(
                key: name,
                options: .init(accessLevel: .private)
            )
            print("Remove completed with result: \(result)")
        } catch {
            print("Remove failed with error: \(error)")
        }
    }
}
