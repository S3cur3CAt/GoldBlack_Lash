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
var currentRequest: SFSpeechAudioBufferRecognitionRequest?
var currentTask: SFSpeechRecognitionTask?
var silenceTimer: DispatchWorkItem?
var lastTranscript = ""
var isPaused = false

func startRecognitionSession() {
    DispatchQueue.main.async {
        silenceTimer?.cancel()
        currentTask?.cancel()
        currentRequest = nil
        lastTranscript = ""

        if isPaused { return }

        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        currentRequest = req

        currentTask = recognizer.recognitionTask(with: req) { result, error in
            if isPaused { return }

            if let result = result {
                let transcript = result.bestTranscription.formattedString
                if transcript != lastTranscript && !transcript.isEmpty {
                    lastTranscript = transcript
                    print("TRANSCRIPT: \(transcript)")
                    fflush(stdout)

                    silenceTimer?.cancel()
                    let timer = DispatchWorkItem {
                        if !lastTranscript.isEmpty {
                            print("FINAL: \(lastTranscript)")
                            fflush(stdout)
                        }
                        // Automatically restart recognition session without exiting process
                        startRecognitionSession()
                    }
                    silenceTimer = timer
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2, execute: timer)
                }

                if result.isFinal {
                    silenceTimer?.cancel()
                    if !transcript.isEmpty {
                        print("FINAL: \(transcript)")
                        fflush(stdout)
                    }
                    startRecognitionSession()
                }
            }

            if let error = error {
                let nsError = error as NSError
                // 216 = Apple recognition timeout / cancellation
                // 1110 = no speech detected
                silenceTimer?.cancel()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    if !isPaused {
                        startRecognitionSession()
                    }
                }
            }
        }
    }
}

let inputNode = audioEngine.inputNode
let recordingFormat = inputNode.outputFormat(forBus: 0)

inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
    if !isPaused {
        currentRequest?.append(buffer)
    }
}

do {
    audioEngine.prepare()
    try audioEngine.start()
    fputs("LISTENING_READY\n", stderr)
    startRecognitionSession()
} catch {
    fputs("ERROR_AUDIO_ENGINE: \(error.localizedDescription)\n", stderr)
    exit(3)
}

// Background thread reading commands from stdin: "PAUSE", "RESUME", "QUIT"
DispatchQueue.global(qos: .background).async {
    let handle = FileHandle.standardInput
    while true {
        let data = handle.availableData
        if data.isEmpty { break }
        if let rawStr = String(data: data, encoding: .utf8) {
            let lines = rawStr.split(separator: "\n")
            for line in lines {
                let cmd = line.trimmingCharacters(in: .whitespacesAndNewlines)
                if cmd == "PAUSE" {
                    DispatchQueue.main.async {
                        isPaused = true
                        silenceTimer?.cancel()
                        currentTask?.cancel()
                        currentRequest = nil
                        fputs("LISTENING_PAUSED\n", stderr)
                    }
                } else if cmd == "RESUME" {
                    DispatchQueue.main.async {
                        isPaused = false
                        startRecognitionSession()
                        fputs("LISTENING_RESUMED\n", stderr)
                    }
                } else if cmd == "QUIT" {
                    exit(0)
                }
            }
        }
    }
}

signal(SIGINT) { _ in exit(0) }
signal(SIGTERM) { _ in exit(0) }

RunLoop.main.run()
