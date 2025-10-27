//
//  SafePassageApp.swift
//  SafePassage
//
//  Created by Andrew Stannard on 07/10/2025.
//

import Amplify
import AWSAPIPlugin
import AWSCognitoAuthPlugin
import AWSS3StoragePlugin
import SwiftUI

@main
struct SafePassageApp: App {
    init() {
        do {
            try Amplify.add(plugin: AWSCognitoAuthPlugin())
            try Amplify.add(plugin: AWSAPIPlugin(modelRegistration: AmplifyModels()))
            try Amplify.add(plugin: AWSS3StoragePlugin())
            try Amplify.configure()
            print("Initialise Amplify")
        } catch {
            print("Could not initialise Amplify: \(error)")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            LandingView()
                .environmentObject(AuthenticationService())
                .environmentObject(ReportsService())
                .environmentObject(StorageService())
        }
    }
}
