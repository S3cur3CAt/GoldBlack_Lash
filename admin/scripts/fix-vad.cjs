const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'voiceAssistant.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace "private analyser: AnalyserNode | null = null" with sourceNode + scriptProcessor
content = content.replace(
  'private analyser: AnalyserNode | null = null',
  `private sourceNode: MediaStreamAudioSourceNode | null = null
  private scriptProcessor: ScriptProcessorNode | null = null`
);

// 2. Add currentVolume after debugLogCounter
content = content.replace(
  'private debugLogCounter = 0',
  `private debugLogCounter = 0
  private currentVolume = 0`
);

// 3. Replace the initStreamAndAnalyser method body: new AudioCtx() -> matching sample rate
content = content.replace(
  `this.audioContext = new AudioCtx()`,
  `// Match AudioContext sample rate to mic native rate to avoid silence bugs
      let micSampleRate;
      try {
        const s = this.stream.getAudioTracks()[0]?.getSettings?.();
        if (s?.sampleRate) micSampleRate = s.sampleRate;
      } catch {}
      this.audioContext = micSampleRate ? new AudioCtx({ sampleRate: micSampleRate }) : new AudioCtx()`
);

// 4. Replace the AnalyserNode + silentGain audio pipeline with ScriptProcessorNode
const oldPipeline = `const source = this.audioContext.createMediaStreamSource(this.stream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.3

      source.connect(this.analyser)

      // CRITICAL FIX: Connect analyser to speakers through a SILENT gain node (gain=0).
      // Without a path to ctx.destination, some Chromium/Electron versions optimize away
      // the entire audio pipeline and getByteTimeDomainData() returns all 128s (= silence).
      // The zero-gain node ensures audio flows through the graph without producing audible output.
      const silentGain = this.audioContext.createGain()
      silentGain.gain.value = 0
      this.analyser.connect(silentGain)
      silentGain.connect(this.audioContext.destination)`;

const newPipeline = `// STORE source node as class property to prevent garbage collection
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)

      // Use ScriptProcessorNode for DIRECT PCM sample reading.
      // AnalyserNode.getByteTimeDomainData() returns all-128 (zeros) in Electron 11 / Chromium 87.
      // ScriptProcessorNode reads raw float PCM samples - most reliable across all Electron versions.
      const bufferSize = 2048
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

      this.scriptProcessor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        let sumSquares = 0
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i]
        }
        const rms = Math.sqrt(sumSquares / inputData.length)
        this.currentVolume = Math.min(rms * 4.5, 1.0)
      }

      // Connect: Mic -> Source -> ScriptProcessor -> Destination
      // onaudioprocess ONLY fires when connected to destination
      this.sourceNode.connect(this.scriptProcessor)
      this.scriptProcessor.connect(this.audioContext.destination)`;

content = content.replace(oldPipeline, newPipeline);

// 5. Replace the pipeline log message
content = content.replace(
  /console\.log\('\[Sofi VAD\] .*Pipeline de audio conectado.*'\)/,
  `console.log('[Sofi VAD] Pipeline: Mic -> Source -> ScriptProcessor(PCM) -> Destination')`
);

// 6. Replace the runLevelLoop checkLevels body: read from this.currentVolume instead of analyser
const oldCheck = `const checkLevels = () => {
      if (!this.analyser) return

      const timeData = new Uint8Array(this.analyser.fftSize)
      this.analyser.getByteTimeDomainData(timeData)

      let sumSquares = 0
      for (let i = 0; i < timeData.length; i++) {
        const normalized = (timeData[i] - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / timeData.length)
      const normalizedVol = Math.min(rms * 4.5, 1.0)`;

const newCheck = `const checkLevels = () => {
      // Read volume computed by ScriptProcessorNode (direct PCM, most reliable)
      const normalizedVol = this.currentVolume`;

content = content.replace(oldCheck, newCheck);

// 7. Simplify diagnostic log (remove rms)
content = content.replace(
  /console\.log\(`\[Sofi VAD\] mode=\$\{mode\} vol=\$\{normalizedVol\.toFixed\(4\)\} rms=\$\{rms\.toFixed\(5\)\} frames=\$\{this\.consecutiveSpeechFrames\}`\)/,
  "console.log(`[Sofi VAD] mode=${mode} vol=${normalizedVol.toFixed(4)} frames=${this.consecutiveSpeechFrames}`)"
);

// 8. Replace "this.analyser = null" with cleanup for sourceNode and scriptProcessor in stop() and cancel()
content = content.replaceAll(
  'this.analyser = null',
  `this.sourceNode = null
          this.scriptProcessor = null`
);

// 9. Also clean up scriptProcessor in cancel
content = content.replace(
  `    this.audioChunks = []
    this.preRollChunks = []
    this.headerChunk = null
    this.mediaRecorder = null
    this.sourceNode = null
          this.scriptProcessor = null`,
  `    if (this.scriptProcessor) {
      try { this.scriptProcessor.disconnect() } catch {}
      this.scriptProcessor = null
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect() } catch {}
      this.sourceNode = null
    }
    this.audioChunks = []
    this.preRollChunks = []
    this.headerChunk = null
    this.mediaRecorder = null`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! File updated successfully.');
console.log('Changes: AnalyserNode -> ScriptProcessorNode, stored sourceNode, matched sample rate');
