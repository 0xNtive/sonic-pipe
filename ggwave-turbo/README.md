# ggwave-turbo

High-speed data-over-sound library. Optimized fork of [ggwave](https://github.com/ggerganov/ggwave) with turbo/ultra protocols, SIMD acceleration, and up to **15x faster throughput**.

## Performance

| Protocol | Throughput (50B payload) | vs Original |
|---|---|---|
| Audible Normal (original) | 10 B/s | 1.0x |
| Audible Fastest (original) | 28 B/s | 2.8x |
| **Audible Turbo Wide** | **62 B/s** | **6.1x** |
| **Audible Ultra** | **130 B/s** | **12.9x** |
| **Audible Ultra Wide** | **147 B/s** | **14.6x** |

## Install

```bash
npm install ggwave-turbo
```

## Quick Start

### Send data over sound

```typescript
import { createSender, Protocol } from 'ggwave-turbo';

const sender = await createSender({
  protocol: Protocol.AUDIBLE_ULTRA,  // 130 B/s
  volume: 10,
});

await sender.send("Hello world!");
console.log(`Audio duration: ${sender.lastDurationMs}ms`);

sender.destroy();
```

### Receive data from sound

```typescript
import { createReceiver } from 'ggwave-turbo';

const receiver = await createReceiver((data) => {
  const text = new TextDecoder().decode(data);
  console.log('Received:', text);
});

await receiver.start();
// ... later
receiver.stop();
receiver.destroy();
```

### Encode without playing (for custom audio pipelines)

```typescript
import { createSender, Protocol } from 'ggwave-turbo';

const sender = await createSender({ protocol: Protocol.AUDIBLE_TURBO_WIDE });
const waveform = sender.encode("binary data here");
// waveform is a Float32Array — feed it to your own audio pipeline
```

## Protocols

| Protocol | Band | Speed | Reliability | Use Case |
|---|---|---|---|---|
| `AUDIBLE_NORMAL` | Audible | Slow | Highest | Noisy environments |
| `AUDIBLE_FAST` | Audible | Medium | High | General purpose |
| `AUDIBLE_FASTEST` | Audible | Fast | Good | Quiet rooms |
| `AUDIBLE_TURBO` | Audible | Faster | Good | Close range |
| `AUDIBLE_TURBO_WIDE` | Audible | Very fast | Good | Close range, wideband |
| `AUDIBLE_ULTRA` | Audible | Ultra fast | Fair | Very close, quiet |
| `AUDIBLE_ULTRA_WIDE` | Audible | Maximum | Fair | Very close, quiet |
| `ULTRASOUND_*` | Ultrasound | Varies | Varies | Inaudible to humans |

Faster protocols need cleaner audio conditions (closer distance, less background noise).

## Optimizations over upstream ggwave

- **Turbo/Ultra protocols**: `framesPerTx=2` and `framesPerTx=1` with up to 10 simultaneous bytes
- **Sine lookup table**: 4096-entry LUT replaces `sin()` calls (4x encode speedup)
- **SIMD spectrum**: SSE2/NEON vectorized magnitude computation
- **Hann windowing**: Proper raised-cosine window enables reliable single-frame decode
- **Circular buffer resampler**: O(1) vs O(n) per sample when resampling
- **Reduced markers**: 4 frames vs original 16 for variable-length mode
- **Float precision**: Hot path uses float32 instead of float64

## Building from source

```bash
# Install emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install latest && ./emsdk activate latest
source emsdk_env.sh

# Build
cd ggwave-turbo
npm run build:wasm
npm run build:js
```

## License

MIT — based on [ggwave](https://github.com/ggerganov/ggwave) by Georgi Gerganov.
