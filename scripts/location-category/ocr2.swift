import Vision; import AppKit
for p in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: p), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let W = Double(cg.width), H = Double(cg.height)
  let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.recognitionLanguages = ["ar-SA","en-US"]; req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg).perform([req])
  for o in req.results ?? [] { if let t = o.topCandidates(1).first { let b = o.boundingBox
    print("\(p)\t\(Int(b.minX*W)),\(Int((1-b.maxY)*H)),\(Int(b.maxX*W)),\(Int((1-b.minY)*H))\t\(t.string)") } }
}
