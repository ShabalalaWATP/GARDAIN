// swiftlint:disable all
import Amplify
import Foundation

public struct Report: Model {
  public let id: String
  public var name: String
  public var description: String?
  public var image: String?
  public var lat: Double?
  public var lon: Double?
  public var toEvacuate: Bool
  public var createdAt: Temporal.DateTime?
  public var updatedAt: Temporal.DateTime?
  
  public init(id: String = UUID().uuidString,
      name: String,
      description: String? = nil,
      image: String? = nil,
      lat: Double? = nil,
      lon: Double? = nil,
      toEvacuate: Bool) {
    self.init(id: id,
      name: name,
      description: description,
      image: image,
      lat: lat,
      lon: lon,
      toEvacuate: toEvacuate,
      createdAt: nil,
      updatedAt: nil)
  }
  internal init(id: String = UUID().uuidString,
      name: String,
      description: String? = nil,
      image: String? = nil,
      lat: Double? = nil,
      lon: Double? = nil,
      toEvacuate: Bool,
      createdAt: Temporal.DateTime? = nil,
      updatedAt: Temporal.DateTime? = nil) {
      self.id = id
      self.name = name
      self.description = description
      self.image = image
      self.lat = lat
      self.lon = lon
      self.toEvacuate = toEvacuate
      self.createdAt = createdAt
      self.updatedAt = updatedAt
  }
}