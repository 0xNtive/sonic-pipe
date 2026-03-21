/**
 * ggwave-turbo — High-speed data-over-sound
 *
 * Optimized fork of ggwave with turbo/ultra protocols,
 * SIMD acceleration, and up to 15x faster throughput.
 */

// ─── Protocol Enum ──────────────────────────────────────────

export enum Protocol {
  /** Audible band, 9 frames/tx, 3 bytes/tx — ~10 B/s */
  AUDIBLE_NORMAL = 0,
  /** Audible band, 6 frames/tx, 3 bytes/tx — ~15 B/s */
  AUDIBLE_FAST = 1,
  /** Audible band, 3 frames/tx, 3 bytes/tx — ~28 B/s */
  AUDIBLE_FASTEST = 2,

  /** Ultrasound band, 9 frames/tx — inaudible, ~10 B/s */
  ULTRASOUND_NORMAL = 3,
  /** Ultrasound band, 6 frames/tx — inaudible, ~15 B/s */
  ULTRASOUND_FAST = 4,
  /** Ultrasound band, 3 frames/tx — inaudible, ~28 B/s */
  ULTRASOUND_FASTEST = 5,

  /** Turbo: 2 frames/tx, 3 bytes/tx — ~40 B/s */
  AUDIBLE_TURBO = 6,
  /** Turbo Wide: 2 frames/tx, 5 bytes/tx — ~62 B/s */
  AUDIBLE_TURBO_WIDE = 7,
  /** Ultrasound Turbo: 2 frames/tx — inaudible, ~40 B/s */
  ULTRASOUND_TURBO = 8,

  /** Ultra: 1 frame/tx, 8 bytes/tx — ~130 B/s */
  AUDIBLE_ULTRA = 9,
  /** Ultra Wide: 1 frame/tx, 10 bytes/tx — ~147 B/s (fastest) */
  AUDIBLE_ULTRA_WIDE = 10,
  /** Ultrasound Ultra: 1 frame/tx — inaudible, ~71 B/s */
  ULTRASOUND_ULTRA = 11,
}

// ─── Types ──────────────────────────────────────────────────

export interface GGWaveParameters {
  payloadLength: number;
  sampleRateInp: number;
  sampleRateOut: number;
  sampleRate: number;
  samplesPerFrame: number;
  soundMarkerThreshold: number;
  sampleFormatInp: number;
  sampleFormatOut: number;
  operatingMode: number;
}

export interface GGWaveModule {
  getDefaultParameters(): GGWaveParameters;
  init(params: GGWaveParameters): number;
  free(instance: number): void;
  encode(instance: number, data: string, protocolId: number, volume: number): Uint8Array;
  decode(instance: number, waveform: Uint8Array | Int8Array): Uint8Array;
  disableLog(): void;
  enableLog(): void;
  ProtocolId: Record<string, number>;
  GGWAVE_OPERATING_MODE_RX: number;
  GGWAVE_OPERATING_MODE_TX: number;
  GGWAVE_OPERATING_MODE_RX_AND_TX: number;
  GGWAVE_OPERATING_MODE_TX_ONLY_TONES: number;
  GGWAVE_OPERATING_MODE_USE_DSS: number;
}

export interface SenderOptions {
  /** Protocol to use. Default: AUDIBLE_TURBO_WIDE */
  protocol?: Protocol;
  /** Volume 1–50. Default: 10 */
  volume?: number;
  /** Sample rate. Default: 48000 */
  sampleRate?: number;
}

export interface ReceiverOptions {
  /** Sample rate. Default: 48000 */
  sampleRate?: number;
  /** Protocols to listen for. Default: all */
  protocols?: Protocol[];
}

export interface Sender {
  /** Encode text/binary and play through speakers */
  send(data: string | Uint8Array): Promise<void>;
  /** Encode and return raw waveform (Float32Array) without playing */
  encode(data: string | Uint8Array): Float32Array;
  /** Duration of last encoded waveform in milliseconds */
  lastDurationMs: number;
  /** Clean up resources */
  destroy(): void;
}

export interface Receiver {
  /** Start listening on microphone */
  start(): Promise<void>;
  /** Stop listening */
  stop(): void;
  /** Whether currently listening */
  readonly listening: boolean;
  /** Clean up resources */
  destroy(): void;
}

// ─── Module Loader ──────────────────────────────────────────

let _modulePromise: Promise<GGWaveModule> | null = null;

/**
 * Load the ggwave WASM module. Cached after first call.
 */
export async function loadModule(): Promise<GGWaveModule> {
  if (_modulePromise) return _modulePromise;

  _modulePromise = (async () => {
    // In browser: load via script tag or import
    // In Node: require the ggwave.js file
    if (typeof window !== 'undefined' && typeof (window as any).ggwave_factory === 'function') {
      return await (window as any).ggwave_factory();
    }

    // Try dynamic import / require
    try {
      const factory = require('./ggwave.js');
      return await factory();
    } catch {
      throw new Error(
        'ggwave WASM module not found. In browser, load ggwave.js via <script> tag before calling loadModule(). ' +
        'In Node, ensure dist/ggwave.js exists (run npm run build:wasm).'
      );
    }
  })();

  return _modulePromise;
}

// ─── Helpers ────────────────────────────────────────────────

function convertToFloat32(src: Uint8Array): Float32Array {
  const buf = new ArrayBuffer(src.byteLength);
  new Uint8Array(buf).set(src);
  return new Float32Array(buf);
}

function convertToInt8(src: Float32Array): Int8Array {
  const buf = new ArrayBuffer(src.byteLength);
  new Float32Array(buf).set(src);
  return new Int8Array(buf);
}

const PROTOCOL_KEY_MAP: Record<Protocol, string> = {
  [Protocol.AUDIBLE_NORMAL]:     'GGWAVE_PROTOCOL_AUDIBLE_NORMAL',
  [Protocol.AUDIBLE_FAST]:       'GGWAVE_PROTOCOL_AUDIBLE_FAST',
  [Protocol.AUDIBLE_FASTEST]:    'GGWAVE_PROTOCOL_AUDIBLE_FASTEST',
  [Protocol.ULTRASOUND_NORMAL]:  'GGWAVE_PROTOCOL_ULTRASOUND_NORMAL',
  [Protocol.ULTRASOUND_FAST]:    'GGWAVE_PROTOCOL_ULTRASOUND_FAST',
  [Protocol.ULTRASOUND_FASTEST]: 'GGWAVE_PROTOCOL_ULTRASOUND_FASTEST',
  [Protocol.AUDIBLE_TURBO]:      'GGWAVE_PROTOCOL_AUDIBLE_TURBO',
  [Protocol.AUDIBLE_TURBO_WIDE]: 'GGWAVE_PROTOCOL_AUDIBLE_TURBO_WIDE',
  [Protocol.ULTRASOUND_TURBO]:   'GGWAVE_PROTOCOL_ULTRASOUND_TURBO',
  [Protocol.AUDIBLE_ULTRA]:      'GGWAVE_PROTOCOL_AUDIBLE_ULTRA',
  [Protocol.AUDIBLE_ULTRA_WIDE]: 'GGWAVE_PROTOCOL_AUDIBLE_ULTRA_WIDE',
  [Protocol.ULTRASOUND_ULTRA]:   'GGWAVE_PROTOCOL_ULTRASOUND_ULTRA',
};

function resolveProtocolId(gg: GGWaveModule, protocol: Protocol): number {
  const key = PROTOCOL_KEY_MAP[protocol];
  if (!key) throw new Error(`Unknown protocol: ${protocol}`);
  const id = gg.ProtocolId[key];
  if (id === undefined) throw new Error(`Protocol ${key} not available in this build`);
  return id;
}

// ─── High-Level API ─────────────────────────────────────────

/**
 * Create a sender that encodes data into audio and plays it.
 *
 * @example
 * ```ts
 * const sender = await createSender({ protocol: Protocol.AUDIBLE_ULTRA });
 * await sender.send("Hello world!");
 * console.log(`Took ${sender.lastDurationMs}ms of audio`);
 * sender.destroy();
 * ```
 */
export async function createSender(options: SenderOptions = {}): Promise<Sender> {
  const gg = await loadModule();
  const sampleRate = options.sampleRate ?? 48000;
  const volume = options.volume ?? 10;
  const protocol = options.protocol ?? Protocol.AUDIBLE_TURBO_WIDE;

  const params = gg.getDefaultParameters();
  params.sampleRateInp = sampleRate;
  params.sampleRateOut = sampleRate;
  params.operatingMode = gg.GGWAVE_OPERATING_MODE_TX;
  const instance = gg.init(params);

  const protoId = resolveProtocolId(gg, protocol);

  let audioCtx: AudioContext | null = null;
  let lastDurationMs = 0;

  function getCtx(): AudioContext {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    }
    return audioCtx;
  }

  function encode(data: string | Uint8Array): Float32Array {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const waveform = gg.encode(instance, text, protoId, volume);
    const f32 = convertToFloat32(waveform);
    lastDurationMs = (f32.length / sampleRate) * 1000;
    return f32;
  }

  async function send(data: string | Uint8Array): Promise<void> {
    const ctx = getCtx();
    await ctx.resume();
    const f32 = encode(data);
    const buffer = ctx.createBuffer(1, f32.length, sampleRate);
    buffer.getChannelData(0).set(f32);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start(0);
    });
  }

  function destroy() {
    gg.free(instance);
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  }

  return {
    send,
    encode,
    get lastDurationMs() { return lastDurationMs; },
    destroy,
  };
}

/**
 * Create a receiver that listens on the microphone and decodes incoming data.
 *
 * @example
 * ```ts
 * const receiver = await createReceiver({
 *   onMessage: (data) => console.log('Received:', new TextDecoder().decode(data)),
 * });
 * await receiver.start();
 * // ... later
 * receiver.stop();
 * receiver.destroy();
 * ```
 */
export async function createReceiver(
  onMessage: (data: Uint8Array) => void,
  options: ReceiverOptions = {},
): Promise<Receiver> {
  const gg = await loadModule();
  const sampleRate = options.sampleRate ?? 48000;

  const params = gg.getDefaultParameters();
  params.sampleRateInp = sampleRate;
  params.sampleRateOut = sampleRate;
  params.operatingMode = gg.GGWAVE_OPERATING_MODE_RX;
  const instance = gg.init(params);

  let audioCtx: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let mediaStream: MediaStreamAudioSourceNode | null = null;
  let _listening = false;

  async function start() {
    if (_listening) return;

    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    await audioCtx.resume();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
    });

    mediaStream = audioCtx.createMediaStreamSource(stream);
    processor = audioCtx.createScriptProcessor(1024, 1, 1);

    processor.onaudioprocess = (e) => {
      const input = new Float32Array(e.inputBuffer.getChannelData(0));
      const res = gg.decode(instance, convertToInt8(input));
      if (res && res.length > 0) {
        onMessage(new Uint8Array(res));
      }
    };

    mediaStream.connect(processor);
    processor.connect(audioCtx.destination);
    _listening = true;
  }

  function stop() {
    if (!_listening) return;
    if (processor && audioCtx) {
      processor.disconnect(audioCtx.destination);
    }
    if (mediaStream && processor) {
      mediaStream.disconnect(processor);
    }
    processor = null;
    mediaStream = null;
    _listening = false;
  }

  function destroy() {
    stop();
    gg.free(instance);
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  }

  return {
    start,
    stop,
    get listening() { return _listening; },
    destroy,
  };
}

// ─── Re-exports ─────────────────────────────────────────────

export { loadModule as init };
export default { Protocol, createSender, createReceiver, loadModule };
