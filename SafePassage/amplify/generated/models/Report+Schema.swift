// swiftlint:disable all
import Amplify
import Foundation

extension Report {
  // MARK: - CodingKeys 
   public enum CodingKeys: String, ModelKey {
    case id
    case name
    case description
    case image
    case lat
    case lon
    case toEvacuate
    case createdAt
    case updatedAt
  }
  
  public static let keys = CodingKeys.self
  //  MARK: - ModelSchema 
  
  public static let schema = defineSchema { model in
    let report = Report.keys
    
    model.authRules = [
      rule(allow: .owner, ownerField: "owner", identityClaim: "cognito:username", provider: .userPools, operations: [.create, .update, .delete, .read])
    ]
    
    model.listPluralName = "Reports"
    model.syncPluralName = "Reports"
    
    model.attributes(
      .primaryKey(fields: [report.id])
    )
    
    model.fields(
      .field(report.id, is: .required, ofType: .string),
      .field(report.name, is: .required, ofType: .string),
      .field(report.description, is: .optional, ofType: .string),
      .field(report.image, is: .optional, ofType: .string),
      .field(report.lat, is: .optional, ofType: .double),
      .field(report.lon, is: .optional, ofType: .double),
      .field(report.toEvacuate, is: .required, ofType: .bool),
      .field(report.createdAt, is: .optional, isReadOnly: true, ofType: .dateTime),
      .field(report.updatedAt, is: .optional, isReadOnly: true, ofType: .dateTime)
    )
    }
}

extension Report: ModelIdentifiable {
  public typealias IdentifierFormat = ModelIdentifierFormat.Default
  public typealias IdentifierProtocol = DefaultModelIdentifier<Self>
}