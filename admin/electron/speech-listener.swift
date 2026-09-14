import Foundation
import Speech
import AVFoundation

// ═══════════════════════════════════════════════════════════════════════════════
// GoldBlack Lash — Sofi Native Continuous Speech Listener (macOS Monterey 12+)
// ═══════════════════════════════════════════════════════════════════════════════
// High-performance, robust native background speech recognition engine.
// Features:
//   - Non-blocking asynchronous authorization flow (no main-thread deadlocks)
//   - Explicit microphone and speech recognition permission handlers
//   - Resilient AVAudioEngine setup adapting to any hardware sample rate
//   - Continuous recognition session cycling on silence or network timeouts
//   - Bidirectional IPC via stdio (PAUSE / RESUME / QUIT)
//   - Graceful termination on SIGINT / SIGTERM / STDIN EOF
// ═══════════════════════════════════════════════════════════════════════════════

setbuf(stdout, nil)
setbuf(stderr, nil)

final class SofiSpeechController: NSObject, SFSpeechRecognizerDelegate {
    private var recognizer: SFSpeechRecognizer?
    private let audioEngine = AVAudioEngine()
    private var currentRequest: SFSpeechAudioBufferRecognitionRequest?
    private var currentTask: SFSpeechRecognitionTask?
    private var silenceTimer: DispatchWorkItem?
    private var lastTranscript: String = ""
    private var isPaused: Bool = false
    private var sessionGen: Int = 0
    private var isEngineRunning: Bool = false
    private var isTapInstalled: Bool = false
    private let targetLocale = Locale(identifier: "es-ES")

    override init() {
        super.init()
    }

    // ── 1. Entry Point: Asynchronous Authorization ──────────────────────────
    func start() {
        fputs("STATUS: INITIALIZING\n", stderr)

        // Request Speech Recognition Authorization asynchronously on main runloop
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                guard let self = self else { return }
                switch authStatus {
                case .authorized:
                    fputs("STATUS: SPEECH_AUTHORIZED\n", stderr)
                    self.checkMicrophoneAndSetup()
                case .denied:
                    fputs("ERROR: SPEECH_DENIED\n", stderr)
                    fputs("DIAGNOSTIC: Acceso a reconocimiento de voz denegado. Permítelo en Ajustes del Sistema -> Privacidad y Seguridad -> Reconocimiento de voz.\n", stderr)
                    exit(1)
                case .restricted:
                    fputs("ERROR: SPEECH_RESTRICTED\n", stderr)
                    fputs("DIAGNOSTIC: Reconocimiento de voz restringido por directivas del sistema o controles parentales.\n", stderr)
                    exit(1)
                case .notDetermined:
                    fputs("ERROR: SPEECH_NOT_DETERMINED\n", stderr)
                    exit(1)
                @unknown default:
                    fputs("ERROR: SPEECH_UNKNOWN_AUTH\n", stderr)
                    exit(1)
                }
            }
        }
    }

    // ── 2. Microphone Permission Check ───────────────────────────────────────
    private func checkMicrophoneAndSetup() {
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized:
            fputs("STATUS: MIC_AUTHORIZED\n", stderr)
            self.setupRecognizerAndAudio()
        case .notDetermined:
            fputs("STATUS: REQUESTING_MIC\n", stderr)
            AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if granted {
                        fputs("STATUS: MIC_AUTHORIZED\n", stderr)
                        self.setupRecognizerAndAudio()
                    } else {
                        fputs("ERROR: MIC_DENIED\n", stderr)
                        fputs("DIAGNOSTIC: Acceso al micrófono denegado. Permítelo en Ajustes del Sistema -> Privacidad y Seguridad -> Micrófono.\n", stderr)
                        exit(1)
                    }
                }
            }
        case .denied:
            fputs("ERROR: MIC_DENIED\n", stderr)
            fputs("DIAGNOSTIC: Acceso al micrófono denegado en Ajustes del Sistema.\n", stderr)
            exit(1)
        case .restricted:
            fputs("ERROR: MIC_RESTRICTED\n", stderr)
            exit(1)
        @unknown default:
            fputs("ERROR: MIC_UNKNOWN_AUTH\n", stderr)
            exit(1)
        }
    }

    // ── 3. Speech Recognizer & Audio Engine Setup ────────────────────────────
    private func setupRecognizerAndAudio() {
        guard let rec = SFSpeechRecognizer(locale: targetLocale) else {
            fputs("ERROR: NO_RECOGNIZER_FOR_LOCALE \(targetLocale.identifier)\n", stderr)
            exit(2)
        }

        self.recognizer = rec
        rec.delegate = self

        if !rec.isAvailable {
            fputs("STATUS: RECOGNIZER_CURRENTLY_UNAVAILABLE\n", stderr)
        }

        setupAudioEngine()
    }

    private func setupAudioEngine() {
        let inputNode = audioEngine.inputNode
        let busFormat = inputNode.outputFormat(forBus: 0)

        fputs("AUDIO_FORMAT sampleRate=\(busFormat.sampleRate) channels=\(busFormat.channelCount)\n", stderr)

        guard busFormat.sampleRate > 0 && busFormat.channelCount > 0 else {
            fputs("ERROR_BAD_AUDIO_FORMAT sampleRate=\(busFormat.sampleRate) channels=\(busFormat.channelCount)\n", stderr)
            exit(3)
        }

        // Install buffer tap once on the input node
        if !isTapInstalled {
            inputNode.installTap(onBus: 0, bufferSize: 2048, format: busFormat) { [weak self] buffer, _ in
                guard let self = self else { return }
                if !self.isPaused, let req = self.currentRequest {
                    req.append(buffer)
                }
            }
            isTapInstalled = true
        }

        do {
            audioEngine.prepare()
            try audioEngine.start()
            isEngineRunning = true
            fputs("LISTENING_READY\n", stderr)
            startSession()
        } catch {
            fputs("ERROR_ENGINE_START \(error.localizedDescription)\n", stderr)
            exit(3)
        }
    }

    // ── 4. Continuous Recognition Session Lifecycle ─────────────────────────
    func startSession() {
        guard isEngineRunning, !isPaused else { return }
        guard let recognizer = self.recognizer, recognizer.isAvailable else {
            fputs("STATUS: WAITING_FOR_RECOGNIZER\n", stderr)
            return
        }

        sessionGen += 1
        let gen = sessionGen

        // Teardown previous task/request
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

        // Brief delay to let cancellation callbacks flush cleanly
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
            guard let self = self, self.sessionGen == gen, !self.isPaused else { return }

            let req = SFSpeechAudioBufferRecognitionRequest()
            req.shouldReportPartialResults = true
            req.taskHint = .dictation
            self.currentRequest = req

            fputs("SESSION_STARTED gen=\(gen)\n", stderr)

            self.currentTask = recognizer.recognitionTask(with: req) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self = self, self.sessionGen == gen else { return }

                    if let r = result {
                        let text = r.bestTranscription.formattedString
                        if !text.isEmpty && text != self.lastTranscript {
                            self.lastTranscript = text
                            print("TRANSCRIPT: \(text)")

                            // Emit FINAL after 1.2 seconds of silence
                            self.silenceTimer?.cancel()
                            let timer = DispatchWorkItem { [weak self] in
                                guard let self = self, self.sessionGen == gen else { return }
                                if !self.lastTranscript.isEmpty {
                                    print("FINAL: \(self.lastTranscript)")
                                }
                                self.startSession()
                            }
                            self.silenceTimer = timer
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2, execute: timer)
                        }

                        if r.isFinal {
                            self.silenceTimer?.cancel()
                            self.silenceTimer = nil
                            if !text.isEmpty {
                                print("FINAL: \(text)")
                            }
                            self.startSession()
                        }
                    }

                    if let err = error {
                        guard self.sessionGen == gen, !self.isPaused else { return }
                        let nse = err as NSError
                        // Code 216 = session timeout / silence limit, Code 1110 = no speech detected
                        if nse.code == 216 || nse.code == 1110 {
                            fputs("SESSION_TIMEOUT gen=\(gen) code=\(nse.code)\n", stderr)
                        } else {
                            fputs("SESSION_ERROR gen=\(gen) code=\(nse.code) domain=\(nse.domain) desc=\(nse.localizedDescription)\n", stderr)
                        }

                        // Cycle recognition session seamlessly after cooldown
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
                            guard let self = self, self.sessionGen == gen, !self.isPaused else { return }
                            self.startSession()
                        }
                    }
                }
            }
        }
    }

    // ── 5. Stdin Commands ───────────────────────────────────────────────────
    func pause() {
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
    }

    func resume() {
        if isPaused {
            isPaused = false
            fputs("RESUMED\n", stderr)
            startSession()
        }
    }

    func quit() {
        fputs("QUITTING\n", stderr)
        if isEngineRunning {
            audioEngine.stop()
            if isTapInstalled {
                audioEngine.inputNode.removeTap(onBus: 0)
            }
        }
        exit(0)
    }

    // ── 6. Recognizer Availability Delegate ─────────────────────────────────
    func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if available {
                fputs("STATUS: RECOGNIZER_AVAILABLE\n", stderr)
                if !self.isPaused && self.isEngineRunning {
                    self.startSession()
                }
            } else {
                fputs("STATUS: RECOGNIZER_UNAVAILABLE\n", stderr)
            }
        }
    }
}

// ── 7. Global Lifecycle & Command Loop ──────────────────────────────────────
let controller = SofiSpeechController()

// Read Stdin in Background Thread
DispatchQueue.global(qos: .userInitiated).async {
    while let line = readLine() {
        let cmd = line.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if cmd.isEmpty { continue }

        DispatchQueue.main.async {
            switch cmd {
            case "PAUSE":
                controller.pause()
            case "RESUME":
                controller.resume()
            case "QUIT":
                controller.quit()
            default:
                fputs("UNKNOWN_CMD: \(cmd)\n", stderr)
            }
        }
    }
    // Stdin closed -> parent process terminated
    DispatchQueue.main.async {
        controller.quit()
    }
}

// Signal Handlers
signal(SIGINT)  { _ in exit(0) }
signal(SIGTERM) { _ in exit(0) }

// Start
controller.start()

// Run Loop keep alive
RunLoop.main.run()
