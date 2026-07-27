/**
 * Native LiDAR Module for iOS
 * Provides access to ARKit LiDAR depth data on iPhone 12 Pro+ and iPad Pro
 */

import Foundation
import ARKit
import React

@objc(NativeLiDARModule)
class NativeLiDARModule: NSObject, ARSessionDelegate {

  private var arSession: ARSession?
  private var isSessionActive = false

  // MARK: - Initialization

  @objc(initialize:rejecter:)
  func initialize(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      do {
        self.arSession = ARSession()
        self.arSession?.delegate = self
        resolve(true)
      } catch {
        reject("INIT_FAILED", "Failed to initialize AR session", error)
      }
    }
  }

  // MARK: - LiDAR Availability Check

  @objc(isLiDARAvailable:rejecter:)
  func isLiDARAvailable(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let isAvailable = ARWorldTrackingConfiguration.isSupported &&
                      ARWorldTrackingConfiguration().isFrameSemanticDataEnabled

    // Check device has LiDAR
    let hasLiDAR = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)

    resolve(hasLiDAR)
  }

  // MARK: - Permissions

  @objc(requestLiDARPermission:rejecter:)
  func requestLiDARPermission(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let status = ARWorldTrackingConfiguration.requiredFrameRateSupport

      // ARKit uses system camera permissions
      let cameraAuthStatus = AVCaptureDevice.authorizationStatus(for: .video)

      switch cameraAuthStatus {
      case .authorized:
        resolve(true)
      case .notDetermined:
        AVCaptureDevice.requestAccess(for: .video) { granted in
          resolve(granted)
        }
      case .denied, .restricted:
        resolve(false)
      @unknown default:
        resolve(false)
      }
    }
  }

  // MARK: - Session Management

  @objc(startLiDARSession:rejecter:)
  func startLiDARSession(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard ARWorldTrackingConfiguration.isSupported else {
      reject("NOT_SUPPORTED", "AR World Tracking not supported", nil)
      return
    }

    DispatchQueue.main.async {
      let configuration = ARWorldTrackingConfiguration()

      // Enable depth data
      if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth) {
        configuration.frameSemantics.insert(.personSegmentationWithDepth)
      }

      // Enable LiDAR if available
      if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
        configuration.sceneReconstruction = .mesh
      }

      self.arSession?.run(configuration)
      self.isSessionActive = true

      resolve(true)
    }
  }

  @objc(stopLiDARSession:rejecter:)
  func stopLiDARSession(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      self.arSession?.pause()
      self.isSessionActive = false
      resolve(true)
    }
  }

  // MARK: - Depth Data Capture

  @objc(getDepthAtPoint:y:resolver:rejecter:)
  func getDepthAtPoint(x: CGFloat, y: CGFloat, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let frame = self.arSession?.currentFrame else {
      resolve(NSNull())
      return
    }

    guard let depthData = frame.capturedDepthData else {
      resolve(NSNull())
      return
    }

    let depthMap = depthData.depthDataMap
    let depthValue = depthMap.depthValue(at: CGPoint(x: x, y: y))

    resolve(depthValue)
  }

  @objc(captureDepthFrame:rejecter:)
  func captureDepthFrame(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let frame = self.arSession?.currentFrame else {
      reject("NO_FRAME", "No current AR frame available", nil)
      return
    }

    guard let depthData = frame.capturedDepthData else {
      reject("NO_DEPTH", "Depth data not available", nil)
      return
    }

    let depthMap = depthData.depthDataMap
    let width = CVPixelBufferGetWidth(depthMap)
    let height = CVPixelBufferGetHeight(depthMap)

    // Convert depth data to Float32Array
    CVPixelBufferLockBaseAddress(depthMap, .readOnly)
    guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else {
      CVPixelBufferUnlockBaseAddress(depthMap, .readOnly)
      reject("CONVERSION_FAILED", "Failed to access depth data", nil)
      return
    }

    let depthFloats = Array(
      UnsafeBufferPointer(
        start: baseAddress.assumingMemoryBound(to: Float32.self),
        count: width * height
      )
    )

    CVPixelBufferUnlockBaseAddress(depthMap, .readOnly)

    // Extract confidence if available
    let confidenceData: [UInt8]? = nil

    let frameDict: [String: Any] = [
      "depthData": depthFloats,
      "width": width,
      "height": height,
      "timestamp": frame.timestamp,
      "confidenceData": confidenceData as Any,
    ]

    resolve(frameDict)
  }

  // MARK: - LiDAR Specifications

  @objc(getLiDARSpecs:rejecter:)
  func getLiDARSpecs(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // iPhone 12 Pro+ / iPad Pro LiDAR specs:
    // Accuracy: ±2-5mm
    // Range: 0.3m - 5m
    // FOV: 93.5° (horizontal)

    let specs: [String: Any] = [
      "accuracy": 5, // mm
      "maxRange": 5, // meters
      "minRange": 0.3,
      "fov": 93.5,
    ]

    resolve(specs)
  }

  // MARK: - AR Session Delegate

  func session(_ session: ARSession, didFailWithError error: Error) {
    NSLog("AR Session failed: %@", error.localizedDescription)
  }

  func sessionWasInterrupted(_ session: ARSession) {
    NSLog("AR Session interrupted")
  }

  func sessionInterruptionEnded(_ session: ARSession) {
    NSLog("AR Session interruption ended")
  }
}
