# sonic-pipe

High-speed data-over-sound library. Optimized fork of [ggwave](https://github.com/ggerganov/ggwave) with turbo/ultra protocols, SIMD acceleration, and up to **20x faster throughput**.

**[Live Demo & Benchmark](https://0xntive.github.io/sonic-pipe/)**

## Performance (50-byte payload)

| Protocol | Duration | Throughput | vs Original | Audible? |
|---|---|---|---|---|
| Audible Normal (baseline) | 4971 ms | 10.1 B/s | 1.0x | Yes |
| Audible Fastest | 1771 ms | 28.2 B/s | 2.8x | Yes |
| **Audible Turbo Wide** | **811 ms** | **61.7 B/s** | **6.1x** | Yes |
| **Audible Ultra Wide** | **341 ms** | **146.5 B/s** | **14.6x** | Yes |
| **Ultra Wide + ECC None** | **299 ms** | **167.4 B/s** | **16.6x** | Yes |
| **[U96] Ultra (96kHz)** | **245 ms** | **203.8 B/s** | **20.2x** | No |

## What's different from ggwave

### New protocols

| Protocol | Frames/Tx | Bytes/Tx | Band | Description |
|---|---|---|---|---|
| `AUDIBLE_TURBO` | 2 | 3 | Audible | Fast, good reliability |
| `AUDIBLE_TURBO_WIDE` | 2 | 5 | Audible | Wideband, very fast |
| `AUDIBLE_ULTRA` | 1 | 8 | Audible | Single-frame, max speed |
| `AUDIBLE_ULTRA_WIDE` | 1 | 10 | Audible | Fastest audible protocol |
| `ULTRASOUND_TURBO` | 2 | 3 | Ultrasound | Inaudible, fast |
| `ULTRASOUND_ULTRA` | 1 | 3 | Ultrasound | Inaudible, ultra fast |
| `ULTRASOUND_96K_TURBO` | 2 | 5 | 24-48kHz | Requires 96kHz sample rate |
| `ULTRASOUND_96K_ULTRA` | 1 | 5 | 24-48kHz | Fastest inaudible: 204 B/s |

### Computational optimizations

- **Sine LUT** — 4096-entry lookup table replaces `sin()` calls (4.2x encode speedup)
- **SIMD spectrum** — SSE2 and NEON vectorized FFT magnitude computation
- **Hann windowing** — Raised-cosine window enables reliable single-frame decode
- **Circular buffer resampler** — O(1) per sample instead of O(n) memmove
- **Float precision** — Hot path uses float32 instead of float64
- **Pre-computed bins** — Marker detection avoids redundant `bitFreq()` calls
- **Overlap-add decode** — 50% frame overlap for 2x marker detection resolution

### New features

- **Adaptive ECC** — Configurable error correction: `NONE`, `LOW`, `NORMAL`, `HIGH`
- **96kHz ultrasound** — Uses 24-48kHz band for inaudible high-speed transfer
- **Reduced markers** — 4 frames vs original 16 (75% less overhead)

## Quick Start (C/C++)

```c
#include "ggwave/ggwave.h"

// Create instance with minimal ECC for maximum speed
ggwave_Parameters params = ggwave_getDefaultParameters();
params.eccLevel = GGWAVE_ECC_LOW;
ggwave_Instance instance = ggwave_init(params);

// Encode at ultra speed
const char* msg = "Hello sonic-pipe!";
int waveSize = ggwave_encode(instance, msg, strlen(msg),
    GGWAVE_PROTOCOL_AUDIBLE_ULTRA_WIDE, 10, waveformBuffer, 0);

// Decode
int decoded = ggwave_decode(instance, waveformBuffer, waveSize, outputBuffer);

ggwave_free(instance);
```

## Quick Start (JavaScript/TypeScript)

```bash
npm install ggwave-turbo
```

```typescript
import { createSender, createReceiver, Protocol } from 'ggwave-turbo';

// Send data over sound
const sender = await createSender({ protocol: Protocol.AUDIBLE_ULTRA });
await sender.send("Hello world!");
sender.destroy();

// Receive data from sound
const receiver = await createReceiver((data) => {
  console.log('Received:', new TextDecoder().decode(data));
});
await receiver.start();
```

## Building

### C/C++ (native)

```bash
g++ -std=c++11 -O2 -march=native -I include src/ggwave.cpp your_app.cpp -o your_app
```

### WASM (for web)

```bash
# Install emscripten first: https://emscripten.org/docs/getting_started/downloads.html
source /path/to/emsdk/emsdk_env.sh
cd test-web && ./build.sh
```

### npm package

```bash
cd ggwave-turbo
npm run build
```

## Protocol selection guide

| Scenario | Recommended Protocol | ECC Level |
|---|---|---|
| Noisy room, far apart | `AUDIBLE_NORMAL` | `HIGH` |
| Quiet room, ~1 meter | `AUDIBLE_TURBO_WIDE` | `NORMAL` |
| Close range, quiet | `AUDIBLE_ULTRA_WIDE` | `LOW` |
| Same device loopback | `AUDIBLE_ULTRA_WIDE` | `NONE` |
| Inaudible transfer | `ULTRASOUND_TURBO` | `NORMAL` |
| Max inaudible speed | `ULTRASOUND_96K_ULTRA` | `LOW` |

## License

MIT — based on [ggwave](https://github.com/ggerganov/ggwave) by Georgi Gerganov.
