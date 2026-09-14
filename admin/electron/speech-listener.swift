import Foundation
import Speech
import AVFoundation

// ═══════════════════════════════════════════════════════════════════════════════
// GoldBlack Lash — Sofi Background Continuous Speech Listener (macOS 12+)
// ═══════════════════════════════════════════════════════════════════════════════
// Runs as a persistent background process. Continuously listens for speech
// via Apple's SFSpeechRecognizer, emitting TRANSCRIPT/FINAL lines on stdout.
// Controlled via stdin commands: PAUSE, RESUME, QUIT.
// Uses a generation counter to prevent stale callbacks from interfering.
// ═══════════════════════════════════════════════════════════════════════════════

setbuf(stdout, nil)
setbuf(stderr, nil)

// ── Authorization ───────────────────────────────────────────────────────────
let authSema = DispatchSemaphore(value: 0)
var isAuthorized = false

SFSpeechRecognizer.requestAuthorization { status in
    isAuthorized = (status == .authorized)
    authSema.signal()
}
_ = authSema.wait(timeout: .now() + 5.0)

guard isAuthorized else {
    fputs("ERROR_NOT_AUTHORIZED\n", stderr)
    exit(1)
}

guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "es-ES")),
      recognizer.isAvailable else {
    fputs("ERROR_RECOGNIZER_UNAVAILABLE\n", stderr)
    exit(2)
}

// ── State ───────────────────────────────────────────────────────────────────
let audioEngine = AVAudioEngine()
var currentRequest: SFSpeechAudioBufferRecognitionRequest?
var currentTask: SFSpeechRecognitionTask?
var silenceTimer: DispatchWorkItem?
var lastTranscript = ""
var isPaused = false
var sessionGen: Int = 0 // Generation counter to invalidate stale callbacks

// ── Audio Pipeline (installed once, runs forever) ───────────────────────────
let inputNode = audioEngine.inputNode
let recordingFormat = inputNode.outputFormat(forBus: 0)

inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
    // Only feed audio when not paused and request exists
    if !isPaused {
        currentRequest?.append(buffer)
    }
}

// ── Session Management ──────────────────────────────────────────────────────
func startSession() {
    // Increment generation so any pending callbacks from old session are ignored
    sessionGen += 1
    let gen = sessionGen

    // Clean up previous session
    silenceTimer?.cancel()
    silenceTimer = nil
    currentTask?.cancel()
    currentTask = nil
    currentRequest?.endAudio()
    currentRequest = nil
    lastTranscript = ""

    guard !isPaused else { return }

    // Brief delay to let the cancellation callbacks flush through
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
        // Verify this is still the current generation and not paused
        guard gen == sessionGen, !isPaused else { return }

        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        currentRequest = req

        currentTask = recognizer.recognitionTask(with: req) { result, error in
            // ── Dispatch to main queue for thread safety ──
            DispatchQueue.main.async {
                // Ignore callbacks from stale sessions
                guard gen == sessionGen else { return }

                if let result = result {
                    let transcript = result.bestTranscription.formattedString
                    if transcript != lastTranscript && !transcript.isEmpty {
                        lastTranscript = transcript
                        print("TRANSCRIPT: \(transcript)")

                        // Reset silence timer: after 1.2s of silence, emit FINAL and restart
                        silenceTimer?.cancel()
                        let timer = DispatchWorkItem {
                            guard gen == sessionGen else { return }
                            if !lastTranscript.isEmpty {
                                print("FINAL: \(lastTranscript)")
                            }
                            startSession()
                        }
                        silenceTimer = timer
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2, execute: timer)
                    }

                    if result.isFinal {
                        silenceTimer?.cancel()
                        silenceTimer = nil
                        if !transcript.isEmpty {
                            print("FINAL: \(transcript)")
                        }
                        startSession()
                    }
                }

                if error != nil {
                    // Don't restart if we're already restarting or paused
                    guard gen == sessionGen, !isPaused else { return }
                    // Restart session after a short delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        guard gen == sessionGen, !isPaused else { return }
                        startSession()
                    }
                }
            }
        }
    }
}

// ── Start Audio Engine ──────────────────────────────────────────────────────
do {
    audioEngine.prepare()
    try audioEngine.start()
    fputs("LISTENING_READY\n", stderr)
    startSession()
} catch {
    fputs("ERROR_AUDIO_ENGINE: \(error.localizedDescription)\n", stderr)
    exit(3)
}

// ── Stdin Command Reader (background thread) ────────────────────────────────
// Commands: PAUSE (stop recognition), RESUME (restart recognition), QUIT (exit)
DispatchQueue.global(qos: .userInitiated).async {
    while let line = readLine() {
        let cmd = line.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        DispatchQueue.main.async {
            switch cmd {
            case "PAUSE":
                isPaused = true
                sessionGen += 1
                silenceTimer?.cancel()
                silenceTimer = nil
                currentTask?.cancel()
                currentTask = nil
                currentRequest?.endAudio()
                currentRequest = nil
                lastTranscript = ""
                fputs("PAUSED\n", stderr)

            case "RESUME":
                guard isPaused else { return }
                isPaused = false
                fputs("RESUMED\n", stderr)
                startSession()

            case "QUIT":
                exit(0)

            default:
                break
            }
        }
    }
    // stdin closed (parent process died) — exit gracefully
    exit(0)
}

// ── Signal Handlers ─────────────────────────────────────────────────────────
signal(SIGINT)  { _ in exit(0) }
signal(SIGTERM) { _ in exit(0) }

// ── Run Loop (keeps process alive) ──────────────────────────────────────────
RunLoop.main.run()
