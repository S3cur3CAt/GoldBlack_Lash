import Foundation
import Speech
import AVFoundation

// Ensure stdout flushes immediately
setbuf(stdout, nil)

// Check macOS Speech Recognition Authorization
let sema = DispatchSemaphore(value: 0)
var isAuthorized = false

SFSpeechRecognizer.requestAuthorization { status in
    isAuthorized = (status == .authorized)
    sema.signal()
}
_ = sema.wait(timeout: .now() + 3.0)

if !isAuthorized {
    fputs("ERROR_NOT_AUTHORIZED\n", stderr)
    exit(1)
}

guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "es-ES")), recognizer.isAvailable else {
    fputs("ERROR_RECOGNIZER_UNAVAILABLE\n", stderr)
    exit(2)
}

let audioEngine = AVAudioEngine()
let request = SFSpeechAudioBufferRecognitionRequest()
request.shouldReportPartialResults = true

let inputNode = audioEngine.inputNode
let recordingFormat = inputNode.outputFormat(forBus: 0)

inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
    request.append(buffer)
}

do {
    audioEngine.prepare()
    try audioEngine.start()
    fputs("LISTENING_READY\n", stderr)
} catch {
    fputs("ERROR_AUDIO_ENGINE: \(error.localizedDescription)\n", stderr)
    exit(3)
}

var lastTranscript = ""
var silenceTimer: DispatchWorkItem?

let recognitionTask = recognizer.recognitionTask(with: request) { result, error in
    if let result = result {
        let transcript = result.bestTranscription.formattedString
        if transcript != lastTranscript && !transcript.isEmpty {
            lastTranscript = transcript
            print("TRANSCRIPT: \(transcript)")
            fflush(stdout)

            silenceTimer?.cancel()
            let timer = DispatchWorkItem {
                print("FINAL: \(transcript)")
                fflush(stdout)
                exit(0)
            }
            silenceTimer = timer
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2, execute: timer)
        }

        if result.isFinal {
            silenceTimer?.cancel()
            print("FINAL: \(transcript)")
            fflush(stdout)
            exit(0)
        }
    }

    if let error = error {
        let nsError = error as NSError
        if nsError.domain == "kAFAssistantErrorDomain" && nsError.code == 216 {
            exit(0)
        }
        fputs("ERROR: \(error.localizedDescription)\n", stderr)
        exit(4)
    }
}

signal(SIGINT) { _ in
    print("FINAL: \(lastTranscript)")
    exit(0)
}
signal(SIGTERM) { _ in
    print("FINAL: \(lastTranscript)")
    exit(0)
}

RunLoop.main.run()
