import Foundation
import Speech
import AVFoundation

// ═══════════════════════════════════════════════════════════════════════════════
// GoldBlack Lash — Sofi Continuous Speech Listener (macOS 12+ Monterey)
// ═══════════════════════════════════════════════════════════════════════════════
// Pre-compiled native binary for persistent background speech recognition.
// Protocol:
//   stdout → TRANSCRIPT: <partial text>
//   stdout → FINAL: <complete phrase>
//   stderr → LISTENING_READY | PAUSED | RESUMED | SESSION_STARTED | errors
//   stdin  ← PAUSE | RESUME | QUIT
// ═══════════════════════════════════════════════════════════════════════════════

setbuf(stdout, nil)
setbuf(stderr, nil)

// ── 1. Authorization ────────────────────────────────────────────────────────
let authSema = DispatchSemaphore(value: 0)
var authStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined

SFSpeechRecognizer.requestAuthorization { status in
    authStatus = status
    authSema.signal()
}
_ = authSema.wait(timeout: .now() + 5.0)

switch authStatus {
case .authorized:
    break
case .denied:
    fputs("ERROR_DENIED\n", stderr)
    exit(1)
case .restricted:
    fputs("ERROR_RESTRICTED\n", stderr)
    exit(1)
case .notDetermined:
    fputs("ERROR_NOT_DETERMINED\n", stderr)
    exit(1)
@unknown default:
    fputs("ERROR_UNKNOWN_AUTH\n", stderr)
    exit(1)
}

// ── 2. Recognizer Setup ─────────────────────────────────────────────────────
guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "es-ES")) else {
    fputs("ERROR_NO_RECOGNIZER\n", stderr)
    exit(2)
}

if !recognizer.isAvailable {
    fputs("ERROR_RECOGNIZER_UNAVAILABLE\n", stderr)
    exit(2)
}

// ── 3. Audio Engine ─────────────────────────────────────────────────────────
let audioEngine = AVAudioEngine()
let inputNode = audioEngine.inputNode
let busFormat = inputNode.outputFormat(forBus: 0)

// Validate audio format
guard busFormat.sampleRate > 0 && busFormat.channelCount > 0 else {
    fputs("ERROR_BAD_AUDIO_FORMAT sampleRate=\(busFormat.sampleRate) channels=\(busFormat.channelCount)\n", stderr)
    exit(3)
}

fputs("AUDIO_FORMAT sampleRate=\(busFormat.sampleRate) channels=\(busFormat.channelCount)\n", stderr)

// ── 4. State ────────────────────────────────────────────────────────────────
var currentRequest: SFSpeechAudioBufferRecognitionRequest?
var currentTask: SFSpeechRecognitionTask?
var silenceTimer: DispatchWorkItem?
var lastTranscript: String = ""
var isPaused: Bool = false
var sessionGen: Int = 0

// ── 5. Audio Tap (installed once, never removed) ────────────────────────────
inputNode.installTap(onBus: 0, bufferSize: 2048, format: busFormat) { buffer, _ in
    if !isPaused, let req = currentRequest {
        req.append(buffer)
    }
}

// ── 6. Session Management ───────────────────────────────────────────────────
func startSession() {
    sessionGen += 1
    let gen = sessionGen

    // Tear down previous session
    silenceTimer?.cancel()
    silenceTimer = nil

    if let task = currentTask {
        task.cancel()
        currentTask = nil
    }

    if let req = currentRequest {
        req.endAudio()
        currentRequest = nil
    }

    lastTranscript = ""

    guard !isPaused else {
        fputs("SESSION_SKIPPED (paused)\n", stderr)
        return
    }

    // Brief delay so cancellation callbacks from the old session flush
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
        guard gen == sessionGen, !isPaused else { return }

        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        req.taskHint = .dictation
        currentRequest = req

        fputs("SESSION_STARTED gen=\(gen)\n", stderr)

        currentTask = recognizer.recognitionTask(with: req) { result, error in
            DispatchQueue.main.async {
                // Stale session — ignore
                guard gen == sessionGen else { return }

                if let r = result {
                    let text = r.bestTranscription.formattedString
                    if !text.isEmpty && text != lastTranscript {
                        lastTranscript = text
                        print("TRANSCRIPT: \(text)")

                        // Silence timer: emit FINAL after 1.2s of no new words
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

                    if r.isFinal {
                        silenceTimer?.cancel()
                        silenceTimer = nil
                        if !text.isEmpty {
                            print("FINAL: \(text)")
                        }
                        startSession()
                    }
                }

                if let err = error {
                    guard gen == sessionGen, !isPaused else { return }
                    let nse = err as NSError
                    // 216 = speech recognition timeout (normal)
                    // 1110 = no speech detected (normal)
                    if nse.code == 216 || nse.code == 1110 {
                        fputs("SESSION_TIMEOUT gen=\(gen) code=\(nse.code)\n", stderr)
                    } else {
                        fputs("SESSION_ERROR gen=\(gen) code=\(nse.code) domain=\(nse.domain) desc=\(nse.localizedDescription)\n", stderr)
                    }
                    // Restart after short delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        guard gen == sessionGen, !isPaused else { return }
                        startSession()
                    }
                }
            }
        }
    }
}

// ── 7. Start Engine ─────────────────────────────────────────────────────────
do {
    audioEngine.prepare()
    try audioEngine.start()
} catch {
    fputs("ERROR_ENGINE_START \(error.localizedDescription)\n", stderr)
    exit(3)
}

fputs("LISTENING_READY\n", stderr)
startSession()

// ── 8. Stdin Command Reader ─────────────────────────────────────────────────
DispatchQueue.global(qos: .userInitiated).async {
    while let line = readLine() {
        let cmd = line.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if cmd.isEmpty { continue }

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
                if isPaused {
                    isPaused = false
                    fputs("RESUMED\n", stderr)
                    startSession()
                }

            case "QUIT":
                fputs("QUITTING\n", stderr)
                audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                exit(0)

            default:
                fputs("UNKNOWN_CMD: \(cmd)\n", stderr)
            }
        }
    }
    // stdin closed → parent died
    fputs("STDIN_CLOSED\n", stderr)
    exit(0)
}

// ── 9. Signal Handlers ──────────────────────────────────────────────────────
signal(SIGINT)  { _ in exit(0) }
signal(SIGTERM) { _ in exit(0) }

// ── 10. Keep Alive ──────────────────────────────────────────────────────────
RunLoop.main.run()
