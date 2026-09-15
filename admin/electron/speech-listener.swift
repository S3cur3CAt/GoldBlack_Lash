import Foundation
import Cocoa
import Speech
import AVFoundation

// ═══════════════════════════════════════════════════════════════════════════════
// GoldBlack Lash — Sofi Native Continuous Speech Listener (macOS Monterey 12+)
// ═══════════════════════════════════════════════════════════════════════════════
// Robust Cocoa-based helper application with full TCC entitlement support.
// Features:
//   - NSApplication lifecycle (.accessory policy) for native macOS permission UI
//   - Detailed uncaught exception trapping for diagnostic transparency
//   - Lazy AVAudioEngine initialization after permission validation
//   - Asynchronous authorization handling without main-thread deadlocks
//   - Continuous recognition session cycling on silence or network timeouts
//   - Bidirectional IPC via stdio (PAUSE / RESUME / QUIT)
// ═══════════════════════════════════════════════════════════════════════════════

setbuf(stdout, nil)
setbuf(stderr, nil)

// Trap uncaught Objective-C exceptions to print exact diagnostics before SIGABRT
NSSetUncaughtExceptionHandler { exception in
    let name = exception.name.rawValue
    let reason = exception.reason ?? "Sin descripción"
    fputs("CRASH_EXCEPTION [\(name)]: \(reason)\n", stderr)
    for sym in exception.callStackSymbols.prefix(10) {
        fputs("  \(sym)\n", stderr)
    }
    fflush(stderr)
}

final class SofiSpeechController: NSObject, SFSpeechRecognizerDelegate {
    private var recognizer: SFSpeechRecognizer?
    private lazy var audioEngine = AVAudioEngine()
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

    // ── 1. Entry Point: Permission Diagnostics & Authorization ───────────────
    func start() {
        fputs("STATUS: INITIALIZING\n", stderr)
        fputs("BUNDLE_PATH: \(Bundle.main.bundlePath)\n", stderr)
        fputs("BUNDLE_ID: \(Bundle.main.bundleIdentifier ?? "nil")\n", stderr)

        let speechDesc = Bundle.main.object(forInfoDictionaryKey: "NSSpeechRecognitionUsageDescription") as? String ?? "nil"
        fputs("SPEECH_DESC: \(speechDesc)\n", stderr)

        let micDesc = Bundle.main.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription") as? String ?? "nil"
        fputs("MIC_DESC: \(micDesc)\n", stderr)
        fflush(stderr)

        // Check speech recognition authorization status first
        let speechStatus = SFSpeechRecognizer.authorizationStatus()
        fputs("CHECK: Speech status = \(speechStatus.rawValue)\n", stderr)
        fflush(stderr)

        switch speechStatus {
        case .authorized:
            fputs("STATUS: SPEECH_ALREADY_AUTHORIZED\n", stderr)
            self.checkMicrophoneAndSetup()

        case .denied:
            fputs("ERROR: SPEECH_DENIED\n", stderr)
            fputs("DIAGNOSTIC: El reconocimiento de voz está denegado en macOS. Ve a Ajustes del Sistema -> Privacidad y Seguridad -> Reconocimiento de voz y actívalo para GoldBlack Lash.\n", stderr)
            exit(1)

        case .restricted:
            fputs("ERROR: SPEECH_RESTRICTED\n", stderr)
            fputs("DIAGNOSTIC: Reconocimiento de voz restringido por directivas del sistema o controles parentales.\n", stderr)
            exit(1)

        case .notDetermined:
            fputs("STATUS: SPEECH_NOT_DETERMINED (macOS gestionará la autorización automáticamente al iniciar la tarea)\n", stderr)
            fflush(stderr)
            // En macOS, invocar SFSpeechRecognizer.requestAuthorization directamente en un helper
            // dispara un SIGABRT de TCC. La autorización se solicita de forma nativa e integrada
            // al iniciar el reconocimiento de voz (SFSpeechRecognitionTask) con AVAudioEngine.
            self.checkMicrophoneAndSetup()

        @unknown default:
            fputs("STATUS: SPEECH_UNKNOWN_STATUS, procediendo a inicializar\n", stderr)
            self.checkMicrophoneAndSetup()
        }
    }

    // ── 2. Microphone Permission Check ───────────────────────────────────────
    private func checkMicrophoneAndSetup() {
        let micStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        fputs("CHECK: Mic status = \(micStatus.rawValue)\n", stderr)
        fflush(stderr)

        switch micStatus {
        case .authorized:
            fputs("STATUS: MIC_AUTHORIZED\n", stderr)
            self.setupRecognizerAndAudio()

        case .notDetermined:
            fputs("STATUS: REQUESTING_MIC\n", stderr)
            fflush(stderr)
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
            fputs("STATUS: RECOGNIZER_CURRENTLY_UNAVAILABLE (esperando conexión con Siri/Dictado)\n", stderr)
        } else {
            fputs("STATUS: RECOGNIZER_AVAILABLE\n", stderr)
        }

        setupAudioEngine()
    }

    private func setupAudioEngine() {
        let inputNode = audioEngine.inputNode
        let busFormat = inputNode.outputFormat(forBus: 0)

        fputs("AUDIO_FORMAT sampleRate=\(busFormat.sampleRate) channels=\(busFormat.channelCount)\n", stderr)
        fflush(stderr)

        let targetFormat: AVAudioFormat
        if busFormat.sampleRate > 0 && busFormat.channelCount > 0 {
            targetFormat = busFormat
        } else {
            let altFormat = inputNode.inputFormat(forBus: 0)
            if altFormat.sampleRate > 0 && altFormat.channelCount > 0 {
                targetFormat = altFormat
            } else if let fallback = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1) {
                targetFormat = fallback
            } else {
                fputs("ERROR_BAD_AUDIO_FORMAT sampleRate=\(busFormat.sampleRate) channels=\(busFormat.channelCount)\n", stderr)
                exit(3)
            }
        }

        // Install buffer tap once on the input node
        if !isTapInstalled {
            inputNode.installTap(onBus: 0, bufferSize: 2048, format: targetFormat) { [weak self] buffer, _ in
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
            fflush(stderr)
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
            fflush(stderr)

            self.currentTask = recognizer.recognitionTask(with: req) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self = self, self.sessionGen == gen else { return }

                    if let r = result {
                        let text = r.bestTranscription.formattedString
                        if !text.isEmpty && text != self.lastTranscript {
                            self.lastTranscript = text
                            print("TRANSCRIPT: \(text)")
                            fflush(stdout)

                            // Emit FINAL after 1.2 seconds of silence
                            self.silenceTimer?.cancel()
                            let timer = DispatchWorkItem { [weak self] in
                                guard let self = self, self.sessionGen == gen else { return }
                                if !self.lastTranscript.isEmpty {
                                    print("FINAL: \(self.lastTranscript)")
                                    fflush(stdout)
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
                                fflush(stdout)
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
                        } else if nse.code == 1700 || nse.domain == "kAFAssistantErrorDomain" {
                            fputs("ERROR: SPEECH_DENIED\n", stderr)
                            fputs("DIAGNOSTIC: Reconocimiento de voz denegado en el diálogo del sistema. Permítelo en Ajustes del Sistema -> Privacidad y Seguridad -> Reconocimiento de voz.\n", stderr)
                            fflush(stderr)
                            exit(1)
                        } else {
                            fputs("SESSION_ERROR gen=\(gen) code=\(nse.code) domain=\(nse.domain) desc=\(nse.localizedDescription)\n", stderr)
                        }
                        fflush(stderr)

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
        fflush(stderr)
    }

    func resume() {
        if isPaused {
            isPaused = false
            fputs("RESUMED\n", stderr)
            fflush(stderr)
            startSession()
        }
    }

    func quit() {
        fputs("QUITTING\n", stderr)
        fflush(stderr)
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
                fflush(stderr)
                if !self.isPaused && self.isEngineRunning {
                    self.startSession()
                }
            } else {
                fputs("STATUS: RECOGNIZER_UNAVAILABLE\n", stderr)
                fflush(stderr)
            }
        }
    }
}

// ── 7. Global Lifecycle & Cocoa NSApplication RunLoop ───────────────────────
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
                fflush(stderr)
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

// Cocoa App Configuration (.accessory -> no Dock icon, full WindowServer/TCC support)
let app = NSApplication.shared
app.setActivationPolicy(.accessory)

class SofiAppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        controller.start()
    }
}

let appDelegate = SofiAppDelegate()
app.delegate = appDelegate
app.run()
